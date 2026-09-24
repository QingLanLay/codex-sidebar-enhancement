# 给其他 Codex 的一键安装说明（0.4.28）

将本说明和 `Codex侧栏增强-0.4.28-Windows.zip` 一起交给目标电脑上的 Codex。请让 Codex 在二者所在目录读取本说明并执行安装；不要只复制 ZIP 内的单个文件。

## 给 Codex 的执行指令

请在当前目录运行下面这段 PowerShell：它会定位 ZIP、解压到临时目录并启动包内的一键安装器。无需管理员权限。

```powershell
$ErrorActionPreference = 'Stop'
$zip = Get-ChildItem -LiteralPath (Get-Location).Path -Filter 'Codex侧栏增强-0.4.28-Windows.zip' -File | Select-Object -First 1
if (-not $zip) { throw '当前目录没有 Codex侧栏增强-0.4.28-Windows.zip；请先把完整安装包放到这里。' }
$extract = Join-Path $env:TEMP ('CodexSidebarEnhancement-0.4.28-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $zip.FullName -DestinationPath $extract
$bundle = Join-Path $extract 'Codex侧栏增强-0.4.28'
$installer = Join-Path $bundle 'codex-one-click-install.ps1'
if (-not (Test-Path -LiteralPath $installer)) { throw '压缩包结构不完整，找不到一键安装脚本。' }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
if ($LASTEXITCODE -ne 0) { throw '安装失败；请将完整错误信息反馈给用户。' }
```

不要更改脚本内容或绕过检查。安装器会验证包内 SHA-256、Node.js 和 Codex 版本；只写入当前 Windows 用户的 `%LOCALAPPDATA%\CodexSidebarEnhancement`，并备份被替换的增强文件及原 Codex 快捷方式。不会修改 `WindowsApps` 中的 Codex 文件，不会覆盖额度密钥、聊天数据库或其他用户数据。

## 热更新行为

- 如果旧版增强正在运行且调试页面可连接，安装器会原子替换文件，等待当前页面确认新脚本版本，并输出 `INSTALL_OK ... mode=hot-update`。通常几秒内生效，不需要退出或重启 Codex。
- 若 `inject.cjs` 本身有变化，只会在后台重启增强的 Node 注入监视进程，再连接原 Codex 页面；不会关闭 Codex。
- 首次安装或 Codex 当前启动方式没有可连接的调试页面时，会输出 `mode=next-launch`。安装器不会强行关闭应用；此时按提示退出 Codex，再从新建的桌面/开始菜单 Codex 快捷方式启动。后续版本即可热更新。
- 其他状态（例如 `hot-update-pending`）不能当作已验证生效；把安装器完整输出告知用户。

## 兼容范围

- Windows 版 Codex：**26.917.9434.0**
- Node.js：**22 或更新版本**

不符合时停止安装，不要放宽版本判断；请获取匹配版本的安装包。

## 安装后反馈

只向用户报告安装器实际输出的模式。如果为 `hot-update`，明确说明已热更新且无需重启；如果为 `next-launch`，按提示说明需要首次从新快捷方式启动。安装器完成后不要代替用户操作 Codex 界面。

## English

Provide this guide together with `Codex侧栏增强-0.4.28-Windows.zip`. Keep both files in the same folder and ask Codex to run the following PowerShell from that folder. Administrator privileges are not required.

```powershell
$ErrorActionPreference = 'Stop'
$zip = Get-ChildItem -LiteralPath (Get-Location).Path -Filter 'Codex侧栏增强-0.4.28-Windows.zip' -File | Select-Object -First 1
if (-not $zip) { throw 'The Codex Sidebar Enhancement 0.4.28 Windows ZIP was not found in this folder.' }
$extract = Join-Path $env:TEMP ('CodexSidebarEnhancement-0.4.28-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $zip.FullName -DestinationPath $extract
$bundle = Join-Path $extract 'Codex侧栏增强-0.4.28'
$installer = Join-Path $bundle 'codex-one-click-install.ps1'
if (-not (Test-Path -LiteralPath $installer)) { throw 'The package is incomplete: the one-click installer is missing.' }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer
if ($LASTEXITCODE -ne 0) { throw 'Installation failed. Share the complete installer output with the user.' }
```

Do not modify the scripts or bypass package checks. The installer verifies the SHA-256 manifest, Node.js, and Codex version. It writes only to the current user's `%LOCALAPPDATA%\CodexSidebarEnhancement`, backs up replaced enhancement files and the original Codex shortcut, and does not modify files under `WindowsApps`, conversation databases, usage keys, or other user data.

If an existing enhancement is running and its debug page is reachable, the update is applied live and the installer reports `mode=hot-update` without restarting Codex. A first install or an unreachable page may report `mode=next-launch`; follow the installer instructions to launch Codex from the newly created shortcut. Only report the mode shown by the installer.

Compatibility: Windows Codex **26.917.9434.0** and Node.js **22 or later**. Stop if the detected versions do not match; do not bypass compatibility checks.
