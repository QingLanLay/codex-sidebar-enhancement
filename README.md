# Codex 侧栏增强 | Codex Sidebar Enhancement

为 Windows 版 Codex 桌面客户端提供侧栏、会话快捷栏、历史提问和设置面板增强。当前分发版本为 **0.4.28**。

A Windows desktop enhancement for Codex, adding a sidebar, session quick bar, conversation history, and settings panel. Current distribution version: **0.4.28**.

![Codex 侧栏增强当前功能布局示意图 | Current feature overview](侧栏增强功能概览.png)

图示要点：①最近项目排序；②设置与额度显示；③最新提问置顶的历史栏；④收起后窗口右下角的“历史”入口；⑤位置稳定、玻璃质感高亮的运行会话；⑥完成且已查看的会话归到快捷栏右侧。此图为功能示意图，并非 Codex 实际界面截图。

Illustration: ① recent project ordering; ② settings and usage visibility; ③ history panel with the newest question at the top; ④ the History button at the lower-right when the panel is collapsed; ⑤ running sessions stay in place and use a glass highlight; ⑥ completed and viewed sessions move to the right of the quick bar. This is an illustrative mockup, not a screenshot of Codex.

## 一键安装 | Quick Installation

- [Windows 安装包（支持符合条件的热更新） | Windows installer (hot update when supported)](exports/Codex侧栏增强-0.4.28-Windows.zip)
- [交给其他 Codex 的一键安装说明 | One-click installation instructions for another Codex](exports/Codex侧栏增强-0.4.28/交给其他Codex一键安装.md)
- [功能、兼容范围与卸载说明 | Features, compatibility, and uninstall guide](work/README.md)

当前安装包面向 Windows Codex **26.917.9434.0** 和 Node.js **22+**。安装器会校验兼容性；已安装版本且运行页面可连接时可热更新，否则按安装器提示在下次启动时加载。请先阅读安装说明，不要单独提取或修改安装包内文件。

插件界面默认跟随 Codex 语言，也可在设置中手动选择简体中文或 English。

The installer targets Windows Codex **26.917.9434.0** and Node.js **22+**. It checks compatibility before installation. If an existing installation is detected and the running Codex page is reachable, it can hot-update; otherwise, follow the installer prompt to load it on the next launch. Read the installation guide and do not extract or modify individual package files.

The plugin UI follows the Codex interface language by default. You can also choose **简体中文 (Chinese)** or **English** in the plugin settings.

## 项目文件 | Project Files

- `work/sidebar-toggle.js`：侧栏增强主脚本 | Main sidebar enhancement script.
- `work/inject.cjs`、`work/Launcher.cs`：注入监视器与 Windows 启动器源码 | Injection monitor and Windows launcher source.
- `exports/Codex侧栏增强-0.4.28/`：当前发行版文件、SHA-256 清单和安装/卸载脚本 | Current distribution files, SHA-256 manifest, and install/uninstall scripts.
- `exports/Codex侧栏增强-0.4.28-Windows.zip`：可分发安装包 | Distributable Windows package.

安装包及源码不包含开发机聊天记录、数据库、额度密钥或运行日志。仓库公开仅表示可查看；当前未附加开源许可证。

The package and source do not include the developer machine's conversations, database, usage keys, or runtime logs. Public visibility allows viewing; no open-source license is currently included.
