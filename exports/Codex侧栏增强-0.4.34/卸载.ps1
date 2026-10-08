$ErrorActionPreference='Stop'
try {
    $targetDir=[IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'CodexSidebarEnhancement'))
    if([IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') -ne $targetDir.TrimEnd('\')){throw '请运行安装目录 %LOCALAPPDATA%\CodexSidebarEnhancement 中的卸载程序。'}
    if(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue){throw '请先完全退出 Codex。'}
    $shell=New-Object -ComObject WScript.Shell
    foreach($entry in @(@{Path=(Join-Path ([Environment]::GetFolderPath('Desktop')) 'Codex.lnk');Backup='desktop-original.lnk'},@{Path=(Join-Path ([Environment]::GetFolderPath('Programs')) 'Codex.lnk');Backup='start-original.lnk'})){
        if(Test-Path -LiteralPath $entry.Path){
            if($shell.CreateShortcut($entry.Path).TargetPath -eq (Join-Path $targetDir 'Codex.exe')){
                Remove-Item -LiteralPath $entry.Path
                $backup=Join-Path $targetDir $entry.Backup
                if(Test-Path -LiteralPath $backup){Copy-Item -LiteralPath $backup -Destination $entry.Path;Remove-Item -LiteralPath $backup}
            }
        }
    }
    foreach($name in @('Codex.exe','Launcher.cs','launcher.config','sidebar-toggle.js','inject.cjs','native-list-loader.cjs','卸载.cmd','README.md','probe.log','卸载.ps1')){
        $file=Join-Path $targetDir $name
        if(Test-Path -LiteralPath $file){Remove-Item -LiteralPath $file -Force}
    }
    Write-Host '卸载完成，原快捷方式已恢复，Codex 和聊天数据保留。' -ForegroundColor Green
} catch {Write-Host $_.Exception.Message -ForegroundColor Red}
Read-Host '按回车关闭'
