'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');
const { DatabaseSync } = require('node:sqlite');
const os = require('node:os');
let usageSnapshot=null,usageFetchedAt=0;
const activeHistoryByTarget=new Map();
const conversationHistoryCache=new Map();
const USER_THREAD_FILTER="agent_role IS NULL AND (thread_source = 'user' OR (thread_source IS NULL AND COALESCE(source,'') NOT LIKE '%\"subagent\"%'))";
const usageConfigPath=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'CodexSidebarEnhancement','usage-private.json');
let usageConfigResult=null;
function publicUsageConfig(){try{const c=JSON.parse(fs.readFileSync(usageConfigPath,'utf8').replace(/^\uFEFF/,''));return {url:c.url,configured:!!c.key,result:usageConfigResult};}catch{return {configured:false,result:usageConfigResult};}}
function saveUsageConfig(request){
  try{
    const url=new URL(request.url);if(!['http:','https:'].includes(url.protocol))throw Error();
    let previous={};try{previous=JSON.parse(fs.readFileSync(usageConfigPath,'utf8').replace(/^\uFEFF/,''));}catch{}
    const key=typeof request.key==='string'&&request.key.trim()?request.key.trim():previous.key;if(!key)throw Error();
    fs.mkdirSync(path.dirname(usageConfigPath),{recursive:true});fs.writeFileSync(usageConfigPath,JSON.stringify({url:url.origin,key}),'utf8');
    usageFetchedAt=0;usageSnapshot=null;usageConfigResult={id:request.id,ok:true};
  }catch{usageConfigResult={id:request.id,ok:false};}
}
async function refreshUsage(){
  if(Date.now()-usageFetchedAt<30000)return;usageFetchedAt=Date.now();
  try{const file=path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'CodexSidebarEnhancement','usage-private.json');
    if(!fs.existsSync(file)){usageSnapshot=null;return;}
    const config=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));const url=new URL('/api/summary',config.url);
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:config.key}),signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('request failed');const data=await response.json();
    usageSnapshot={quotas:(data.quotas||[]).map(q=>({label:q.label,remainingPercent:q.remainingPercent,resetAt:q.resetAt})),tokens:data.own?.tokens,requests:data.own?.requests,costUsd:data.own?.costUsd,updatedAt:Date.now(),failed:false};
  }catch{usageSnapshot=usageSnapshot?{...usageSnapshot,failed:true}:{failed:true};}
}
function messageText(entry,role){
  const p=entry?.payload;if(entry?.type!=='response_item'||p?.type!=='message'||p.role!==role)return '';
  const types=role==='user'?new Set(['input_text','text']):new Set(['output_text','text']);
  const text=(p.content||[]).filter(c=>types.has(c.type)).map(c=>c.text||'').join('\n').trim();
  if(role==='user'&&/^(<environment_context>|<permissions instructions>|<collaboration_mode>|<apps_instructions>|<plugins_instructions>|<skills_instructions>|<app-context>|# AGENTS\.md instructions|Another language model started)/i.test(text))return '';
  return text;
}
function readConversationHistory(file,task){
  let stat;try{stat=fs.statSync(file);}catch{return [];}
  let cached=conversationHistoryCache.get(file),start;
  if(!cached||stat.size<cached.size){start=0;cached={size:start,remainder:'',items:[],active:null,count:0,lastUsed:Date.now()};}
  else start=cached.size;
  if(stat.size>start){
    let fd;try{fd=fs.openSync(file,'r');const length=stat.size-start,buffer=Buffer.alloc(length);fs.readSync(fd,buffer,0,length,start);let chunk=buffer.toString('utf8');if(start>0&&cached.size===start&&cached.items.length===0){const first=chunk.indexOf('\n');chunk=first>=0?chunk.slice(first+1):'';}const lines=(cached.remainder+chunk).split('\n');cached.remainder=lines.pop()||'';
      for(const line of lines){let entry;try{entry=JSON.parse(line);}catch{continue;}
        const user=messageText(entry,'user');if(user){const turn={id:entry.payload?.id||entry.timestamp+'-'+cached.count,user:user.slice(0,50000),assistant:'',task,time:Date.parse(entry.timestamp)||Date.now(),sequence:cached.count++};cached.items.push(turn);cached.active=turn;continue;}
        const assistant=messageText(entry,'assistant');if(assistant&&cached.active){cached.active.assistant=(cached.active.assistant?cached.active.assistant+'\n\n':'')+assistant;cached.active.assistant=cached.active.assistant.slice(0,100000);}
      }
      cached.size=stat.size;cached.lastUsed=Date.now();
    }catch{}finally{if(fd!==undefined)fs.closeSync(fd);}
  }
  cached.lastUsed=Date.now();conversationHistoryCache.set(file,cached);return cached.items;
}
function inputHistorySnapshot(db,threadId,resolveProject,projectless){
  if(!threadId)return [];
  const active=db.prepare(`SELECT id,cwd,project_id FROM threads WHERE id = ? AND archived = 0 AND ${USER_THREAD_FILTER} LIMIT 1`).get(threadId);if(!active)return [];
  const activeProject=resolveProject(active),row=db.prepare(`SELECT id,name,title,cwd,project_id,rollout_path,COALESCE(updated_at_ms,updated_at * 1000) AS time FROM threads WHERE id = ? AND archived = 0 AND ${USER_THREAD_FILTER} AND rollout_path IS NOT NULL LIMIT 1`).get(threadId);if(!row?.rollout_path)return [];
  const turns=readConversationHistory(row.rollout_path,row.name||row.title||'未命名会话').filter(turn=>turn&&typeof turn.user==='string'&&turn.user.trim());
  const items=turns.map((turn,index)=>({id:threadId+':turn:'+index,title:'第 '+(index+1)+' 条提问',project:activeProject?.name||'未分类',current:false,time:turn.time,user:turn.user||'',assistant:turn.assistant||'',text:'你：\n'+(turn.user||'')+(turn.assistant?'\n\nCodex：\n'+turn.assistant:'')}));
  if(conversationHistoryCache.size>100){const retained=[...conversationHistoryCache].sort((a,b)=>(b[1].lastUsed||0)-(a[1].lastUsed||0)).slice(0,100);conversationHistoryCache.clear();for(const [file,value]of retained)conversationHistoryCache.set(file,value);}
  return items;
}
function timeSnapshot(historyThreadId) {
  const file = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'state_5.sqlite');
  let db;
  try {
    db = new DatabaseSync(file, { readOnly: true });
    const rows = db.prepare(`SELECT id, COALESCE(updated_at_ms, updated_at * 1000) AS time FROM threads WHERE archived = 0 AND ${USER_THREAD_FILTER}`).all();
    let state = {};
    try { state = JSON.parse(fs.readFileSync(path.join(path.dirname(file), '.codex-global-state.json'), 'utf8')); } catch {}
    const projects = state['local-projects'] || {};
    const assignments = state['thread-project-assignments'] || {};
    const projectless = new Set(state['projectless-thread-ids'] || []);
    function resolveProject(r) {
      const assigned = assignments[r.id]?.projectId || r.project_id;
      if (assigned && projects[assigned]) return projects[assigned];
      if (projectless.has(r.id)) return null;
      return Object.values(projects).find(p => p.rootPaths?.some(root => root.toLowerCase() === (r.cwd || '').toLowerCase())) || null;
    }
    const recent = db.prepare(`SELECT id, name, title, cwd, project_id FROM threads WHERE archived = 0 AND ${USER_THREAD_FILTER} ORDER BY COALESCE(updated_at_ms, updated_at * 1000) DESC`).all().map(r => {
      const projectId = assignments[r.id]?.projectId || r.project_id;
      const project = projects[projectId] || Object.values(projects).find(p => p.rootPaths?.some(root => root.toLowerCase() === (r.cwd || '').toLowerCase()));
      return { id: r.id, title: r.name || r.title || '未命名会话', project: project?.name || '未分类', projectId };
    });
    const recentProjects = [];
    const seenProjects = new Set();
    for (const r of db.prepare(`SELECT id, cwd, project_id, COALESCE(updated_at_ms, updated_at * 1000) AS time FROM threads WHERE archived = 0 AND ${USER_THREAD_FILTER} ORDER BY time DESC`).all()) {
      const project = resolveProject(r);
      if (!project || seenProjects.has(project.id)) continue;
      seenProjects.add(project.id);
      recentProjects.push({ id: project.id, name: project.name, time: Number(r.time), threadId: r.id });
      if (recentProjects.length === 5) break;
    }
    const inputHistory=inputHistorySnapshot(db,historyThreadId,resolveProject,projectless);
    return { times: Object.fromEntries(rows.map(r => ['local:' + r.id, Number(r.time)])), recent, recentProjects, inputHistory };
  } catch { return { times: {}, recent: [], recentProjects: [], inputHistory: [] }; } finally { db?.close(); }
}
const logPath = path.join(__dirname, 'probe.log');
const log = message => fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
let stopping = false;
process.on('SIGINT', () => { stopping = true; });
async function evaluate(url,targetId) {
  await refreshUsage();
  const source = `window.__diyUsageConfig=${JSON.stringify(publicUsageConfig())};if(window.__diyUsageConfig.result){const form=document.getElementById('diy-usage-settings');const button=form?.querySelector('button[type="submit"]');if(button?.disabled){button.disabled=false;button.textContent=window.__diyUsageConfig.result.ok?'已保存，刷新额度':'保存失败，请重试';}}`+fs.readFileSync(path.join(__dirname, 'sidebar-toggle.js'), 'utf8');
  const historyThreadId = activeHistoryByTarget.get(targetId) || null;
  const snapshot = timeSnapshot(historyThreadId);
  const times = JSON.stringify(snapshot.times);
  const recent = JSON.stringify(snapshot.recent);
  const recentRevision = crypto.createHash('sha1').update(times).update(recent).digest('hex');
  const recentProjects = JSON.stringify(snapshot.recentProjects);
  const inputHistory = JSON.stringify(snapshot.inputHistory||[]);
  const address = new URL(url);
  if (address.protocol !== 'ws:' || address.hostname !== '127.0.0.1' || address.port !== String(port)) throw new Error('Non-local debugger rejected');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => { ws.close(); reject(new Error('CDP timeout')); }, 5000);
    const done = (error, value) => { clearTimeout(timer); ws.close(); error ? reject(error) : resolve(value); };
    ws.addEventListener('open', () => ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: `(() => { if (!document.body || !window.electronBridge) return 'not-ready'; window.__diyUsage=${JSON.stringify(usageSnapshot)}; if(window.__diySidebarRecentRevision!==${JSON.stringify(recentRevision)}){window.__diySidebarTimes=${times};window.__diySidebarRecent=${recent};window.__diySidebarRecentRevision=${JSON.stringify(recentRevision)};} window.__diySidebarRecentProjects=${recentProjects}; window.__diyInputHistoryThreadId=${JSON.stringify(historyThreadId)}; window.__diyInputHistory=${inputHistory}; ${source}\n window.__sidebarToggleProbe?.refreshUI?.(); window.__sidebarToggleProbe?.apply?.(); const usageRequest=window.__diyUsageConfigRequest;delete window.__diyUsageConfigRequest;const activeThreadId=document.querySelector('[data-app-action-sidebar-thread-active="true"]')?.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'')||decodeURIComponent(location.pathname.match(/^\\/local\\/([^/?#]+)/)?.[1]||'');return {usageRequest,activeThreadId,status:window.__sidebarToggleProbe?.disposed ? 'disposed' : 'loaded'}; })()`, returnByValue: true } })));
    ws.addEventListener('error', () => done(new Error('CDP connection failed')));
    ws.addEventListener('message', event => {
      const result = JSON.parse(event.data);
      if (result.id !== 1) return;
      if (result.error || result.result?.exceptionDetails) return done(new Error('Script evaluation failed'));
      const value=result.result?.result?.value;if(value&&typeof value==='object'){if(value.usageRequest)saveUsageConfig(value.usageRequest);activeHistoryByTarget.set(targetId,typeof value.activeThreadId==='string'&&value.activeThreadId?value.activeThreadId:null);done(null,value.status);}else done(null,value);
    });
  });
}
(async () => {
  log('Watcher started');
  let misses = 0;
  const seen = new Set();
  while (!stopping && misses < 30) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) });
      if (!response.ok) throw new Error('Debugger unavailable');
      const targets = await response.json();
      misses = 0;
      for (const target of targets) {
        if (target.type !== 'page' || !target.url?.startsWith('app://-/') || !target.webSocketDebuggerUrl) continue;
        if (/quick-chat|prewarm|avatar-overlay/i.test(target.url)) continue;
        const result = await evaluate(target.webSocketDebuggerUrl,target.id);
        if (result === 'loaded' && !seen.has(target.id)) { seen.add(target.id); log('Probe loaded into app page'); }
      }
    } catch { misses++; }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  log('Watcher stopped');
})().catch(() => { log('Watcher failed'); process.exitCode = 1; });



