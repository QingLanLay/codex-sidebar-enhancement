using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
class Launcher {
 [STAThread] static void Main(string[] args) {
  string root=AppDomain.CurrentDomain.BaseDirectory;
  bool check=args.Length>0 && args[0]=="--check";
  try {
   string app=DiscoverApp();
   string configPath=Path.Combine(root,"launcher.config");
   string[] config=File.Exists(configPath)?File.ReadAllLines(configPath):new string[0];
   string node=config.Length>1?config[1]:Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),"nodejs","node.exe");
   if(!File.Exists(node))throw new Exception("未找到 Node.js，请重新安装 Node.js 22 或更新版本。");
   string version=Run(node,"--version").Trim();
   Match match=Regex.Match(version,@"^v(\d+)\.");
   if(!match.Success || int.Parse(match.Groups[1].Value)<22)throw new Exception("需要 Node.js 22 或更新版本，当前为 "+version);
   if(!File.Exists(Path.Combine(root,"inject.cjs")) || !File.Exists(Path.Combine(root,"sidebar-toggle.js")))throw new Exception("增强脚本缺失，请重新安装插件。");
   File.WriteAllLines(configPath,new string[]{app,node},new UTF8Encoding(false));
   if(check){File.WriteAllText(Path.Combine(root,"launcher-check.log"),"CHECK_OK\r\napp="+app+"\r\nnode="+node+"\r\nversion="+version+"\r\nNo app launched or stopped.\r\n");return;}
   foreach(Process process in Process.GetProcessesByName("ChatGPT")) {
    using(process){if(process.MainWindowHandle!=IntPtr.Zero){MessageBox.Show("Codex 当前正在运行。请自行从客户端菜单完全退出，再使用此快捷方式启动增强。当前窗口不会被关闭。","Codex 侧栏增强",MessageBoxButtons.OK,MessageBoxIcon.Information);return;}}
   }
   var listener=new TcpListener(IPAddress.Loopback,0);listener.Start();int port=((IPEndPoint)listener.LocalEndpoint).Port;listener.Stop();
   Start(app,"--remote-debugging-port="+port+" --remote-debugging-address=127.0.0.1",Path.GetDirectoryName(app));
   Start(node,"\""+Path.Combine(root,"inject.cjs")+"\" "+port,root);
   File.AppendAllText(Path.Combine(root,"launcher.log"),DateTime.Now.ToString("s")+" launcher 0.4.27 app="+app+" port="+port+Environment.NewLine);
  }catch(Exception e){
   if(check){File.WriteAllText(Path.Combine(root,"launcher-check.log"),"CHECK_FAILED "+e.Message);Environment.ExitCode=1;}
   else MessageBox.Show(e.Message,"Codex 侧栏增强",MessageBoxButtons.OK,MessageBoxIcon.Information);
  }
 }
 static string DiscoverApp(){
  string ps=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),@"WindowsPowerShell\v1.0\powershell.exe");
  string script="$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[Text.Encoding]::UTF8; $p=Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1; if(-not $p){throw 'Windows Codex package not found'}; [Console]::Write((Join-Path $p.InstallLocation 'app\\ChatGPT.exe'))";
  string app=Run(ps,"-NoLogo -NoProfile -NonInteractive -EncodedCommand "+Convert.ToBase64String(Encoding.Unicode.GetBytes(script))).Trim().Trim('\uFEFF');
  if(!File.Exists(app))throw new Exception("未找到当前版本的 Codex 启动文件，请确认 Windows 版 Codex 安装完整。");
  return app;
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
