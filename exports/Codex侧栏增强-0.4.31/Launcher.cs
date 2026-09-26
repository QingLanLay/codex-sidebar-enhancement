using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Windows.Forms;

class Launcher {
 sealed class PackageInfo {
  public string Executable;
  public string Aumid;
 }
 enum ActivateOptions { None = 0, DesignMode = 1, NoErrorUI = 2, NoSplashScreen = 4 }
 [ComImport, Guid("45BA127D-10A8-46EA-8AB7-56EA9078943C"), ClassInterface(ClassInterfaceType.None)]
 class ApplicationActivationManager { }
 [ComImport, Guid("2e941141-7f97-4756-ba1d-9decde894a3d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IApplicationActivationManager {
  int ActivateApplication(
   [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
   [MarshalAs(UnmanagedType.LPWStr)] string arguments,
   ActivateOptions options,
   out uint processId);
 }
 static string T(string zh,string en){return CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("zh",StringComparison.OrdinalIgnoreCase)?zh:en;}
 static string ProductTitle{get{return T("Codex 侧栏增强","Codex Sidebar Enhancement");}}
 [STAThread] static void Main(string[] args) {
  string root=AppDomain.CurrentDomain.BaseDirectory;
  bool check=args.Length>0 && args[0]=="--check";
  try {
   PackageInfo package=DiscoverApp();
   string app=package.Executable;
   string configPath=Path.Combine(root,"launcher.config");
   string[] config=File.Exists(configPath)?File.ReadAllLines(configPath):new string[0];
   string node=config.Length>1?config[1]:Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"nodejs","node.exe");
   if(!File.Exists(node))throw new Exception(T("未找到 Node.js，请重新安装 Node.js 22 或更新版本。","Node.js was not found. Install Node.js 22 or later, then try again."));
   string version=Run(node,"--version").Trim();
   Match match=Regex.Match(version,@"^v(\d+)\.");
   if(!match.Success || int.Parse(match.Groups[1].Value)<22)throw new Exception(T("需要 Node.js 22 或更新版本，当前为 ","Node.js 22 or later is required. Current version: ")+version);
   if(!File.Exists(Path.Combine(root,"inject.cjs")) || !File.Exists(Path.Combine(root,"sidebar-toggle.js")))throw new Exception(T("增强脚本缺失，请重新安装插件。","Enhancement files are missing. Reinstall the package."));
   File.WriteAllLines(configPath,new string[]{app,node},new UTF8Encoding(false));
   if(check){File.WriteAllText(Path.Combine(root,"launcher-check.log"),"CHECK_OK\r\napp="+app+"\r\naumid="+package.Aumid+"\r\nnode="+node+"\r\nversion="+version+"\r\nNo app launched or stopped.\r\n");return;}
   foreach(Process process in Process.GetProcessesByName("ChatGPT")) {
    using(process){if(process.MainWindowHandle!=IntPtr.Zero){MessageBox.Show(T("Codex 当前正在运行。请自行从客户端菜单完全退出，再使用此快捷方式启动增强。当前窗口不会被关闭。","Codex is already running. Quit it from the app menu, then use this shortcut to launch the enhancement. This window will not be closed."),ProductTitle,MessageBoxButtons.OK,MessageBoxIcon.Information);return;}}
   }
   var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;listener.Stop();
   uint processId=StartPackaged(package.Aumid,"--remote-debugging-port="+port+" --remote-debugging-address=127.0.0.1");
   Start(node,"\""+Path.Combine(root,"inject.cjs")+"\" "+port,root);
   File.AppendAllText(Path.Combine(root,"launcher.log"),DateTime.Now.ToString("s")+" launcher 0.4.31 app="+app+" aumid="+package.Aumid+" pid="+processId+" port="+port+Environment.NewLine);
  }catch(Exception e){
   if(check){File.WriteAllText(Path.Combine(root,"launcher-check.log"),"CHECK_FAILED "+e.Message);Environment.ExitCode=1;}
   else MessageBox.Show(e.Message,ProductTitle,MessageBoxButtons.OK,MessageBoxIcon.Information);
  }
 }
 static PackageInfo DiscoverApp(){
  string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),@"WindowsPowerShell\v1.0\powershell.exe");
  string script="$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; $p=Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1; if(-not $p){throw 'Windows Codex package not found'}; $m=Get-AppxPackageManifest -Package $p; $a=@($m.Package.Applications.Application | Where-Object { $_.Id -eq 'App' } | Select-Object -First 1); if(-not $a){throw 'Windows Codex application entry not found'}; [Console]::Write($p.PackageFamilyName+'|'+$a.Id+'|'+(Join-Path $p.InstallLocation 'app\\ChatGPT.exe'))";
  string result=Run(ps,"-NoLogo -NoProfile -NonInteractive -EncodedCommand "+Convert.ToBase64String(Encoding.Unicode.GetBytes(script))).Trim().Trim('\uFEFF');
  string[] parts=result.Split(new char[]{'|'},3);
  if(parts.Length!=3 || String.IsNullOrWhiteSpace(parts[0]) || String.IsNullOrWhiteSpace(parts[1]) || String.IsNullOrWhiteSpace(parts[2]))throw new Exception(T("无法读取当前 Codex 程序包标识，请确认 Windows 版 Codex 安装完整。","Could not read the current Codex package identity. Check that the Windows Codex app is installed correctly."));
  string app=parts[2];
  if(!File.Exists(app))throw new Exception(T("未找到当前版本的 Codex 启动文件，请确认 Windows 版 Codex 安装完整。","The Codex launcher for this version was not found. Check that the Windows app is installed correctly."));
  return new PackageInfo{Executable=app,Aumid=parts[0]+"!"+parts[1]};
 }
 static uint StartPackaged(string aumid,string args){
  IApplicationActivationManager manager=null;
  try {
   manager=(IApplicationActivationManager)new ApplicationActivationManager();
   uint processId; int hr=manager.ActivateApplication(aumid,args,ActivateOptions.None,out processId);
   if(hr<0)Marshal.ThrowExceptionForHR(hr);
   return processId;
  } finally { if(manager!=null)Marshal.ReleaseComObject(manager); }
 }
 static string Run(string file,string args){
  var info=new ProcessStartInfo(file,args);info.UseShellExecute=false;info.CreateNoWindow=true;info.WindowStyle=ProcessWindowStyle.Hidden;info.RedirectStandardOutput=true;info.RedirectStandardError=true;info.StandardOutputEncoding=Encoding.UTF8;
  using(var process=Process.Start(info)){
   var output=process.StandardOutput.ReadToEndAsync();var error=process.StandardError.ReadToEndAsync();
   if(!process.WaitForExit(30000))throw new Exception("查询安装信息超时，请稍后重试。");
   if(process.ExitCode!=0)throw new Exception("查询安装信息失败："+error.Result);
   return output.Result;
  }
 }
 static void Start(string file,string args,string root){var info=new ProcessStartInfo(file,args);info.WorkingDirectory=root;info.UseShellExecute=false;info.CreateNoWindow=true;info.WindowStyle=ProcessWindowStyle.Hidden;Process.Start(info);}
}
