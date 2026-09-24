[CmdletBinding()]
param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'
$packageVersion = '0.4.28'
$supportedCodexVersion = '26.917.9434.0'
$bundleDir = $PSScriptRoot
$required = @(
    'Codex.exe','Launcher.cs','sidebar-toggle.js','inject.cjs','README.md',
    '卸载.ps1','卸载.cmd','交给其他Codex一键安装.md','codex-one-click-install.ps1','安装.ps1','安装.cmd','verify-live-update.cjs'
)

function Get-Sha256([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
}

function Test-DebugPort([int]$Port) {
    try {
        $targets = @(Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/list" -TimeoutSec 2)
        return [bool]($targets | Where-Object { $_.type -eq 'page' -and $_.url -like 'app://-/*' } | Select-Object -First 1)
    } catch { return $false }
}

function Set-AtomicFile([string]$Source, [string]$Destination) {
    $temp = $Destination + '.' + [Guid]::NewGuid().ToString('N') + '.tmp'
    Copy-Item -LiteralPath $Source -Destination $temp
    if (Test-Path -LiteralPath $Destination) {
        $swapBackup = $temp + '.bak'
        [IO.File]::Replace($temp, $Destination, $swapBackup)
        [IO.File]::Delete($swapBackup)
    } else {
        [IO.File]::Move($temp, $Destination)
    }
}

try {
    foreach ($name in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path $bundleDir $name) -PathType Leaf)) { throw "安装包缺少文件：$name" }
    }
    $manifestPath = Join-Path $bundleDir 'SHA256SUMS.txt'
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw '安装包缺少 SHA256SUMS.txt。' }
    $manifestNames = @()
    foreach ($line in Get-Content -LiteralPath $manifestPath -Encoding UTF8) {
        if ($line -notmatch '^([A-Fa-f0-9]{64})  (.+)$') { throw 'SHA256SUMS.txt 格式错误。' }
        $expectedHash = $Matches[1].ToUpperInvariant()
        $relativeName = $Matches[2]
        if ([IO.Path]::IsPathRooted($relativeName) -or $relativeName -match '(^|[\\/])\.\.([\\/]|$)') { throw '校验清单包含无效路径。' }
        $source = Join-Path $bundleDir $relativeName
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "校验清单中的文件不存在：$relativeName" }
        if ((Get-Sha256 $source) -ne $expectedHash) { throw "安装包文件校验失败：$relativeName" }
        $manifestNames += $relativeName
    }
    foreach ($name in $required) { if ($manifestNames -notcontains $name) { throw "校验清单未包含文件：$name" } }

    $versionMatch = [regex]::Match((Get-Content -LiteralPath (Join-Path $bundleDir 'sidebar-toggle.js') -Raw -Encoding UTF8), "VERSION\s*=\s*'([^']+)'")
    if (-not $versionMatch.Success) { throw '无法读取侧栏脚本版本，拒绝安装。' }
    $scriptVersion = $versionMatch.Groups[1].Value

    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) { throw '需要 Node.js 22 或更新版本。' }
    $nodeVersion = (& $node.Source --version).Trim()
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) { throw "需要 Node.js 22 或更新版本，当前为 $nodeVersion。" }
    $package = Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $package) { throw '未找到 Windows 版 Codex。' }
    if ([string]$package.Version -ne $supportedCodexVersion) { throw "当前安装包适配 Codex $supportedCodexVersion，检测到 $($package.Version)，请获取对应适配包。" }
    $officialExe = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
    if (-not (Test-Path -LiteralPath $officialExe -PathType Leaf)) { throw '未找到 Codex 官方启动文件。' }

    $installDir = Join-Path $env:LOCALAPPDATA 'CodexSidebarEnhancement'
    $oldScript = Join-Path $installDir 'sidebar-toggle.js'
    $oldInjector = Join-Path $installDir 'inject.cjs'
    $newScriptHash = Get-Sha256 (Join-Path $bundleDir 'sidebar-toggle.js')
    $newInjectorHash = Get-Sha256 (Join-Path $bundleDir 'inject.cjs')
    $oldScriptHash = if (Test-Path -LiteralPath $oldScript) { Get-Sha256 $oldScript } else { '' }
    $oldInjectorHash = if (Test-Path -LiteralPath $oldInjector) { Get-Sha256 $oldInjector } else { '' }
    if ($oldScriptHash -and $oldScriptHash -ne $newScriptHash) {
        $oldVersionMatch = [regex]::Match((Get-Content -LiteralPath $oldScript -Raw -Encoding UTF8), "VERSION\s*=\s*'([^']+)'")
        if ($oldVersionMatch.Success -and $oldVersionMatch.Groups[1].Value -eq $scriptVersion) {
            throw "侧栏脚本内容变了但版本仍为 $scriptVersion；请递增 sidebar-toggle.js 的 VERSION 后再打包，避免热更新被旧页面忽略。"
        }
    }
    if ($CheckOnly) {
        Write-Output "CHECK_OK package=$packageVersion script=$scriptVersion codex=$($package.Version) node=$nodeVersion"
        exit 0
    }

    $injectPath = Join-Path $installDir 'inject.cjs'
    $watchers = @()
    foreach ($process in Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue) {
        if (-not $process.CommandLine -or $process.CommandLine.IndexOf($injectPath, [StringComparison]::OrdinalIgnoreCase) -lt 0) { continue }
        if ($process.CommandLine -match '\s(?<port>\d+)\s*$') {
            $port = [int]$Matches['port']
            if ($port -ge 1024 -and $port -le 65535 -and (Test-DebugPort $port)) { $watchers += [pscustomobject]@{ Id=[int]$process.ProcessId; Port=$port } }
        }
    }
    $debugPorts = @()
    foreach ($process in Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue) {
        if ($process.CommandLine -and $process.CommandLine -notmatch '(?:^|\s)--type=' -and $process.CommandLine -match '(?:^|\s)--remote-debugging-port=(\d+)') {
            $port = [int]$Matches[1]
            if ($port -ge 1024 -and $port -le 65535 -and (Test-DebugPort $port)) { $debugPorts += $port }
        }
    }
    $hotPorts = @(@($watchers | ForEach-Object Port) + $debugPorts | Select-Object -Unique)

    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    $deployNames = @('Codex.exe','Launcher.cs','inject.cjs','README.md','卸载.ps1','卸载.cmd','交给其他Codex一键安装.md','codex-one-click-install.ps1','安装.ps1','安装.cmd','SHA256SUMS.txt','sidebar-toggle.js')
    $changedNames = @()
    foreach ($name in $deployNames) {
        $source = Join-Path $bundleDir $name
        $destination = Join-Path $installDir $name
        if (-not (Test-Path -LiteralPath $destination) -or (Get-Sha256 $source) -ne (Get-Sha256 $destination)) { $changedNames += $name }
    }
    if ($changedNames.Count -gt 0) {
        $backupDir = Join-Path (Join-Path $installDir 'backups') ('package-update-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
        $hasOldFiles = $false
        foreach ($name in $changedNames) { if (Test-Path -LiteralPath (Join-Path $installDir $name)) { $hasOldFiles = $true } }
        if ($hasOldFiles) { New-Item -ItemType Directory -Path $backupDir -Force | Out-Null }
        foreach ($name in $deployNames) {
            if ($changedNames -notcontains $name) { continue }
            $source = Join-Path $bundleDir $name
            $destination = Join-Path $installDir $name
            if (Test-Path -LiteralPath $destination) { Copy-Item -LiteralPath $destination -Destination (Join-Path $backupDir $name) -Force }
            Set-AtomicFile $source $destination
        }
    }
    [IO.File]::WriteAllLines((Join-Path $installDir 'launcher.config'), @($officialExe,$node.Source), [Text.UTF8Encoding]::new($false))

    $shell = New-Object -ComObject WScript.Shell
    foreach ($entry in @(
        @{ Path = (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Codex.lnk'); Backup = 'desktop-original.lnk' },
        @{ Path = (Join-Path ([Environment]::GetFolderPath('Programs')) 'Codex.lnk'); Backup = 'start-original.lnk' }
    )) {
        if (Test-Path -LiteralPath $entry.Path) {
            $existing = $shell.CreateShortcut($entry.Path)
            $existingTarget = if ($existing.TargetPath) { [IO.Path]::GetFullPath($existing.TargetPath) } else { '' }
            $insideEnhancement = $existingTarget.StartsWith([IO.Path]::GetFullPath($installDir), [StringComparison]::OrdinalIgnoreCase)
            $shortcutBackup = Join-Path $installDir $entry.Backup
            if (-not $insideEnhancement -and -not (Test-Path -LiteralPath $shortcutBackup)) { Copy-Item -LiteralPath $entry.Path -Destination $shortcutBackup -Force }
        }
        $shortcut = $shell.CreateShortcut($entry.Path)
        $shortcut.TargetPath = Join-Path $installDir 'Codex.exe'
        $shortcut.Arguments = ''
        $shortcut.WorkingDirectory = $installDir
        $shortcut.Description = 'Codex · 自动加载侧栏增强 ' + $packageVersion
        $shortcut.IconLocation = $officialExe + ',0'
        $shortcut.Save()
    }

    $injectChanged = $oldInjectorHash -and $oldInjectorHash -ne $newInjectorHash
    if ($hotPorts.Count -gt 0) {
        if ($injectChanged) {
            foreach ($watcher in $watchers) { Stop-Process -Id $watcher.Id -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Milliseconds 500
            foreach ($port in $hotPorts) {
                $arguments = '"' + $injectPath + '" ' + $port
                Start-Process -FilePath $node.Source -ArgumentList $arguments -WorkingDirectory $installDir -WindowStyle Hidden
            }
        } else {
            $watchedPorts = @($watchers | ForEach-Object Port)
            foreach ($port in $hotPorts) {
                if ($watchedPorts -notcontains $port) {
                    $arguments = '"' + $injectPath + '" ' + $port
                    Start-Process -FilePath $node.Source -ArgumentList $arguments -WorkingDirectory $installDir -WindowStyle Hidden
                }
            }
        }

        $live = $false
        $liveDeadline = (Get-Date).AddSeconds(45)
        while (-not $live -and (Get-Date) -lt $liveDeadline) {
            foreach ($port in $hotPorts) {
                $probeOutput = & $node.Source (Join-Path $bundleDir 'verify-live-update.cjs') $port $scriptVersion
                if ($LASTEXITCODE -eq 0 -and ($probeOutput -join '') -match 'LIVE_OK') { $live = $true; break }
            }
            if (-not $live) { Start-Sleep -Milliseconds 500 }
        }
        if ($live) {
            Write-Output "INSTALL_OK version=$packageVersion script=$scriptVersion mode=hot-update codex=$($package.Version) node=$nodeVersion path=$installDir"
            Write-Output '热更新已在当前 Codex 页面确认生效，无需重启 Codex。'
        } else {
            Write-Warning '文件已安装，但暂未在当前 Codex 页面确认热更新；请稍后检查，或使用新快捷方式重新启动。'
            Write-Output "INSTALL_OK version=$packageVersion script=$scriptVersion mode=hot-update-pending codex=$($package.Version) path=$installDir"
        }
    } else {
        Write-Output "INSTALL_OK version=$packageVersion script=$scriptVersion mode=next-launch codex=$($package.Version) node=$nodeVersion path=$installDir"
        Write-Output '当前没有可连接的 Codex 调试页面；首次安装后请完全退出 Codex，再从新快捷方式启动。后续版本可在增强已运行时热更新。'
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
