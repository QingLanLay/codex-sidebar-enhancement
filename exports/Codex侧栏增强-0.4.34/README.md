# Codex 侧栏增强 0.4.34 · 当前测试版 / Codex Sidebar Enhancement 0.4.34 Preview

## 安装
1. 目标电脑安装 Windows Codex **26.924.1866.0 或更新版本** 和 **Node.js 22+**（https://nodejs.org/）。安装器会校验 Windows 程序包入口，不会因新版构建号变化而直接拒绝；若新版内部界面变化，仍可能需要更新插件脚本。
2. 解压整个压缩包，双击“安装.cmd”，或让 Codex 按《交给其他Codex一键安装.md》执行。安装器会校验包内文件，无需管理员权限。
3. 已安装增强且当前页面可连接时，升级会热更新并确认新版本，不必退出 Codex；首次安装或没有可连接页面时，安装器会提示从新建的 Codex 快捷方式启动。日常启动使用无控制台 EXE，不弹 PowerShell。

安装目录：%LOCALAPPDATA%\CodexSidebarEnhancement。桌面和用户开始菜单的同名快捷方式会备份后替换，卸载时恢复。原先固定到任务栏的官方图标需要重新固定新入口；商店、协议链接及其他官方入口不自动加载增强。未设置开机启动，不修改官方安装文件。

Codex 更新后内部接口可能变化，需要新版增强；安装器会检查适配版本。若更新导致启动路径失效，请重新获取适配包。

插件界面默认跟随 Codex 语言，也可在设置中的“界面语言 / Interface language”选择“跟随 Codex / Follow Codex”“简体中文 / Chinese (Simplified)”或“English”。选择会立即生效并保存在本机。

### 热更新

侧栏脚本通过原子替换写入，已运行的注入监视器会在约 2 秒内重新读取新脚本；安装器等待当前页面报告新版本后，才输出 `mode=hot-update`。如 `inject.cjs` 变化，安装器只重启后台 Node 监视器，不重启 Codex。文件替换前的版本保存在安装目录 `backups` 子目录。首次安装如果 Codex 没有调试端口，则只能配置快捷方式并在下一次启动时加载。

## 功能
- 原生分区内项目按最近主动使用排序，后台输出不会刷新使用时间。
- 最近项目显示最近主动使用的 5 个工程；打开项目/会话、新建或发送提问时记录使用时间，后台回复与日志不会改变顺序。项目名称进入最近使用的会话，独立箭头展开最多 5 条会话预览。固定工程继续使用原版置顶。
- 输入框下方快捷栏保留最多 12 个用户会话卡片：优先当前会话、运行中、完成未查看，再补已查看/空闲；同组顺序稳定，不按点击时间重新排列。选中卡自动滚入可见区域；溢出会话在“更多”中搜索、打开或调用原版右键菜单。运行蓝框、完成未查看橙框、已查看/空闲绿框，失败显示红色提示，未读取状态显示灰色问号；选中态采用同色玻璃材质，不与运行状态混淆。
- 右侧使用固定高度的方块卡片列出当前会话的全部历史提问，按最新提问在上、最早提问在下排列，并显示每条提问后的 Codex 回复摘要；每张卡显示会话名、最近用户输入和 Codex 回复摘要，超长路径、连续英文和 Markdown 会在卡片边界内换行裁切。右栏展开时，Codex 原生“输出内容”浮层移入右栏显示；右栏收缩后恢复原生浮层位置和展开方式。右栏左边缘可拖拽调整宽度并自动保存；收缩按钮位于右侧右下角的小栏正中间；收起后只在窗口右下角保留“历史”按钮用于重新展开。单击卡片会像原版左侧一样打开对应会话，拖到输入框会将卡片中的双方文本生成 Codex 原生“粘贴的文本”附件，不占用输入框正文。
- 原版右键菜单追加“新建项目会话”“从快捷栏移除”。新建的项目会话会立即显示在快捷栏；可选择被移除的会话再次活动后是否回到快捷栏，也可一键恢复全部已移除会话。
- 失败会话自动识别模型容量、503 Service Unavailable、auth_unavailable、no auth available、server_error 等错误，在当前会话内后台调用原生“重试/继续”动作；即使界面不显示按钮，也会调用 Codex 内部恢复动作；默认自动启动，无需手动切换会话。
- 额度与“设置”嵌在右侧会话栏底部；单击额度卡片可隐藏或显示额度，按住 Shift 单击可切换额度项。项目排序、快捷栏、右侧输入历史面板、移除后回归和额度接口均在一个面板中配置，状态自动记忆。关闭右侧栏后，窗口右下角仍保留小型“设置”入口。
- 插件界面支持简体中文和英文；默认跟随 Codex 界面语言，也可在设置中手动切换。

## 卸载
完全退出 Codex，运行安装目录里的“卸载.cmd”。保留官方 Codex、聊天数据和本机界面偏好。

设置面板中的开关在选项右侧以方框对勾显示，修改后即时生效并保存在本机；额度接口地址和密钥通过“保存额度设置”单独保存。

## 说明
DIY 桌面增强，不是官方插件市场扩展。包含 EXE 源码，运行需要 Windows .NET Framework 4.x（Windows 10/11 通常自带）和 Node.js。首次启动可能刷新一次主界面。排障日志在安装目录 probe.log。

当前为分发测试版。安装包不包含开发电脑账号、聊天、数据库、日志、运行配置、额度地址、密钥或个人偏好，只会在目标电脑本地读取会话状态与预览。

## English

### Install

1. The package targets Windows Codex **26.924.1866.0 or later** and Node.js **22 or later**. The installer validates the Windows package manifest and does not reject a newer Codex build only because its version number changed; UI changes in a future build may still require a script update.
2. Extract the complete ZIP and run `安装.cmd`, or follow the one-click guide in `交给其他Codex一键安装.md`. Administrator privileges are not required.
3. When an existing installation and its running Codex page are reachable, updates are applied live without restarting Codex. For a first install or an unavailable debug page, follow the installer prompt to launch Codex from the created shortcut.

The plugin UI follows the Codex interface language by default. In Settings, choose **Follow Codex**, **Chinese (Simplified)**, or **English**; the choice takes effect immediately and is saved locally.

### Features

- Sort projects by recent conversation activity and keep the five recent-project slots stable.
- The composer quick bar lists user conversations, keeps running sessions in a stable order while switching between them, highlights the active session with a static glass effect, and moves completed-and-viewed sessions to the far right. Resumed completed sessions and new sessions move to the far left.
- The right history panel shows all questions from the current conversation, newest first, with Codex reply previews. Cards can jump to a turn or be dragged into the composer as a native pasted-text attachment.
- Collapse the history panel to restore the normal composer layout; only a compact **History** button remains at the lower-right corner. When expanded, the panel can be resized and remembers its width.
- Add project-conversation creation and quick-bar removal to the native context menu. Removed sessions can be restored manually or when they become active again.
- Configure project sorting, the quick bar, history panel, usage display, capacity-error retry, and interface language from the Settings panel. Checkbox controls are shown at the right of each toggle.

### Hot updates, uninstall, and privacy

The installer applies atomic file replacement and confirms the new script version before reporting `mode=hot-update`. It does not close Codex. To uninstall, fully exit Codex and run `卸载.cmd` from the installation directory; official Codex files and conversation data are preserved.

This is a community desktop enhancement, not an official Codex extension. No developer-machine account, conversations, database, usage key, runtime logs, or personal preferences are included in the package. No open-source license is currently included.


## 0.4.34 新版兼容 / Upgrade compatibility

- 2026-10-08 按本机 Windows Codex **26.1002.7124.0** 的程序包与页面脚本完成适配；安装仍按程序包结构校验，不锁定单一构建号。
- 会话运行状态连接不再依赖随更新改变的压缩导出名；直接发现已有 React 上下文中的本机客户端，不写入客户端状态。
- 历史侧栏和快捷栏选择当前可见的主面板、输入框；排除标题栏的重复 main 区域与隐藏、inert 的非活动标签页。
- 保留已有 12 个快捷块、状态排序、防闪烁、独立额度卡及本机设置。安装前自动备份被替换的插件文件。
- 0.4.34 已在当前新版 Codex 页面热更新；本机客户端状态连接、最近项目、12 卡片上限、当前选中可见及更多列表均已进行页面验证。安装不会自动关闭或重启 Codex。

Adapted against the installed Windows Codex **26.1002.7124.0** package and renderer source on October 8, 2026. Runtime discovery no longer relies on minified export names. Panels follow the visible composer/main tab, excluding hidden tabs and duplicate titlebar areas. Existing customization and local settings are preserved. The current upgraded Codex page has been hot-updated and its native runtime connection and UI behavior are verified. Installation does not stop or restart Codex.


### 2026-10-08 选中态保留（脚本 0.4.34.2）

当前选中状态与运行/完成状态分离：绿色已查看或空闲会话被选中时，显示绿色玻璃渐变、模糊、亮边与内高光；切换离开后清除选中材质。蓝色运行会话保留蓝色玻璃态，橙色未查看会话保留其状态色。当前版本同时包含主动使用项目排序和稳定 12 卡片规则。已通过当前 Codex 页面内隔离克隆节点的选中/取消选中样式测试。


## 0.4.34 主动使用与快捷栏规则

- 本机主动使用记录只存项目/会话 ID、时间和历史提问 ID，不存提问内容或密钥。首次从现有历史时间建立基线，之后由进入会话、点击项目、新建与新增用户提问更新。旧固定槽位不再作为最近项目来源。
- 删除/改名的项目由完整项目目录同步；项目展开项从 ID 和元数据渲染，不克隆原版 React DOM。
- 12 个卡片是可见集合上限，未入栏的会话仍留在更多列表；列表支持搜索、50 条分页和原版会话右键动作。
- 当前会话优先保留；组内位置不因点击或后台更新时间跳动，运行/完成/查看等状态变化才跨组调整。
- 新版运行状态从本机客户端缓存和原生状态/回合事件订阅获取；notLoaded 不作为 idle 或已完成。
- 设置、配额、历史栏、绿色选中玻璃态和原版导航均保留。安装仅重启后台注入监视器，不退出 Codex。


## 0.4.34 功能回归修复

- 非项目与未加载会话均可经当前页面的原生 React Router 导航；已加载会话优先调用原版行的导航动作，不依赖外层 DOM click 或不处理导航的主进程消息。
- 每个快捷块右上角新增 × 移除按钮；右键无法获取原版菜单时仍提供打开/移除。这里只隐藏快捷块，不删除会话记录。
- 运行状态同时检查执行中的回合、持续目标和原版行的运行指示。持续目标 active 时不会因单次回合临时 idle 被染成绿色；notLoaded 不当作完成。
- 使用真实 sessionId 关联临时客户端 ID，非项目的新会话也参与映射。
- 最近项目兼容经典项目侧栏和新版优先级侧栏，不再依赖一定存在置顶分区。


### 2026-10-08 当前页面验证（脚本 0.4.34.2）

15 项模型/状态回归通过；当前 Codex 页面中 14 项最近项目、节点复用、搜索分页和玻璃态检查通过。另在真实会话上验证了已加载/未加载的非项目会话打开、选中、快捷块移除、通过搜索找回，以及炮弹人持续目标的蓝色运行状态；测试后恢复原来选中的会话，仅恢复测试中移除的一项，不修改其他手动移除记录。没有删除或归档会话，没有关闭 Codex。
