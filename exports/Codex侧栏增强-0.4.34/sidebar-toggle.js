(() => {
  'use strict';
  if (window.top !== window || /avatar-overlay|quick-chat|prewarm/.test(location.href)) return;
  const KEY='__sidebarToggleProbe', VERSION='0.4.34.2', STORAGE='diy-sidebar-enhancement-v2', UI_LANGUAGE_KEY='diy-sidebar-ui-language';
  if(window[KEY]?.version===VERSION)return;
  const previousEnabled=window[KEY]?.enabled;
  const previousActiveId=window[KEY]?.getActiveThreadId?.()||null;
  const previousRunningIds=window[KEY]?.getObservedRunningIds?.()||window[KEY]?.getQuickbarState?.().visible.filter(item=>['active','loading','running'].includes(item.state)).map(item=>item.id)||[];
  const previousVisibleIds=[...document.querySelectorAll('#diy-recent-conversations [data-recent-thread-id]')].map(node=>node.dataset.recentThreadId);
  window[KEY]?.dispose?.();
  for(const selector of ['#diy-sidebar-toggle-probe','#diy-sidebar-compact-css','#diy-usage-settings','#diy-input-history','#diy-running-conversations','#diy-input-history-panel','#diy-input-history-expand'])for(const stale of document.querySelectorAll(selector))stale.remove();
  let enabled=true, timer=null,quickBarEnabled=true,rightPanelEnabled=true,allowDismissedReturn=true,capacityRetryEnabled=true,capacityRetryTimer=null,usageHidden=false,historyCollapsed=false;
  try{quickBarEnabled=localStorage.getItem('diy-quickbar-enabled')!=='off';rightPanelEnabled=localStorage.getItem('diy-rightpanel-enabled')!=='off';allowDismissedReturn=localStorage.getItem('diy-dismissed-recent-return-on-update')!=='off';capacityRetryEnabled=localStorage.getItem('diy-capacity-auto-retry')!=='off';usageHidden=localStorage.getItem('diy-usage-hidden')==='on';historyCollapsed=localStorage.getItem('diy-history-panel-collapsed')==='on';if(!localStorage.getItem('diy-input-history-right-panel-migrated')){rightPanelEnabled=true;localStorage.setItem('diy-rightpanel-enabled','on');localStorage.setItem('diy-input-history-right-panel-migrated','1');}}catch{}
  let uiLanguagePreference='auto';try{const saved=localStorage.getItem(UI_LANGUAGE_KEY);if(['auto','zh','en'].includes(saved))uiLanguagePreference=saved;}catch{}
  function detectUiLanguage(){if(uiLanguagePreference==='zh'||uiLanguagePreference==='en')return uiLanguagePreference;const nativeLabels=[...document.querySelectorAll('#app-shell-sidebar [data-app-action-sidebar-section-toggle]')].map(el=>(el.textContent||'').trim());if(nativeLabels.some(label=>label==='置顶'))return'zh';if(nativeLabels.some(label=>/^Pinned$/i.test(label)))return'en';const locale=(document.documentElement.lang||navigator.language||navigator.userLanguage||'zh-CN').toLowerCase();return locale.startsWith('zh')?'zh':'en';}
  let uiLanguage=detectUiLanguage(),settingsFormRefresh=null;
  const englishText={
    '已开启':'Enabled','个项目':'projects','最近活动排序':'sorted by recent activity','设置':'Settings','侧栏增强设置':'Sidebar Enhancement Settings','项目排序 ':'Project sorting ','快捷栏 ':'Quick bar ','右侧栏 ':'History panel ','容量自动继续 ':'Auto-retry capacity errors ','开':'On','关':'Off',
    '项目按最近主动使用排序':'Sort projects by recent conversation activity','输入框下方快捷会话栏':'Session quick bar below the composer','右侧当前会话历史提问':'Current conversation history panel','移除的会话再次活动后回到快捷栏':'Restore removed sessions when they become active again','失败会话每 10 秒自动重试':'Retry failed sessions every 10 seconds','界面语言':'Interface language','跟随 Codex':'Follow Codex','简体中文':'Chinese (Simplified)',
    '额度接口地址':'Usage API URL','额度密钥':'Usage API key','额度密钥已保存，留空保持不变':'Usage key saved; leave blank to keep it','输入额度密钥':'Enter usage API key','开关即时保存；额度地址和密钥仅保存在本机。':'Toggles save immediately. The usage URL and key are stored locally only.','保存额度设置':'Save usage settings','恢复已移除会话':'Restore removed sessions','关闭':'Close','已恢复全部手动移除的会话。':'All manually removed sessions have been restored.','请输入有效的 HTTP 或 HTTPS 地址。':'Enter a valid HTTP or HTTPS URL.','请输入密钥。':'Enter the API key.','正在保存并刷新…':'Saving and refreshing…',
    '快捷会话':'Session quick bar',' · 正在运行':' · Running',' · 已完成 · 已查看':' · Completed · Viewed',' · 已完成 · 未查看':' · Completed · Not viewed',' · 当前活动会话':' · Current active session','正在运行':'Running',
    ' 剩余 ':' Remaining ','额度 ':'Quota ','账号共享剩余额度（非现金余额）':'Shared account usage remaining (not a cash balance)','当前额度：':'Current quota: ','剩余：':'Remaining: ','重置：':'Resets: ','点击切换下一项':'Click to switch to the next quota','刷新失败，当前为上次数据':'Refresh failed; showing the last available data','每 30 秒刷新':'Refreshes every 30 seconds','额度已隐藏 · 点击显示':'Usage hidden · Click to show','额度隐藏 · 点击显示':'Usage hidden · Click to show','点击显示额度；按住 Shift 点击可切换额度项':'Click to show usage; Shift-click to switch quota','额度未配置':'Usage not configured','额度接口尚未配置':'Usage API is not configured','额度暂不可用':'Usage temporarily unavailable','额度显示中，点击隐藏':'Usage visible · Click to hide','点击隐藏额度；按住 Shift 点击切换额度项':'Click to hide usage; Shift-click to switch quota',
    '当前会话历史提问':'Current conversation history','当前会话 · ':'Current conversation · ','当前会话 · 历史提问':'Current conversation · History','收起历史提问栏':'Collapse history panel','展开历史提问栏':'Expand history panel','历史':'History','展开右侧历史提问':'Open conversation history','当前会话 · 正在读取历史…':'Current conversation · Loading history…','当前会话 · 暂无历史提问':'Current conversation · No history yet','正在读取当前会话历史…':'Loading conversation history…','当前会话暂无历史提问':'No questions in this conversation yet',' 条历史提问':' questions','定位历史提问：':'Go to question:','单击定位当前会话中的这条提问；拖到输入框可引用提问和 Codex 回复':'Click to jump to this question; drag to the composer to quote the question and Codex reply','当前':'Current','你':'You','暂无可预览的用户输入':'No user input preview available','等待回复…':'Waiting for reply…','拖拽调整右侧会话栏宽度':'Drag to resize the history panel',
    '新建项目会话':'New project conversation','从快捷栏移除':'Remove from quick bar','无法打开该项目的新会话，请从原生项目栏创建。':'Could not open a new conversation for this project. Create it from the native project list.','请先在左侧加载该会话，再使用原版右键菜单':'Load this conversation in the sidebar first, then use the native context menu.','最近项目':'Recent projects','请先展开项目所在分区':'Expand the project section first.','当前客户端导航接口不可用，请从原生侧栏打开会话。':'The client navigation API is unavailable. Open the conversation from the native sidebar.','已关闭 · 原生显示已恢复':'Disabled · Native layout restored','输出内容':'Output content'
  };
  Object.assign(englishText,{'打开会话':'Open conversation','空闲':'Idle','状态未读取':'Status unavailable','运行失败':'Failed','运行已中断':'Interrupted','更多':'More','更多会话':'More conversations','搜索会话或项目':'Search conversations or projects','再显示 50 条':'Show 50 more','没有匹配的会话':'No matching conversations','按主动使用排序；后台运行不会改变顺序':'Sorted by active use; background work does not reorder projects','打开最近使用的会话':'Open the last-used conversation','展开项目会话':'Expand project conversations','收起项目会话':'Collapse project conversations','暂无会话；点击项目名称新建':'No conversations; click the project name to create one'});
  const L=text=>uiLanguage==='en'?(englishText[text]||text):text;
  // BEGIN UX MODEL - pure functions, shared by the targeted regression tests.
  function quickbarGroup(item){return item.running?0:item.completed&&!item.viewed?1:item.failed?2:item.unknown?4:3;}
  function planQuickbar(items,previousOrder,activeId,limit=12){
    const byId=new Map(items.map(item=>[item.id,item]));
    const prior=[...new Set(previousOrder)].filter(id=>byId.has(id)),rank=new Map(prior.map((id,index)=>[id,index]));
    const newcomers=items.filter(item=>!rank.has(item.id)).sort((a,b)=>(b.lastUsed||0)-(a.lastUsed||0)||String(a.id).localeCompare(String(b.id)));
    const base=[...prior,...newcomers.map(item=>item.id)],baseRank=new Map(base.map((id,index)=>[id,index]));
    const ordered=base.map(id=>byId.get(id)).sort((a,b)=>quickbarGroup(a)-quickbarGroup(b)||baseRank.get(a.id)-baseRank.get(b.id));
    const priority=items.slice().sort((a,b)=>quickbarGroup(a)-quickbarGroup(b)||(b.lastUsed||0)-(a.lastUsed||0)||baseRank.get(a.id)-baseRank.get(b.id));
    const active=byId.get(activeId),selected=new Set((active?[active,...priority.filter(item=>item.id!==activeId)]:priority).slice(0,limit).map(item=>item.id));
    return {order:ordered.map(item=>item.id),visible:ordered.filter(item=>selected.has(item.id)),overflow:ordered.filter(item=>!selected.has(item.id))};
  }
  function deriveRecentProjects(catalog,source,usage,limit=5){
    const threads=new Map(source.map(item=>[item.id,item]));
    return catalog.map(project=>{
      const record=usage.projects[project.id];if(!record?.usedAt)return null;
      const projectThreads=source.filter(item=>item.projectId===project.id).sort((a,b)=>(usage.threads[b.id]?.usedAt||b.lastUsed||b.createdAt||0)-(usage.threads[a.id]?.usedAt||a.lastUsed||a.createdAt||0));
      const chosen=threads.get(record.threadId),threadId=chosen?.projectId===project.id?chosen.id:projectThreads[0]?.id;
      return {...project,lastUsed:record.usedAt,threadId};
    }).filter(Boolean).sort((a,b)=>b.lastUsed-a.lastUsed||String(a.id).localeCompare(String(b.id))).slice(0,limit);
  }
  function runtimeStateFromCache(conversation,summary,execution){
    if(execution?.inProgress===true||conversation?.threadGoal?.status==='active')return 'active';
    const type=summary?.threadRuntimeStatus?.type||conversation?.threadRuntimeStatus?.type;
    if(type==='idle'){const turn=conversation?.turns?.at(-1);if(turn?.status==='interrupted')return 'interrupted';if(turn?.status==='failed'||turn?.status==='error'||(turn?.error&&turn?.status!=='completed'))return 'error';}
    return type;
  }
  // END UX MODEL
  const USAGE_STATE_KEY='diy-active-usage-v1',QUICK_ORDER_KEY='diy-quickbar-order-v1';
  let usageState={seeded:false,projects:{},threads:{},userTurns:{}};
  try{const saved=JSON.parse(localStorage.getItem(USAGE_STATE_KEY)||'null');if(saved&&saved.projects&&saved.threads){usageState={seeded:!!saved.seeded,projects:saved.projects,threads:saved.threads,userTurns:saved.userTurns||{}};}}catch{}
  let observedSelection=previousActiveId;
  function persistUsage(){try{const entries=Object.entries(usageState.threads).sort((a,b)=>(b[1].usedAt||0)-(a[1].usedAt||0));if(entries.length>2000){usageState.threads=Object.fromEntries(entries.slice(0,2000));usageState.userTurns=Object.fromEntries(Object.entries(usageState.userTurns).filter(([id])=>usageState.threads[id]));}localStorage.setItem(USAGE_STATE_KEY,JSON.stringify(usageState));}catch{}}
  function seedUsage(source,catalog){
    if(usageState.seeded||window.__diySidebarSnapshotReady!==true)return;
    const valid=new Set(catalog.map(p=>p.id));
    for(const item of source){const time=item.lastUsed||item.createdAt||0;if(!time)continue;usageState.threads[item.id]={usedAt:time,projectId:item.projectId||null};if(valid.has(item.projectId)&&time>(usageState.projects[item.projectId]?.usedAt||0))usageState.projects[item.projectId]={usedAt:time,threadId:item.id};}
    usageState.seeded=true;persistUsage();
  }
  function recordActiveUse(item,time=Date.now()){
    if(!item)return;
    if(item.id&&time>(usageState.threads[item.id]?.usedAt||0))usageState.threads[item.id]={usedAt:time,projectId:item.projectId||null};
    if(item.projectId&&time>(usageState.projects[item.projectId]?.usedAt||0))usageState.projects[item.projectId]={usedAt:time,threadId:item.id||usageState.projects[item.projectId]?.threadId||null};
    persistUsage();projectSignature='';scheduleUIRefresh();scheduleProjectApply();
  }
  function observeActiveUse(source,activeId){
    const item=source.find(item=>item.id===activeId);
    if(activeId&&activeId!==observedSelection&&item){observedSelection=activeId;if(document.visibilityState==='visible'&&document.hasFocus()){recordActiveUse(item);markCompletedViewed(activeId);}}
    const history=window.__diyInputHistoryThreadId===activeId?window.__diyInputHistory||[]:[],turn=history.at(-1);
    if(turn&&usageState.userTurns[activeId]!==turn.id){usageState.userTurns[activeId]=turn.id;recordActiveUse(item,Number(turn.time)||Date.now());}
  }
  function onUserSidebarAction(event){
    const row=event.target.closest?.('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id]');
    if(row){const nativeId=row.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,''),id=[...recentThreadAliases].find(([,alias])=>alias.clientThreadId===nativeId)?.[0]||nativeId;recordActiveUse((window.__diySidebarRecent||[]).find(item=>item.id===id)||recentDrafts.get(id)?.item);return;}
    const header=event.target.closest?.('[data-app-action-sidebar-project-row]');if(header)recordActiveUse({projectId:header.getAttribute('data-app-action-sidebar-project-id')});
  }
  function onUsageStorage(event){if(event.key!==USAGE_STATE_KEY||!event.newValue)return;try{const saved=JSON.parse(event.newValue);if(saved.projects&&saved.threads){usageState=saved;projectSignature='';scheduleUIRefresh();}}catch{}}
  document.addEventListener('click',onUserSidebarAction,true);window.addEventListener('storage',onUsageStorage);

  try{enabled=typeof previousEnabled==='boolean'?previousEnabled:localStorage.getItem(STORAGE)!=='off';}catch{}
  const performanceStats={applyCalls:0,uiRefreshes:0,anchorMoves:0,retryScans:0};
  const pluginSelector='#diy-quickbar-dock,#diy-recent-conversations,#diy-recent-projects,#diy-sidebar-toggle-probe,#diy-usage-settings,#diy-input-history-panel,#diy-input-history-expand,#diy-usage-box';
  function pluginMutation(record){
    const own=node=>{const el=node?.nodeType===1?node:node?.parentElement;return !!el?.closest?.(pluginSelector);};
    if(own(record.target))return true;
    const changed=[...record.addedNodes,...record.removedNodes];
    return record.type==='childList'&&changed.length>0&&changed.every(own);
  }
  let projectApplyTimer=null;
  function scheduleProjectApply(){if(!enabled||projectApplyTimer!==null)return;projectApplyTimer=setTimeout(()=>{projectApplyTimer=null;if(!disposed)apply();},200);}
  const styles=new Map(), expanded=new Set(), nativeStates=new Map(), buttons=new Map();
  let stats={projects:0,compact:0};
  let observer=null, applying=false;
  const requestedAll=new WeakSet();
  const compactCSS=document.createElement('style');compactCSS.id='diy-sidebar-compact-css';
  compactCSS.textContent='';
  document.head.append(compactCSS);
  function observe(){const root=document.getElementById('app-shell-sidebar');if(root)observer?.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded','data-app-action-sidebar-project-collapsed','data-app-action-sidebar-thread-title']});}
  function clearMarkers(){for(const n of document.querySelectorAll('[data-diy-latest],[data-diy-show-all],[data-diy-project-open]')){n.removeAttribute('data-diy-latest');n.removeAttribute('data-diy-show-all');n.removeAttribute('data-diy-project-open');}}

  const props=(element,predicate)=>{
    let f=element?.[Object.keys(element).find(k=>k.startsWith('__reactFiber'))];
    for(let i=0;f&&i<45;f=f.return,i++)if(predicate(f.memoizedProps||{}))return f.memoizedProps;
    return null;
  };
  function style(el,key,value){
    if(!el)return;
    if(!styles.has(el))styles.set(el,new Map());
    if(!styles.get(el).has(key))styles.get(el).set(key,[el.style.getPropertyValue(key),el.style.getPropertyPriority(key)]);
    if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value,'important');
  }
  function restore(){for(const [el,fields] of styles)for(const [k,[v,p]] of fields){if(v)el.style.setProperty(k,v,p);else el.style.removeProperty(k);}styles.clear();}
  function rowItem(el,boundary){let n=el;while(n.parentElement&&n.parentElement!==boundary){if(n.parentElement.getAttribute('role')==='list')return n;n=n.parentElement;}return el;}
  function stamp(row){
    const id=row.getAttribute('data-app-action-sidebar-thread-id');
    const p=props(row,p=>p.threadSummary)||props(row,p=>p.entry);
    const s=p?.threadSummary||p?.entry?.task||{};
    return Math.max(window.__diySidebarTimes?.[id]||0,Number(s.updatedAt)||0,Number(s.recencyAt)||0);
  }
  function apply(){
    if(!enabled||applying)return;
    performanceStats.applyCalls++;applying=true;observer?.disconnect();
    try {
    const projects=[];
    for(const header of document.querySelectorAll('[data-app-action-sidebar-project-row]')){
      const group=header.closest('div[data-sidebar-project-kind]');
      if(!group)continue;
      const id=header.getAttribute('data-app-action-sidebar-project-id');
      const gp=props(header,p=>p.group?.projectId===id)?.group;
      if(!nativeStates.has(id))nativeStates.set(id,{showAll:null});
      const project={outer:rowItem(group,document.body),latest:usageState.projects[id]?.usedAt||0,id};
      projects.push(project);
    }
    // 每个原生分区独立排序，非项目项保留相对槽位。
    const parents=new Map();for(const p of projects){if(!parents.has(p.outer.parentElement))parents.set(p.outer.parentElement,[]);parents.get(p.outer.parentElement).push(p);}
    for(const [parent,items] of parents){const slots=[...parent.children];const projectNodes=new Set(items.map(i=>i.outer));const indices=slots.map((n,i)=>projectNodes.has(n)?i:-1).filter(i=>i>=0);const sorted=items.sort((a,b)=>b.latest-a.latest);slots.forEach((n,i)=>style(n,'order',String(i)));sorted.forEach((p,i)=>style(p.outer,'order',String(indices[i])));}
    for(const [id,b]of buttons)if(!projects.some(p=>p.id===id)){b.remove();buttons.delete(id);}
    stats={projects:projects.length,compact:projects.filter(p=>!expanded.has(p.id)).length};
    const text=`${L('已开启')} · ${stats.projects} ${L('个项目')} · ${L('最近活动排序')}`;if(status.textContent!==text)status.textContent=text;
    for(const el of styles.keys())if(!el.isConnected)styles.delete(el);
    } finally {applying=false;if(enabled)observe();}
  }
  const panel=document.createElement('div');panel.id='diy-sidebar-toggle-probe';panel.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;font:11px system-ui;';
  const status=document.createElement('div');status.hidden=true;
  const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.textContent=L('设置');settingsButton.style.cssText='padding:3px 7px;cursor:pointer;border:1px solid #64748b;border-radius:6px;background:#18212f;color:#fff;font:11px system-ui;';
  panel.append(settingsButton);document.body.append(panel);
  function updateSettingsButton(){settingsButton.title=L('侧栏增强设置')+'\n'+L('项目排序 ')+(enabled?L('开'):L('关'))+' · '+L('快捷栏 ')+(quickBarEnabled?L('开'):L('关'))+' · '+L('右侧栏 ')+(rightPanelEnabled?L('开'):L('关'))+' · '+L('失败自动重试 ')+(capacityRetryEnabled?L('开'):L('关'));}
  const retryableErrorPattern=/(selected model is at capacity|try a different model|unexpected status\s*503|503\s+service unavailable|auth[_ -]?unavailable|no auth available|server[_ -]?error|service unavailable|model[^\n]{0,80}capacity|模型容量|服务不可用)/i;
  const retryButtonPattern=/(^|\s)(继续(?:生成|运行)?|重试|再试一次|重新尝试|继续|retry|try again|continue|resume|retry request|try again now)(\s|$)/i;
  let capacityRetryObserver=null,capacityRetryScanTimer=null,capacityRetryNextAt=0,capacityRetryLastClick=0,capacityRetrySignature='',capacityRetryAttempt=0;
  function retryIsVisible(el){if(!el||el.hidden||el.getAttribute('aria-hidden')==='true')return false;try{if(typeof el.checkVisibility==='function')return el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});}catch{}const style=getComputedStyle(el),rect=el.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity||1)>0&&rect.width>0&&rect.height>0;}
  function retryMainSurface(){return mainContentSurface()||document.body;}
  function retryButtonLabel(el){return [el.innerText,el.textContent,el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-testid')].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();}
  function isRetryActionButton(el){if(el.closest('#diy-sidebar-toggle-probe,#diy-usage-settings,#diy-input-history,#diy-input-history-panel,#diy-recent-conversations,#diy-recent-projects'))return false;const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();const aria=(el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim();const meta=[aria,el.getAttribute('data-testid')||'',el.getAttribute('title')||''].join(' ');return retryButtonPattern.test(text)||retryButtonPattern.test(aria)||/\b(retry|try again|continue|resume|retry request|try again now)\b/i.test(meta);}
  function findCapacityRetryButton(root){return [...root.querySelectorAll('button,[role="button"]')].find(el=>retryIsVisible(el)&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&isRetryActionButton(el));}
  function activeRetryDraft(root){const row=document.querySelector('[data-app-action-sidebar-thread-active="true"]'),title=(row?.getAttribute('data-app-action-sidebar-thread-title')||'').replace(/\s+/g,' ').trim(),id=row?.getAttribute('data-app-action-sidebar-thread-id')||'';return {row,title,id,isErrorTitle:!!title&&retryableErrorPattern.test(title),isDraft:id.includes('client-new-thread')};}
  function findNativeResumeAction(){const composer=visibleComposer();let element=composer?.parentElement;for(let depth=0;element&&depth<10;depth++,element=element.parentElement){const key=Object.keys(element).find(name=>name.startsWith('__reactFiber'));if(!key)continue;for(let fiber=element[key];fiber;fiber=fiber.return){const props=fiber.memoizedProps;if(typeof props?.onResume==='function'&&props.submitButtonMode==='stop'&&props.hasMessageContent===false&&props.isResumePending!==true)return props.onResume;}}return null;}
  function capacityRetryTick(){
    if(!capacityRetryEnabled||disposed)return;
    performanceStats.retryScans++;
    const root=retryMainSurface(),text=(root?.textContent||'').replace(/\s+/g,' '),draft=activeRetryDraft(root);
    if(!retryableErrorPattern.test(text)&&!draft.isErrorTitle){capacityRetrySignature='';capacityRetryAttempt=0;capacityRetryNextAt=0;return;}
    const button=findCapacityRetryButton(root),resume=draft.isErrorTitle?findNativeResumeAction():null;
    if(!button&&!resume)return;
    const active=draft.id||location.pathname;
    const matched=draft.isErrorTitle?'active-title:'+draft.title:(text.match(/selected model is at capacity[^\n]{0,180}|unexpected status\s*503[^\n]{0,240}|503\s+service unavailable[^\n]{0,240}|auth[_ -]?unavailable[^\n]{0,180}|no auth available[^\n]{0,180}|server[_ -]?error[^\n]{0,180}|服务不可用[^\n]{0,120}|模型容量[^\n]{0,120}/i)?.[0]||'retryable-error');
    const signature=active+'|'+matched.toLowerCase().slice(0,260);
    const now=Date.now();
    if(signature!==capacityRetrySignature){capacityRetrySignature=signature;capacityRetryAttempt=0;capacityRetryNextAt=now+350;}
    if(now<capacityRetryNextAt||now-capacityRetryLastClick<2000)return;
    capacityRetryLastClick=now;capacityRetryAttempt+=1;capacityRetryNextAt=now+10000;
    try{if(button){button.focus({preventScroll:true});button.click();}else resume();}catch{try{if(button)button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));else resume();}catch{}}
  }
  function queueCapacityRetryScan(delay=1000){if(!capacityRetryEnabled||capacityRetryScanTimer!==null)return;capacityRetryScanTimer=setTimeout(()=>{capacityRetryScanTimer=null;capacityRetryTick();},delay);}
  function setCapacityRetryEnabled(value){
    capacityRetryEnabled=!!value;try{localStorage.setItem('diy-capacity-auto-retry',capacityRetryEnabled?'on':'off');}catch{}
    if(capacityRetryTimer){clearInterval(capacityRetryTimer);capacityRetryTimer=null;}
    if(capacityRetryScanTimer!==null){clearTimeout(capacityRetryScanTimer);capacityRetryScanTimer=null;}
    if(capacityRetryObserver){capacityRetryObserver.disconnect();capacityRetryObserver=null;}
    capacityRetrySignature='';capacityRetryAttempt=0;capacityRetryNextAt=0;
    if(capacityRetryEnabled){
      capacityRetryTimer=setInterval(capacityRetryTick,10000);
      capacityRetryObserver=new MutationObserver(records=>{if(records.some(record=>!pluginMutation(record)))queueCapacityRetryScan();});
      if(document.body)capacityRetryObserver.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled','aria-disabled','hidden']});
      queueCapacityRetryScan(250);
    }
    updateSettingsButton();
  }
  function setQuickBarEnabled(value){quickBarEnabled=!!value;try{localStorage.setItem('diy-quickbar-enabled',quickBarEnabled?'on':'off');}catch{}recentSignature='';updateSettingsButton();mountPanel();}
  function setRightPanelEnabled(value){rightPanelEnabled=!!value;try{localStorage.setItem('diy-rightpanel-enabled',rightPanelEnabled?'on':'off');}catch{}historySignature='';updateSettingsButton();mountPanel();}
  function setAllowDismissedReturn(value){allowDismissedReturn=!!value;try{localStorage.setItem('diy-dismissed-recent-return-on-update',allowDismissedReturn?'on':'off');}catch{}updateSettingsButton();}
  compactCSS.textContent+='.diy-settings-checkbox{-webkit-appearance:none;appearance:none;box-sizing:border-box;flex:0 0 16px;width:16px;height:16px;margin:0;border:1px solid #7b8491;border-radius:3px;background:transparent;cursor:pointer;}.diy-settings-checkbox:checked{border-color:#3b82f6;background-color:#3b82f6;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M3 8l3 3 7-7%27 fill=%27none%27 stroke=%27%23fff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E");background-position:center;background-repeat:no-repeat;background-size:12px 12px;}.diy-settings-checkbox:focus-visible{outline:2px solid #60a5fa;outline-offset:2px;}.diy-output-panel-right-bridge{overflow-x:visible!important;overflow-y:clip!important;}.diy-output-panel-right-portal{translate:var(--diy-output-panel-shift) 0!important;}';
  function settingRow(label,checked){const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;';const text=document.createElement('span');text.textContent=L(label);text.style.cssText='min-width:0;flex:1 1 auto;overflow-wrap:anywhere;';const input=document.createElement('input');input.type='checkbox';input.className='diy-settings-checkbox';input.checked=checked;row.append(text,input);return {row,input,text};}
  function settingSelectRow(label,value,options){const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;';const text=document.createElement('span');text.textContent=L(label);const select=document.createElement('select');select.style.cssText='max-width:145px;box-sizing:border-box;padding:4px 6px;background:#151515;color:#eee;border:1px solid #555;border-radius:5px;font:inherit;';for(const [optionValue,optionLabel]of options){const option=document.createElement('option');option.value=optionValue;option.dataset.label=optionLabel;option.textContent=L(optionLabel);select.append(option);}select.value=value;row.append(text,select);return {row,text,select};}
  settingsButton.onclick=()=>{
    const existing=document.getElementById('diy-usage-settings');if(existing){existing.remove();settingsFormRefresh=null;return;}
    const form=document.createElement('form');form.id='diy-usage-settings';form.style.cssText='position:fixed;right:8px;bottom:42px;z-index:2147483647;width:310px;padding:12px;display:flex;flex-direction:column;gap:9px;background:#202123;color:#eee;border:1px solid #555;border-radius:8px;box-shadow:0 8px 30px #0008;font:12px system-ui;';
    const title=document.createElement('strong');
    const projectSort=settingRow('项目按最近主动使用排序',enabled),quick=settingRow('输入框下方快捷会话栏',quickBarEnabled),right=settingRow('右侧当前会话历史提问',rightPanelEnabled),allowReturn=settingRow('移除的会话再次活动后回到快捷栏',allowDismissedReturn),capacityRetry=settingRow('失败会话每 10 秒自动重试',capacityRetryEnabled),language=settingSelectRow('界面语言',uiLanguagePreference,[['auto','跟随 Codex'],['zh','简体中文'],['en','English']]);
    const separator=document.createElement('div');separator.style.cssText='height:1px;background:#ffffff18;margin:2px 0;';
    const address=document.createElement('input');address.type='url';address.required=true;address.value=window.__diyUsageConfig?.url||'';
    const key=document.createElement('input');key.type='password';key.autocomplete='new-password';
    for(const input of [address,key])input.style.cssText='width:100%;box-sizing:border-box;padding:7px;background:#151515;color:#eee;border:1px solid #555;border-radius:5px;font:inherit;';
    let messageKey='开关即时保存；额度地址和密钥仅保存在本机。';const message=document.createElement('div');message.style.opacity='.7';
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap;';
    const save=document.createElement('button');save.type='submit';
    const restoreDismissed=document.createElement('button');restoreDismissed.type='button';restoreDismissed.onclick=()=>{dismissedRecent.clear();dismissedAt={};try{localStorage.setItem('diy-dismissed-recent-conversations','[]');localStorage.setItem('diy-dismissed-recent-at','{}');}catch{}recentSignature='';messageKey='已恢复全部手动移除的会话。';message.textContent=L(messageKey);mountPanel();};
    const close=document.createElement('button');close.type='button';close.onclick=()=>{form.remove();settingsFormRefresh=null;};
    const refreshLabels=()=>{title.textContent=L('侧栏增强设置');projectSort.text.textContent=L('项目按最近主动使用排序');quick.text.textContent=L('输入框下方快捷会话栏');right.text.textContent=L('右侧当前会话历史提问');allowReturn.text.textContent=L('移除的会话再次活动后回到快捷栏');capacityRetry.text.textContent=L('失败会话每 10 秒自动重试');language.text.textContent=L('界面语言');language.select.setAttribute('aria-label',L('界面语言'));for(const option of language.select.options)option.textContent=L(option.dataset.label);address.setAttribute('aria-label',L('额度接口地址'));address.placeholder=L('额度接口地址');key.setAttribute('aria-label',L('额度密钥'));key.placeholder=window.__diyUsageConfig?.configured?L('额度密钥已保存，留空保持不变'):L('输入额度密钥');message.textContent=L(messageKey);save.textContent=L('保存额度设置');restoreDismissed.textContent=L('恢复已移除会话');close.textContent=L('关闭');};
    projectSort.input.addEventListener('change',()=>setEnabled(projectSort.input.checked));
    quick.input.addEventListener('change',()=>setQuickBarEnabled(quick.input.checked));
    right.input.addEventListener('change',()=>setRightPanelEnabled(right.input.checked));
    allowReturn.input.addEventListener('change',()=>setAllowDismissedReturn(allowReturn.input.checked));
    capacityRetry.input.addEventListener('change',()=>setCapacityRetryEnabled(capacityRetry.input.checked));
    language.select.addEventListener('change',()=>setUiLanguagePreference(language.select.value));
    actions.append(save,restoreDismissed,close);form.append(title,language.row,projectSort.row,quick.row,right.row,allowReturn.row,capacityRetry.row,separator,address,key,message,actions);document.body.append(form);settingsFormRefresh=refreshLabels;refreshLabels();
    form.onsubmit=e=>{e.preventDefault();let url;try{url=new URL(address.value.trim());if(!['http:','https:'].includes(url.protocol))throw Error();}catch{messageKey='请输入有效的 HTTP 或 HTTPS 地址。';message.textContent=L(messageKey);return;}
      if(!key.value.trim()&&!window.__diyUsageConfig?.configured){messageKey='请输入密钥。';message.textContent=L(messageKey);return;}
      window.__diyUsageConfigRequest={id:Date.now(),url:url.origin,key:key.value.trim()};key.value='';messageKey='正在保存并刷新…';message.textContent=L(messageKey);save.disabled=true;
    };
  };
  updateSettingsButton();
  function setUiLanguagePreference(value){if(!['auto','zh','en'].includes(value))return;uiLanguagePreference=value;try{localStorage.setItem(UI_LANGUAGE_KEY,value);}catch{}const previous=uiLanguage;uiLanguage=detectUiLanguage();if(previous===uiLanguage){settingsFormRefresh?.();return;}settingsButton.textContent=L('设置');updateSettingsButton();status.textContent=`${L('已开启')} · ${stats.projects} ${L('个项目')} · ${L('最近活动排序')}`;recentBar.setAttribute('aria-label',L('快捷会话'));recentProjectsSection.setAttribute('aria-label',L('最近项目'));recentProjectsTitle.textContent=L('最近项目');historyPanel.setAttribute('aria-label',L('当前会话历史提问'));historyContainer.setAttribute('aria-label',L('当前会话历史提问'));historyResizeHandle.setAttribute('aria-label',L('拖拽调整右侧会话栏宽度'));historyExpandButton.textContent=L('历史');historyExpandButton.title=L('展开右侧历史提问');historyExpandButton.setAttribute('aria-label',L('展开右侧历史提问'));historyCollapseButton.title=L(historyCollapsed?'展开历史提问栏':'收起历史提问栏');historyCollapseButton.setAttribute('aria-label',historyCollapseButton.title);recentSignature='';projectSignature='';historySignature='';closeRecentMenu();mountPanel();mountUsageBox();settingsFormRefresh?.();}
  const recentBar=document.createElement('div');recentBar.id='diy-recent-conversations';
  recentBar.setAttribute('aria-label',L('快捷会话'));recentBar.style.cssText='position:relative;display:block;width:100%;max-width:100%;box-sizing:border-box;margin-top:5px;padding-bottom:3px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin;';
  const recentDock=document.createElement('div');recentDock.id='diy-quickbar-dock';recentDock.style.cssText='position:relative;display:flex;align-items:flex-start;gap:5px;width:100%;min-width:0;margin-top:5px;';
  recentBar.style.marginTop='0';recentBar.style.flex='1 1 0';recentBar.style.minWidth='0';recentDock.append(recentBar);
  const recentMoreButton=document.createElement('button');recentMoreButton.type='button';recentMoreButton.id='diy-quickbar-more-button';recentMoreButton.hidden=true;recentMoreButton.setAttribute('aria-haspopup','dialog');recentMoreButton.setAttribute('aria-expanded','false');recentMoreButton.style.cssText='flex:0 0 auto;align-self:flex-start;box-sizing:border-box;height:51px;min-width:58px;max-width:78px;padding:5px 7px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:6px;background:transparent;color:inherit;cursor:pointer;font:11px system-ui;';recentMoreButton.onclick=()=>{if(moreMenuState)closeRecentMenu();else openMoreMenu();};recentDock.append(recentMoreButton);
  const recentTrack=document.createElement('div');recentTrack.style.cssText='position:relative;height:51px;';recentBar.append(recentTrack);
  const RECENT_WIDTH=150,RECENT_GAP=5,RECENT_STRIDE=RECENT_WIDTH+RECENT_GAP;
  let recentItems=[],recentRange='',recentRenderFrame=0;
  function updateRecentButton(button,item,index){
    button.dataset.recentThreadId=item.id;button.dataset.quickGroup=item.running?'running':item.completed&&!item.viewed?'unread':item.failed?'error':item.unknown?'unknown':'viewed';button.dataset.runtimeState=item.state||'unknown';
    const nextTitle=item.project+' · '+item.title+' · '+stateLabel(item)+(item.active?L(' · 当前活动会话'):'');if(button.title!==nextTitle)button.title=nextTitle;
    button.style.left=(index*RECENT_STRIDE)+'px';
    button.style.borderColor=item.running?'color-mix(in srgb,#3b82f6 65%,transparent)':item.completed&&!item.viewed?'color-mix(in srgb,#f59e0b 75%,transparent)':item.failed?'color-mix(in srgb,#ef4444 75%,transparent)':item.unknown?'color-mix(in srgb,#94a3b8 40%,transparent)':'color-mix(in srgb,#22c55e 45%,transparent)';
    if(item.completed)button.dataset.completionViewed=String(item.viewed);else delete button.dataset.completionViewed;
    if(item.active){
      // Selection is independent of runtime/completion state; keep the state hue.
      const tint=item.running?'96,165,250':item.completed&&!item.viewed?'251,191,36':item.failed?'248,113,113':item.unknown?'148,163,184':'74,222,128';
      const glow=item.running?'59,130,246':item.completed&&!item.viewed?'245,158,11':item.failed?'239,68,68':item.unknown?'100,116,139':'34,197,94';
      const edge=item.running?'147,197,253':item.completed&&!item.viewed?'252,211,77':item.failed?'252,165,165':item.unknown?'203,213,225':'134,239,172';
      button.dataset.activeSession='true';button.setAttribute('aria-current','true');
      button.style.background='linear-gradient(145deg,rgba(255,255,255,.27),rgba('+tint+',.18) 52%,rgba('+glow+',.12))';
      button.style.backdropFilter='blur(8px) saturate(155%)';button.style.webkitBackdropFilter='blur(8px) saturate(155%)';
      button.style.borderColor='rgba('+edge+',.88)';
      button.style.boxShadow='inset 0 1px 0 rgba(255,255,255,.52),inset 0 0 0 1px rgba(255,255,255,.09),0 0 9px rgba('+glow+',.16)';
    }else{delete button.dataset.activeSession;button.removeAttribute('aria-current');button.style.background='transparent';button.style.backdropFilter='';button.style.webkitBackdropFilter='';button.style.boxShadow='';}
    const project=button.querySelector('[data-recent-project]'),title=button.querySelector('[data-recent-title]'),top=project?.parentElement;
    if(project){project.style.flex='1';project.style.minWidth='0';}if(top)top.style.paddingRight='15px';
    if(project&&project.textContent!==item.project)project.textContent=item.project;if(title&&title.textContent!==item.title)title.textContent=item.title;
    let indicator=top?.querySelector('.diy-runtime-indicator');
    if(item.running&&!indicator){indicator=document.createElement('span');indicator.className='diy-runtime-indicator';indicator.setAttribute('role','status');top.append(indicator);}
    if(item.running&&indicator)indicator.setAttribute('aria-label',L('正在运行'));else if(!item.running)indicator?.remove();
    let mark=top?.querySelector('.diy-status-mark');if((item.failed||item.unknown)&&!mark){mark=document.createElement('span');mark.className='diy-status-mark';mark.style.cssText='flex:0 0 auto;font:700 10px system-ui;';top?.append(mark);}if(mark){if(item.failed||item.unknown){mark.textContent=item.failed?'!':'?';mark.style.color=item.failed?'#f87171':'#94a3b8';mark.title=stateLabel(item);mark.setAttribute('aria-label',mark.title);}else mark.remove();}
  }
  function makeRecentButton(item,index){
    const button=document.createElement('button');button.type='button';
    button.style.cssText='position:absolute;left:0;top:0;box-sizing:border-box;width:'+RECENT_WIDTH+'px;height:51px;min-width:0;text-align:left;padding:5px 7px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:6px;background:transparent;color:inherit;cursor:pointer;';
    const project=document.createElement('div');project.dataset.recentProject='';project.style.cssText='font:10px system-ui;opacity:.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    const title=document.createElement('div');title.dataset.recentTitle='';title.style.cssText='font:12px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    const top=document.createElement('div');top.style.cssText='display:flex;align-items:center;gap:4px;min-width:0;';top.append(project);button.append(top,title);
    button.onclick=()=>{const current=recentItems.find(entry=>entry.id===button.dataset.recentThreadId);if(current)openRecent(current);};
    button.oncontextmenu=event=>{const current=recentItems.find(entry=>entry.id===button.dataset.recentThreadId);if(current)showRecentMenu(event,current);};
    updateRecentButton(button,item,index);return button;
  }
  function removeQuickItem(item){
    if(!item?.id)return;dismissedRecent.add(item.id);dismissedAt[item.id]=Math.max(Date.now(),usageState.threads[item.id]?.usedAt||0);saveDismissed();closeRecentMenu();recentSignature='';mountPanel();
  }
  function makeQuickRemoveButton(item){
    const button=document.createElement('button');button.type='button';button.dataset.diyQuickRemoveId=item.id;button.textContent='×';button.style.cssText='position:absolute;top:1px;z-index:2;box-sizing:border-box;width:20px;height:20px;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;opacity:.45;cursor:pointer;font:15px system-ui;line-height:20px;';button.onmouseenter=()=>button.style.opacity='1';button.onmouseleave=()=>button.style.opacity='.45';button.onclick=event=>{event.preventDefault();event.stopPropagation();const current=allQuickItems.find(entry=>entry.id===button.dataset.diyQuickRemoveId);if(current)removeQuickItem(current);};return button;
  }
  function renderRecentWindow(force=false){
    const cards=new Map([...recentTrack.querySelectorAll(':scope > [data-recent-thread-id]')].map(button=>[button.dataset.recentThreadId,button])),removes=new Map([...recentTrack.querySelectorAll(':scope > [data-diy-quick-remove-id]')].map(button=>[button.dataset.diyQuickRemoveId,button])),keep=new Set(recentItems.map(item=>item.id));
    for(const [id,button]of cards)if(!keep.has(id))button.remove();for(const [id,button]of removes)if(!keep.has(id))button.remove();
    recentItems.forEach((item,index)=>{let button=cards.get(item.id);if(!button){button=makeRecentButton(item,index);recentTrack.append(button);}else updateRecentButton(button,item,index);button.style.transition='none';if(recentTrack.children[index]!==button)recentTrack.insertBefore(button,recentTrack.children[index]||null);});
    recentItems.forEach((item,index)=>{const remove=removes.get(item.id)||makeQuickRemoveButton(item);remove.style.left=(index*RECENT_STRIDE+RECENT_WIDTH-21)+'px';remove.title=L('从快捷栏移除')+' · '+item.title;remove.setAttribute('aria-label',remove.title);if(remove.parentElement!==recentTrack)recentTrack.append(remove);});
  }
  function onRecentBarScroll(){if(recentRenderFrame)return;recentRenderFrame=requestAnimationFrame(()=>{recentRenderFrame=0;renderRecentWindow();});}
  function onRecentBarWheel(event){
    if(recentBar.scrollWidth<=recentBar.clientWidth||!event.deltaY)return;
    event.preventDefault();recentBar.scrollLeft+=event.deltaY;renderRecentWindow();
  }
  recentBar.addEventListener('scroll',onRecentBarScroll,{passive:true});
  recentBar.addEventListener('wheel',onRecentBarWheel,{passive:false});
  const usageBox=document.createElement('div');usageBox.id='diy-usage-box';usageBox.style.cssText='min-width:0;box-sizing:border-box;display:flex;flex:1 1 auto;flex-direction:column;justify-content:center;padding:5px 7px;border:1px solid var(--diy-usage-color,#64748b);border-radius:6px;color:inherit;background:transparent;font-size:11px;line-height:1.45;white-space:nowrap;cursor:pointer;';
  let usageIndex=0,usageCount=0;
  function quotaLabel(quota,index,quotas){const same=quotas.filter(q=>q.label===quota.label);return same.length>1?quota.label+' '+(same.indexOf(quota)+1):quota.label;}
  function showUsageQuota(step=false){
    const data=window.__diyUsage,quotas=(data?.quotas||[]).filter(q=>Number.isFinite(Number(q.remainingPercent))).sort((a,b)=>Number(a.remainingPercent)-Number(b.remainingPercent));
    usageCount=quotas.length;if(!usageCount)return false;if(step)usageIndex=(usageIndex+1)%usageCount;else usageIndex%=usageCount;
    const quota=quotas[usageIndex],remaining=Number(quota.remainingPercent),color=remaining<=10?'#ef4444':remaining<=40?'#f59e0b':'#22c55e';
    usageBox.style.setProperty('--diy-usage-color',color);
    usageBox.textContent=quotaLabel(quota,usageIndex,quotas)+L(' 剩余 ')+remaining.toFixed(0)+'%\n'+L('额度 ')+(usageIndex+1)+' / '+usageCount;usageBox.style.whiteSpace='pre-line';
    usageBox.title=L('账号共享剩余额度（非现金余额）')+'\n'+L('当前额度：')+quotaLabel(quota,usageIndex,quotas)+'\n'+L('剩余：')+remaining.toFixed(2)+'%\n'+L('重置：')+(quota.resetAt?new Date(quota.resetAt).toLocaleString():'—')+'\n'+L('点击切换下一项')+(data.failed?'\n'+L('刷新失败，当前为上次数据'):'\n'+L('每 30 秒刷新'));
    return true;
  }
  usageBox.setAttribute('role','button');usageBox.tabIndex=0;
  usageBox.onclick=event=>{if(event.shiftKey&&!usageHidden){usageRenderSignature='';showUsageQuota(true);return;}usageHidden=!usageHidden;try{localStorage.setItem('diy-usage-hidden',usageHidden?'on':'off');}catch{}mountUsageBox();};
  usageBox.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();usageBox.click();}};
  let usageRenderSignature='';
  function mountUsageBox(){
    const data=window.__diyUsage,signature=JSON.stringify([data,usageIndex,usageHidden,uiLanguage]);
    if(signature===usageRenderSignature)return;usageRenderSignature=signature;
    if(usageHidden){usageBox.textContent=L(data?'额度已隐藏 · 点击显示':'额度隐藏 · 点击显示');usageBox.style.whiteSpace='normal';usageBox.title=L('点击显示额度；按住 Shift 点击可切换额度项');usageBox.setAttribute('aria-label',L('额度已隐藏，点击显示'));return;}
    if(!data){usageBox.textContent=L('额度未配置');usageBox.title=L('额度接口尚未配置');return;}
    if(!showUsageQuota()){usageBox.textContent=L('额度暂不可用');usageCount=0;}
    usageBox.style.opacity=data.failed?'.55':'1';
    usageBox.title=L('账号共享剩余额度（非现金余额）')+'\n'+L('点击隐藏额度；按住 Shift 点击切换额度项')+(data.failed?'\n'+L('刷新失败，当前为上次数据'):'\n'+L('每 30 秒刷新'));usageBox.setAttribute('aria-label',L('额度显示中，点击隐藏'));
  }
  const historyPanel=document.createElement('section');historyPanel.id='diy-input-history';historyPanel.setAttribute('aria-label',L('当前会话历史提问'));historyPanel.style.cssText='display:flex;flex:1 1 auto;min-height:0;height:100%;flex-direction:column;color:inherit;font:12px system-ui;overflow:hidden;';
  const historyHeading=document.createElement('div');historyHeading.style.cssText='display:flex;flex:0 0 auto;align-items:center;justify-content:flex-start;gap:8px;padding:8px 10px;border-bottom:1px solid color-mix(in srgb,currentColor 14%,transparent);font-weight:600;';
  const historyTitle=document.createElement('span');historyTitle.textContent=L('当前会话 · 历史提问');historyTitle.style.cssText='min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  const historyCollapseButton=document.createElement('button');historyCollapseButton.type='button';historyCollapseButton.setAttribute('aria-label',L('收起历史提问栏'));historyCollapseButton.title=L('收起历史提问栏');historyCollapseButton.style.cssText='display:flex;flex:0 0 28px;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:6px;background:transparent;color:inherit;opacity:.8;cursor:pointer;';
  const historyCollapseIcon=document.createElementNS('http://www.w3.org/2000/svg','svg');historyCollapseIcon.setAttribute('viewBox','0 0 20 20');historyCollapseIcon.setAttribute('width','16');historyCollapseIcon.setAttribute('height','16');historyCollapseIcon.setAttribute('fill','none');historyCollapseIcon.setAttribute('stroke','currentColor');historyCollapseIcon.setAttribute('stroke-width','1.8');historyCollapseIcon.setAttribute('stroke-linecap','round');historyCollapseIcon.setAttribute('stroke-linejoin','round');const historyCollapsePath=document.createElementNS('http://www.w3.org/2000/svg','path');historyCollapsePath.setAttribute('d','M7 4l6 6-6 6');historyCollapseIcon.append(historyCollapsePath);historyCollapseButton.append(historyCollapseIcon);historyCollapseButton.onmouseenter=()=>historyCollapseButton.style.background='var(--color-background-primary-ghost-hover,rgba(127,127,127,.12))';historyCollapseButton.onmouseleave=()=>historyCollapseButton.style.background='var(--color-background)';historyCollapseButton.onclick=()=>setHistoryCollapsed(!historyCollapsed,true);historyHeading.append(historyTitle);
  const historyExpandButton=document.createElement('button');historyExpandButton.id='diy-input-history-expand';historyExpandButton.type='button';historyExpandButton.textContent=L('历史');historyExpandButton.title=L('展开右侧历史提问');historyExpandButton.setAttribute('aria-label',L('展开右侧历史提问'));historyExpandButton.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;padding:3px 7px;border:1px solid #64748b;border-radius:6px;background:#18212f;color:#fff;font:11px system-ui;cursor:pointer;';historyExpandButton.onclick=()=>setHistoryCollapsed(false,true);
  const historyBody=document.createElement('div');historyBody.style.cssText='display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:8px;padding:9px;overflow-y:auto;overscroll-behavior:contain;';
  const historyFooter=document.createElement('div');historyFooter.id='diy-input-history-footer';historyFooter.style.cssText='display:flex;flex:0 0 auto;align-items:center;gap:6px;padding:8px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);';
  historyPanel.append(historyHeading,historyBody,historyFooter);
  let historySignature='',draggingHistoryText='',historyDragStarted=false;
  function currentHistoryThreadId(){return selectedThreadId();}
  function focusHistoryTurn(item){const needle=(item.user||'').replace(/\s+/g,' ').trim();if(!needle)return;const match=[...document.querySelectorAll('p,pre,code,[data-message-author-role],[data-message-content]')].find(node=>node.textContent?.replace(/\s+/g,' ').includes(needle.slice(0,120)));if(match){match.scrollIntoView({behavior:'smooth',block:'center'});match.animate?.([{backgroundColor:'transparent'},{backgroundColor:'color-mix(in srgb,#3b82f6 22%,transparent)'},{backgroundColor:'transparent'}],{duration:900});}}
  function currentProjectThreadIds(){const active=document.querySelector('[data-app-action-sidebar-thread-active="true"]'),group=active?.closest('div[data-sidebar-project-kind]'),header=group?.querySelector('[data-app-action-sidebar-project-row]'),id=header?.getAttribute('data-app-action-sidebar-project-id'),nativeGroup=id?props(header,p=>p.group?.projectId===id)?.group:null;return [...new Set((nativeGroup?.threadKeys||[]).map(key=>String(key).replace(/^local:/,'')).filter(Boolean))];}
  function mountInputHistory(){
    if(!rightPanelEnabled||historyCollapsed)return;
    const current=currentHistoryThreadId(),source=window.__diyInputHistoryThreadId||'',items=current&&source===current?(window.__diyInputHistory||[]).filter(item=>item?.id).slice().reverse():[],signature=JSON.stringify([current,source,items.map(item=>[item.id,item.current,item.time,item.title,item.user.length,item.assistant?.length||0,item.user.slice(0,120),item.assistant?.slice(0,120)])]);if(signature===historySignature)return;historySignature=signature;historyBody.replaceChildren();historyBody.scrollTop=0;
    if(!items.length){historyTitle.textContent=L(current&&source!==current?'当前会话 · 正在读取历史…':'当前会话 · 暂无历史提问');const empty=document.createElement('div');empty.textContent=L(current&&source!==current?'正在读取当前会话历史…':'当前会话暂无历史提问');empty.style.cssText='padding:8px;opacity:.55;';historyBody.append(empty);return;}
    historyTitle.textContent=L('当前会话 · ')+items.length+L(' 条历史提问');
    for(const item of items){const card=document.createElement('div');card.draggable=true;card.tabIndex=0;card.dataset.historyTurnId=item.id;card.setAttribute('role','button');card.setAttribute('aria-label',L('定位历史提问：')+item.title);card.title=L('单击定位当前会话中的这条提问；拖到输入框可引用提问和 Codex 回复');card.style.cssText='position:relative;box-sizing:border-box;flex:0 0 148px;width:100%;height:148px;max-height:148px;min-width:0;padding:9px 10px;overflow:hidden;contain:paint;border:1px solid '+(item.current?'#3b82f6':'color-mix(in srgb,currentColor 15%,transparent)')+';border-radius:9px;background:'+(item.current?'color-mix(in srgb,#3b82f6 9%,var(--color-background))':'color-mix(in srgb,currentColor 3%,transparent)')+';box-shadow:0 1px 3px rgba(0,0,0,.12);cursor:pointer;user-select:none;transition:background-color .12s,border-color .12s,box-shadow .12s;';
      const meta=document.createElement('div');meta.style.cssText='display:flex;align-items:center;gap:6px;margin-bottom:6px;';const title=document.createElement('strong');title.textContent=item.title;title.style.cssText='min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;';meta.append(title);if(item.current){const badge=document.createElement('span');badge.textContent=L('当前');badge.style.cssText='flex:0 0 auto;padding:1px 5px;border-radius:8px;background:#3b82f6;color:white;font-size:9px;line-height:1.5;';meta.append(badge);}
      const userLabel=document.createElement('div');userLabel.textContent=L('你');userLabel.style.cssText='font-size:10px;font-weight:600;opacity:.65;';
      const userExcerpt=document.createElement('div');userExcerpt.textContent=(item.user||L('暂无可预览的用户输入')).replace(/\s+/g,' ').trim();userExcerpt.style.cssText='display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;max-width:100%;max-height:2.84em;overflow:hidden;line-height:1.42;overflow-wrap:anywhere;word-break:break-word;white-space:normal;';
      const assistantLabel=document.createElement('div');assistantLabel.textContent='Codex';assistantLabel.style.cssText='margin-top:5px;font-size:10px;font-weight:600;opacity:.65;';
      const assistantExcerpt=document.createElement('div');assistantExcerpt.textContent=(item.assistant||L('等待回复…')).replace(/\s+/g,' ').trim();assistantExcerpt.style.cssText='display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;max-width:100%;max-height:4.26em;overflow:hidden;line-height:1.42;overflow-wrap:anywhere;word-break:break-word;white-space:normal;'+(item.assistant?'':'opacity:.45;');card.append(meta,userLabel,userExcerpt,assistantLabel,assistantExcerpt);
      card.onclick=()=>{if(!historyDragStarted)focusHistoryTurn(item);};card.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();focusHistoryTurn(item);}};
      card.ondragstart=event=>{historyDragStarted=true;draggingHistoryText=item.text;event.dataTransfer.effectAllowed='copy';event.dataTransfer.setData('application/x-diy-input-history',item.text);event.dataTransfer.setData('text/plain',item.text);card.style.opacity='.55';};card.ondragend=()=>{draggingHistoryText='';card.style.opacity='1';setTimeout(()=>historyDragStarted=false,80);for(const composer of document.querySelectorAll('[data-codex-composer]'))composer.removeAttribute('data-diy-history-drop');};historyBody.append(card);
    }
  }
  function historyDropText(event){return event.dataTransfer?.getData('application/x-diy-input-history')||draggingHistoryText;}
  function onHistoryDragOver(event){const composer=event.target.closest?.('[data-codex-composer]');if(!composer||!historyDropText(event))return;event.preventDefault();event.dataTransfer.dropEffect='copy';composer.setAttribute('data-diy-history-drop','true');}
  function onHistoryDrop(event){const composer=event.target.closest?.('[data-codex-composer]'),text=historyDropText(event);if(!composer||!text)return;event.preventDefault();event.stopImmediatePropagation();composer.removeAttribute('data-diy-history-drop');const transfer=new DataTransfer(),content=text.trimEnd(),padded=content+'\n'+' '.repeat(Math.max(0,12000-content.length));transfer.setData('text/plain',padded);composer.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:transfer}));draggingHistoryText='';}
  document.addEventListener('dragover',onHistoryDragOver,true);document.addEventListener('drop',onHistoryDrop,true);
  compactCSS.textContent+='#diy-input-history [role="button"]:hover,#diy-input-history [role="button"]:focus-visible{background:var(--color-background-primary-ghost-hover,rgba(127,127,127,.12))!important;border-color:color-mix(in srgb,#3b82f6 65%,currentColor)!important;box-shadow:0 3px 10px rgba(0,0,0,.18)!important;outline:none;}[data-codex-composer][data-diy-history-drop="true"]{outline:2px solid #3b82f6!important;outline-offset:2px!important;}';
  let recentSignature='',recentSource=null,recentActiveId='',recentOrder=previousVisibleIds;
  try{const saved=JSON.parse(localStorage.getItem(QUICK_ORDER_KEY)||'null');if(Array.isArray(saved))recentOrder=saved.filter(id=>typeof id==='string');}catch{}
  let overflowItems=[],allQuickItems=[],moreMenuState=null,lastRevealedSelection='';
  function saveDismissed(){try{localStorage.setItem('diy-dismissed-recent-conversations',JSON.stringify([...dismissedRecent]));localStorage.setItem('diy-dismissed-recent-at',JSON.stringify(dismissedAt));}catch{}}
  const dismissedRecent=new Set();
  try{const ids=JSON.parse(localStorage.getItem('diy-dismissed-recent-conversations')||'[]');if(Array.isArray(ids))ids.forEach(id=>dismissedRecent.add(id));}catch{}
  let dismissedAt={};try{dismissedAt=JSON.parse(localStorage.getItem('diy-dismissed-recent-at')||'{}')||{};}catch{}
  for(const id of dismissedRecent)if(!Number.isFinite(dismissedAt[id]))dismissedAt[id]=window.__diySidebarTimes?.['local:'+id]||0;
  // 旧版永久移除记录迁移：当前最新且重新有活动的会话应重新出现。
  if(!localStorage.getItem('diy-dismissed-recent-migrated')){
    const latest=window.__diySidebarRecent?.[0];if(latest){dismissedRecent.delete(latest.id);delete dismissedAt[latest.id];}
    try{localStorage.setItem('diy-dismissed-recent-migrated','1');localStorage.setItem('diy-dismissed-recent-conversations',JSON.stringify([...dismissedRecent]));}catch{}
  }
  try{localStorage.setItem('diy-dismissed-recent-at',JSON.stringify(dismissedAt));}catch{}
  let recentMenu=null;
  function closeRecentMenu(){recentMenu?.remove();recentMenu=null;moreMenuState=null;recentMoreButton.setAttribute('aria-expanded','false');}
  function recentMenuOutside(event){if(recentMenu&&!recentMenu.contains(event.target)&&!recentMoreButton.contains(event.target))closeRecentMenu();}
  function recentMenuKey(event){if(event.key==='Escape'&&recentMenu){const wasMore=!!moreMenuState;closeRecentMenu();if(wasMore)recentMoreButton.focus({preventScroll:true});}}
  document.addEventListener('pointerdown',recentMenuOutside,true);
  window.addEventListener('keydown',recentMenuKey,true);
  window.addEventListener('blur',closeRecentMenu);
  function projectHeaderFor(item){
    const thread=document.querySelector('[data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');
    const exact=item.projectId&&document.querySelector('[data-app-action-sidebar-project-row][data-app-action-sidebar-project-id="'+CSS.escape(item.projectId)+'"]');
    if(exact)return exact;
    const fromThread=thread?.closest('div[data-sidebar-project-kind]')?.querySelector('[data-app-action-sidebar-project-row]');
    if(fromThread)return fromThread;
    const label=normalizedTitle(item.project);
    return label?[...document.querySelectorAll('[data-app-action-sidebar-project-row]')].find(row=>normalizedTitle(row.getAttribute('data-app-action-sidebar-project-label')||row.innerText).includes(label)):null;
  }
  function projectNewChatButton(item){
    const header=projectHeaderFor(item),pattern=/开始新聊天|新建会话|新对话|Start new chat|New chat in|New conversation/i;
    const candidates=header?[...header.querySelectorAll('button,[role="button"]')]:[];
    return candidates.find(button=>pattern.test(button.getAttribute('aria-label')||button.getAttribute('title')||button.innerText||''));
  }
  async function waitForProjectNewChatButton(item){
    for(let attempt=0;attempt<12&&!disposed;attempt++){const button=projectNewChatButton(item);if(button&&!button.disabled)return button;await new Promise(resolve=>setTimeout(resolve,80));}
    return projectNewChatButton(item);
  }
  function findViewRouter(){
    const elements=[document.querySelector('[data-app-action-sidebar-thread-row]'),visibleComposer(),document.getElementById('app-shell-sidebar')].filter(Boolean),seenFibers=new Set(),seenValues=new Set();
    for(const element of elements){let fiber=element[Object.keys(element).find(key=>key.startsWith('__reactFiber'))];for(let depth=0;fiber&&depth<180&&!seenFibers.has(fiber);fiber=fiber.return,depth++){seenFibers.add(fiber);for(let dep=fiber.dependencies?.firstContext;dep;dep=dep.next){const value=dep.memoizedValue;if(!value||seenValues.has(value))continue;seenValues.add(value);if(typeof value.router?.navigate==='function')return value.router;}}}
    return null;
  }
  async function sendHostMessage(message){
    if(message?.type==='navigate-to-route'){const router=findViewRouter();if(router){await router.navigate(message.path,{state:message.state});return;}}
    const send=window.electronBridge?.sendMessageFromView;if(typeof send==='function'){await send.call(window.electronBridge,message);return;}throw new Error('host navigation unavailable');
  }
  async function createProjectConversation(item){
    const button=await waitForProjectNewChatButton(item);
    if(button){
      recordActiveUse({projectId:item.projectId});button.click();recentBar.title='';
      setTimeout(()=>{if(!disposed){recentSignature='';projectSignature='';mountPanel();}},180);
      setTimeout(()=>{if(!disposed){recentSignature='';projectSignature='';mountPanel();}},650);
      return;
    }
    if(item.projectId){
      recordActiveUse({projectId:item.projectId});
      await sendHostMessage({type:'navigate-to-route',path:'/',state:{focusComposerNonce:Date.now(),project:{type:'local',projectId:item.projectId}}});
      recentBar.title='';
      setTimeout(()=>{if(!disposed){recentSignature='';projectSignature='';mountPanel();}},180);
      setTimeout(()=>{if(!disposed){recentSignature='';projectSignature='';mountPanel();}},650);
      return;
    }
    throw new Error('project conversation unavailable');
  }
  function stateLabel(item){return L(item.running?'正在运行':item.failed?(item.state==='interrupted'?'运行已中断':'运行失败'):item.unknown?'状态未读取':item.completed?(item.viewed?'已完成 · 已查看':'已完成 · 未查看'):'空闲');}
  function openMoreMenu(projectId=null){
    closeRecentMenu();if(!quickBarEnabled)return;
    const menu=document.createElement('section');menu.id='diy-quickbar-more';menu.setAttribute('role','dialog');menu.setAttribute('aria-label',L('更多会话'));menu.style.cssText='position:fixed;z-index:2147483647;box-sizing:border-box;display:flex;flex-direction:column;width:min(420px,calc(100vw - 16px));height:360px;max-height:calc(100vh - 24px);padding:10px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:10px;background:var(--color-background,#202123);color:inherit;box-shadow:0 10px 32px rgba(0,0,0,.28);font:12px system-ui;';
    const heading=document.createElement('div');heading.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:8px;';const title=document.createElement('strong');title.textContent=L('更多会话');const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label',L('关闭'));close.style.cssText='border:0;border-radius:4px;background:transparent;color:inherit;cursor:pointer;font-size:18px;';close.onclick=closeRecentMenu;heading.append(title,close);
    const search=document.createElement('input');search.type='search';search.placeholder=L('搜索会话或项目');search.setAttribute('aria-label',search.placeholder);search.style.cssText='box-sizing:border-box;width:100%;flex:0 0 auto;margin-bottom:8px;padding:7px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:6px;background:transparent;color:inherit;font:12px system-ui;';
    const list=document.createElement('div');list.setAttribute('role','list');list.style.cssText='flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;';menu.append(heading,search,list);document.body.append(menu);recentMenu=menu;moreMenuState={menu,list,search,title,projectId,limit:50,signature:''};recentMoreButton.setAttribute('aria-expanded','true');
    search.oninput=()=>{if(!moreMenuState)return;moreMenuState.limit=50;moreMenuState.signature='';list.scrollTop=0;renderMoreMenu();};renderMoreMenu();positionMoreMenu();search.focus({preventScroll:true});
  }
  function positionMoreMenu(){if(!moreMenuState)return;const rect=recentDock.getBoundingClientRect(),menu=moreMenuState.menu,width=menu.getBoundingClientRect().width||420,height=Math.min(360,window.innerHeight-24);menu.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.right-width))+'px';menu.style.top=Math.max(8,Math.min(window.innerHeight-height-8,rect.top-height-6))+'px';}
  function renderMoreMenu(){
    const state=moreMenuState;if(!state)return;const query=state.search.value.trim().toLocaleLowerCase();const source=state.projectId?allQuickItems.filter(item=>item.projectId===state.projectId):query?allQuickItems:overflowItems;
    const matches=source.filter(item=>!query||(item.project+' '+item.title).toLocaleLowerCase().includes(query)),visible=matches.slice(0,state.limit),signature=JSON.stringify([uiLanguage,query,state.limit,visible.map(item=>[item.id,item.title,item.project,item.running,item.completed,item.viewed,item.failed,item.unknown]),matches.length]);if(signature===state.signature)return;state.signature=signature;
    state.title.textContent=L('更多会话')+' ('+matches.length+')';const existing=new Map([...state.list.querySelectorAll('[data-diy-more-thread-id]')].map(button=>[button.dataset.diyMoreThreadId,button])),keep=new Set(visible.map(item=>item.id));for(const [id,button]of existing)if(!keep.has(id))button.remove();state.list.querySelector('[data-diy-more-footer]')?.remove();
    visible.forEach((item,index)=>{
      let button=existing.get(item.id);if(!button){button=document.createElement('button');button.type='button';button.dataset.diyMoreThreadId=item.id;button.setAttribute('role','listitem');button.style.cssText='display:block;width:100%;min-width:0;margin-bottom:5px;padding:7px;border:1px solid transparent;border-radius:6px;background:transparent;color:inherit;text-align:left;cursor:pointer;';const label=document.createElement('div');label.dataset.moreLabel='';label.style.cssText='font:12px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';const meta=document.createElement('div');meta.dataset.moreMeta='';meta.style.cssText='margin-top:3px;font:10px system-ui;opacity:.65;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';button.append(label,meta);button.onclick=()=>{const current=allQuickItems.find(item=>item.id===button.dataset.diyMoreThreadId);closeRecentMenu();if(current)void openRecent(current);};button.oncontextmenu=event=>{const current=allQuickItems.find(item=>item.id===button.dataset.diyMoreThreadId);if(current)void showRecentMenu(event,current);};}
      button.querySelector('[data-more-label]').textContent=item.title;button.querySelector('[data-more-meta]').textContent=item.project+' · '+stateLabel(item);button.title=item.project+' · '+item.title+' · '+stateLabel(item);button.style.borderColor=item.running?'#3b82f677':item.completed&&!item.viewed?'#f59e0b88':item.failed?'#ef444488':item.unknown?'#94a3b844':'#22c55e55';if(state.list.children[index]!==button)state.list.insertBefore(button,state.list.children[index]||null);
    });
    if(matches.length>state.limit){const more=document.createElement('button');more.type='button';more.dataset.diyMoreFooter='';more.textContent=L('再显示 50 条');more.style.cssText='width:100%;padding:8px;border:0;background:transparent;color:inherit;cursor:pointer;opacity:.65;';more.onclick=()=>{if(!moreMenuState)return;moreMenuState.limit+=50;renderMoreMenu();};state.list.append(more);}else if(!matches.length){const empty=document.createElement('div');empty.dataset.diyMoreFooter='';empty.textContent=L('没有匹配的会话');empty.style.cssText='padding:18px;text-align:center;opacity:.55;';state.list.append(empty);}
  }
  function revealActiveCard(){
    const index=recentItems.findIndex(item=>item.active);if(index<0)return;const key=recentItems[index].id+':'+index;if(key===lastRevealedSelection)return;lastRevealedSelection=key;const left=index*RECENT_STRIDE,right=left+RECENT_WIDTH;if(left<recentBar.scrollLeft)recentBar.scrollLeft=left;else if(right>recentBar.scrollLeft+recentBar.clientWidth)recentBar.scrollLeft=right-recentBar.clientWidth;
  }
  const recentDrafts=new Map();
  const recentThreadAliases=new Map();
  const normalizedTitle=value=>String(value||'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
  const placeholderDraftTitle=value=>/^(新建会话|新建聊天|新对话|新聊天|new chat|new conversation|start new chat)$/i.test(normalizedTitle(value));
  function nativeThreadKey(item){return recentThreadAliases.get(item.id)?.clientThreadId||item.id;}
  function projectDraftsFor(source){
    const now=Date.now(),saved=Array.isArray(source)?source:[];
    for(const row of document.querySelectorAll('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id^="local:client-new-thread:"]')){
      const id=row.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'');
      if(!id)continue;
      const rowProps=props(row,p=>typeof p.hoverCardProjectId==='string'&&p.hoverCardProjectId.length>0);
      const projectId=rowProps?.hoverCardProjectId||null;
      const cached=nativeClient?.getCachedConversations?.().find(item=>item.id===id),canonical=cached?.sessionId&&saved.find(item=>item.id===cached.sessionId);
      if(canonical){recentThreadAliases.set(canonical.id,{clientThreadId:id,projectId,lastSeen:now});recentDrafts.delete(id);continue;}
      const title=row.getAttribute('data-app-action-sidebar-thread-title')?.trim()||recentDrafts.get(id)?.item.title||'新建会话';
      const project=rowProps?.hoverCardProjectLabel||(projectId?saved.find(item=>item.projectId===projectId)?.project:'非项目')||'项目会话';
      const persisted=saved.find(entry=>entry.id===id||(projectId&&entry.projectId===projectId&&!placeholderDraftTitle(title)&&normalizedTitle(entry.title)===normalizedTitle(title)));
      if(persisted){if(persisted.id!==id)recentThreadAliases.set(persisted.id,{clientThreadId:id,projectId,title,lastSeen:now});recentDrafts.delete(id);continue;}
      const prior=recentDrafts.get(id);
      const item={id,title,project,projectId,time:prior?.item.time||now,draft:true};
      recentDrafts.set(id,{item,lastSeen:now});
    }
    const drafts=[];
    for(const [id,alias] of recentThreadAliases){
      if(!saved.some(entry=>entry.id===id)||now-alias.lastSeen>30*60*1000)recentThreadAliases.delete(id);
    }
    for(const [id,record] of recentDrafts){
      const item=record.item;
      const persisted=saved.some(entry=>entry.id===id||(entry.projectId===item.projectId&&!placeholderDraftTitle(item.title)&&normalizedTitle(entry.title)===normalizedTitle(item.title)));
      if(persisted||now-record.lastSeen>30*60*1000){recentDrafts.delete(id);continue;}
      drafts.push(item);
    }
    return drafts;
  }
  async function nativeMenuWithRemove(row,item){
    let fiber=row[Object.keys(row).find(k=>k.startsWith('__reactFiber'))],menuProps=null,intl=null;
    for(let depth=0;fiber&&depth<45;fiber=fiber.return,depth++){
      if(!menuProps&&fiber.memoizedProps?.getItems&&fiber.memoizedProps?.children)menuProps=fiber.memoizedProps;
      for(let dep=fiber.dependencies?.firstContext;dep;dep=dep.next)if(dep.memoizedValue?.formatMessage)intl=dep.memoizedValue;
      if(menuProps&&intl)break;
    }
    if(!menuProps||!intl||!window.electronBridge?.showContextMenu)return false;
    await menuProps.onBeforeOpen?.();
    const items=await menuProps.getItems();
    const actions=new Map();
    function convert(list){return list.map(entry=>{
      actions.set(entry.id,entry);
      const label=entry.message?intl.formatMessage(entry.message,entry.messageValues):entry.id;
      return {id:entry.id,type:entry.type==='separator'||entry.type==='radio'?entry.type:undefined,checked:entry.type==='radio'?entry.checked===true:undefined,label:entry.type==='separator'?'':entry.type!=='radio'&&entry.checked===true?'✓ '+label:label,icon:typeof entry.icon==='string'?entry.icon:undefined,accelerator:entry.accelerator,enabled:entry.enabled??true,toolTip:entry.tooltipMessage?intl.formatMessage(entry.tooltipMessage,entry.tooltipMessageValues):undefined,submenu:entry.submenu?convert(entry.submenu):undefined};
    });}
    const nativeItems=convert(items);nativeItems.push({id:'diy-remove-separator',type:'separator'},{id:'diy-new-project-conversation',label:L('新建项目会话'),enabled:!!item.projectId&&(typeof window.electronBridge?.sendMessageFromView==='function'||!!projectNewChatButton(item))},{id:'diy-remove-quick-conversation',label:L('从快捷栏移除'),enabled:true});
    document.dispatchEvent(new PointerEvent('pointercancel'));
    const selected=await window.electronBridge.showContextMenu(nativeItems);
    const selectedId=typeof selected==='string'?selected:selected?.id;
    if(selectedId==='diy-new-project-conversation'){try{await createProjectConversation(item);}catch{recentBar.title=L('无法打开该项目的新会话，请从原生项目栏创建。');}}
    else if(selectedId==='diy-remove-quick-conversation')removeQuickItem(item);
    else if(selectedId){const action=actions.get(selectedId);if(action?.enabled!==false)action?.onSelect?.();}
    return true;
  }
  async function showRecentMenu(event,item){
    event.preventDefault();event.stopPropagation();closeRecentMenu();
    const x=event.clientX,y=event.clientY;
    const findRow=()=>document.querySelector('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');
    let row=findRow();
    if(!row&&item.projectId){
      const header=document.querySelector('[data-app-action-sidebar-project-row][data-app-action-sidebar-project-id="'+CSS.escape(item.projectId)+'"]');
      if(header?.getAttribute('aria-expanded')==='false'){header.click();await new Promise(r=>setTimeout(r,60));}
      for(let attempt=0;attempt<8&&!disposed;attempt++){
        row=findRow();if(row)break;
        const list=document.querySelector('[data-app-action-sidebar-project-list-id="'+CSS.escape(item.projectId)+'"]');
        const more=[...(list?.querySelectorAll('button,[role="button"]')||[])].find(e=>/^(展开显示|加载更多|显示更多|Show more|Load more)$/i.test(e.textContent.trim()));
        if(!more)break;more.click();await new Promise(r=>setTimeout(r,100));
      }
      row=findRow();
    }
    if(row&&!disposed){try{if(await nativeMenuWithRemove(row,item))return;}catch{}}
    // Even unloaded/projectless rows must retain working Open and Remove actions.
    const menu=document.createElement('div');menu.id='diy-quick-actions';menu.setAttribute('role','menu');menu.style.cssText='position:fixed;z-index:2147483647;min-width:180px;padding:5px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);border-radius:7px;background:var(--color-background,#202123);color:inherit;box-shadow:0 8px 24px rgba(0,0,0,.25);';
    for(const [label,action]of [[L('打开会话'),()=>void openRecent(item)],[L('从快捷栏移除'),()=>removeQuickItem(item)]]){const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.textContent=label;button.style.cssText='display:block;width:100%;padding:7px 9px;border:0;border-radius:4px;background:transparent;color:inherit;text-align:left;cursor:pointer;font:12px system-ui;';button.onclick=()=>{closeRecentMenu();action();};menu.append(button);}recentMenu=menu;document.body.append(menu);const rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(window.innerWidth-rect.width-8,x||recentBar.getBoundingClientRect().left))+'px';menu.style.top=Math.max(8,Math.min(window.innerHeight-rect.height-8,y||recentBar.getBoundingClientRect().top))+'px';
  }
  let nativeClient=null, nativeUnsubscribe=null, disposed=false, runtimeConnecting=false,uiRefreshTimer=null;
  const spinCSS=document.createElement('style');spinCSS.textContent='.diy-runtime-indicator{display:inline-block;width:7px;height:7px;border-radius:50%;background:#60a5fa;box-shadow:0 0 0 2px rgba(96,165,250,.18);flex:0 0 auto;margin-left:auto;}';document.head.append(spinCSS);
  function runtimeType(id){
    const row=document.querySelector('[data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey({id}))+'"]');
    const summaryProps=props(row,p=>p.threadSummary);
    const statusProps=props(row,p=>p.statusState);
    const domType=summaryProps?.threadSummary?.threadRuntimeStatus?.type||statusProps?.statusState?.type;
    if(domType)return domType;
    if(nativeClient){
      const cached=nativeClient.getCachedConversations().find(c=>c.id===id);
      const summary=nativeClient.threadStore?.getThreadSummaries?.().find(c=>c.conversationId===id);
      return (summary?.threadRuntimeStatus||cached?.threadRuntimeStatus)?.type;
    }
  }
  function isRuntimeActive(type){return type==='active'||type==='loading'||type==='running';}
  function isRunning(id){return isRuntimeActive(runtimeType(id));}
  function runtimeTypesFor(items){
    const types=new Map(),wanted=new Set(items.map(item=>item.id));
    if(nativeClient){
      const cache=new Map();for(const item of nativeClient.getCachedConversations?.()||[]){cache.set(item.id,item);if(typeof item.sessionId==='string'&&item.sessionId)cache.set(item.sessionId,item);if(item.sessionId&&item.sessionId!==item.id)recentThreadAliases.set(item.sessionId,{clientThreadId:item.id,lastSeen:Date.now()});}
      for(const [id,item]of cache){let execution;try{execution=nativeClient.getThreadExecutionState?.(item.id);}catch{}const type=runtimeStateFromCache(item,null,execution);if(wanted.has(id)&&type)types.set(id,type);}
      for(const item of nativeClient.threadStore?.getThreadSummaries?.()||[]){const cached=cache.get(item.conversationId),id=cached?.sessionId||item.conversationId;let execution;try{execution=nativeClient.getThreadExecutionState?.(cached?.id||item.conversationId);}catch{}const type=runtimeStateFromCache(cached,item,execution);if(wanted.has(id)&&type)types.set(id,type);}
    }
    const rows=new Map([...document.querySelectorAll('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id]')].map(row=>[row.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,''),row]));
    for(const item of items){const row=rows.get(nativeThreadKey(item));if(!row)continue;const summaryProps=props(row,p=>p.threadSummary),statusProps=props(row,p=>p.statusState),type=summaryProps?.threadSummary?.threadRuntimeStatus?.type||(!nativeClient?statusProps?.statusState?.type:null);if(isRuntimeActive(statusProps?.statusState?.type))types.set(item.id,'active');else if(type&&!types.has(item.id))types.set(item.id,type);}
    return types;
  }
  const observedActive=new Set(previousRunningIds);
  try{const saved=JSON.parse(localStorage.getItem('diy-observed-running-v1')||'[]');if(Array.isArray(saved))for(const id of saved)if(typeof id==='string')observedActive.add(id);}catch{}
  let completedRecent={};try{completedRecent=JSON.parse(localStorage.getItem('diy-completed-recent')||'{}');if(!completedRecent||Array.isArray(completedRecent)||typeof completedRecent!=='object')completedRecent={};}catch{}
  function markCompletedViewed(id){
    const entry=completedRecent[id];if(!entry||entry.viewed)return false;entry.viewed=true;
    try{localStorage.setItem('diy-completed-recent',JSON.stringify(completedRecent));}catch{}return true;
  }
  function updateCompleted(items,runtimeTypes,activeId){
    let changed=false;const completedNow=[];
    for(const item of items){const type=runtimeTypes.get(item.id);
      if(isRuntimeActive(type)){observedActive.add(item.id);if(completedRecent[item.id]){delete completedRecent[item.id];changed=true;}}
      else if(type==='idle'){
        const wasRunning=observedActive.delete(item.id);let nativeUnread=false;try{nativeUnread=!!nativeClient?.getThreadHasUnreadTurn?.(nativeThreadKey(item));}catch{}
        if(wasRunning||(!completedRecent[item.id]&&nativeUnread)){completedRecent[item.id]={id:item.id,projectId:item.projectId,completedAt:Date.now(),viewed:item.id===activeId&&document.visibilityState==='visible'&&document.hasFocus()};completedNow.push(item.id);changed=true;}
      }else if(typeof type==='string'&&/error|fail|interrupt/i.test(type)){observedActive.delete(item.id);if(completedRecent[item.id]){delete completedRecent[item.id];changed=true;}}
    }
    const valid=new Set(items.map(item=>item.id));for(const id of observedActive)if(!valid.has(id))observedActive.delete(id);try{const saved=JSON.stringify([...observedActive]);if(localStorage.getItem('diy-observed-running-v1')!==saved)localStorage.setItem('diy-observed-running-v1',saved);}catch{}
    if(changed){const entries=Object.entries(completedRecent).sort((a,b)=>(b[1].completedAt||0)-(a[1].completedAt||0));let viewed=0;completedRecent=Object.fromEntries(entries.filter(([,entry])=>!entry.viewed||viewed++<100));try{localStorage.setItem('diy-completed-recent',JSON.stringify(completedRecent));}catch{}}return completedNow;
  }
  let initialModulePromise=null;
  async function loadInitialModule(){
    if(initialModulePromise)return initialModulePromise;
    initialModulePromise=(async()=>{
      const indexScript=[...document.scripts].map(script=>script.src).find(src=>/\/assets\/index-[^/]+\.js(?:$|[?#])/.test(src));
      if(!indexScript)throw new Error('app bundle unavailable');
      const source=await (await fetch(indexScript)).text();
      const match=source.match(/["'`](?:\.\/)?(app-initial-[^"'`]+\.js)["'`]/);
      if(!match)throw new Error('app initial bundle unavailable');
      return import(new URL(match[1],indexScript).href);
    })().catch(error=>{initialModulePromise=null;throw error;});
    return initialModulePromise;
  }
  function isNativeRuntimeClient(value){
    return value&&typeof value.getCachedConversations==='function'&&typeof value.subscribe==='function'&&typeof value.getConversation==='function'&&(value.threadStore||typeof value.getThreadExecutionState==='function');
  }
  function runtimeClientFromScope(entry,seenScopes){
    // Only inspect existing local bindings. Never depend on minified bundle export names.
    for(let scope=entry;scope&&!seenScopes.has(scope);scope=scope.parent){
      seenScopes.add(scope);
      if(!(scope.familyBindings instanceof Map))continue;
      for(const members of scope.familyBindings.values()){
        if(!(members instanceof Map))continue;
        const stored=members.get('local')?.value;
        try{
          if(isNativeRuntimeClient(stored))return stored;
          const value=typeof stored?.get==='function'?stored.get():null;
          if(isNativeRuntimeClient(value))return value;
        }catch{} // Disposed/lazy unrelated bindings must not prevent finding the client.
      }
    }
    return null;
  }
  function findNativeRuntimeClient(){
    const elements=[...document.querySelectorAll('[data-app-action-sidebar-thread-active="true"],[data-app-action-sidebar-thread-row],#app-shell-sidebar')];
    const seenFibers=new Set(),seenValues=new Set(),seenScopes=new Set();
    for(const element of elements){
      let fiber=element[Object.keys(element).find(key=>key.startsWith('__reactFiber'))];
      for(let depth=0;fiber&&depth<180&&!seenFibers.has(fiber);fiber=fiber.return,depth++){
        seenFibers.add(fiber);
        for(let dep=fiber.dependencies?.firstContext;dep;dep=dep.next){
          const value=dep.memoizedValue;if(!value||seenValues.has(value))continue;seenValues.add(value);
          if(isNativeRuntimeClient(value))return value;
          const entries=value instanceof Map?value.values():[value];
          for(const entry of entries){const client=runtimeClientFromScope(entry,seenScopes);if(client)return client;}
        }
      }
    }
    return null;
  }
  let runtimeLastAttempt=0;
  async function connectRuntime(){
    if(runtimeConnecting||nativeClient||disposed||Date.now()-runtimeLastAttempt<2000)return;
    runtimeConnecting=true;runtimeLastAttempt=Date.now();
    try{
      const client=findNativeRuntimeClient();if(!client||disposed)return;
      const refresh=()=>{if(!disposed)scheduleUIRefresh();},cleanups=[];
      // Modern subscribe() takes a typed descriptor, not a bare callback.
      // These native events have explicit cleanup functions and cover cache/meta/completion changes.
      if(typeof client.events?.addThreadSummariesCallback==='function'){
        cleanups.push(client.events.addThreadSummariesCallback(refresh));
        if(typeof client.events.addAnyConversationMetaCallback==='function')cleanups.push(client.events.addAnyConversationMetaCallback(refresh));
        if(typeof client.events.addTurnCompletedListener==='function')cleanups.push(client.events.addTurnCompletedListener(refresh));
      }else cleanups.push(client.subscribe(refresh));
      nativeClient=client;nativeUnsubscribe=()=>{for(const cleanup of cleanups)if(typeof cleanup==='function')cleanup();};recentSignature='';scheduleUIRefresh();
    }catch{}finally{runtimeConnecting=false;}
  }

  const recentProjectsSection=document.createElement('section');recentProjectsSection.id='diy-recent-projects';recentProjectsSection.setAttribute('aria-label',L('最近项目'));recentProjectsSection.style.cssText='display:flex;flex-direction:column;margin:4px 0 6px;';
  const recentProjectsTitle=document.createElement('div');recentProjectsTitle.textContent=L('最近项目');recentProjectsTitle.title=L('按主动使用排序；后台运行不会改变顺序');recentProjectsTitle.style.cssText='padding:5px 8px;opacity:.6;font:500 13px system-ui;';
  const recentProjectsList=document.createElement('div');recentProjectsList.setAttribute('role','list');recentProjectsSection.append(recentProjectsTitle,recentProjectsList);
  const recentProjectOpen=new Set(),projectRows=new Map();let projectSignature='';
  function recentProjectThreads(id){return (window.__diySidebarRecent||[]).filter(item=>item.projectId===id).sort((a,b)=>(usageState.threads[b.id]?.usedAt||b.lastUsed||b.createdAt||0)-(usageState.threads[a.id]?.usedAt||a.lastUsed||a.createdAt||0));}
  function projectPreviewRow(item){
    const button=document.createElement('button');button.type='button';button.dataset.diyProjectThreadId=item.id;button.className='sidebar-item hover:bg-primary-ghost-hover';button.style.cssText='display:block;width:100%;min-width:0;padding:5px 8px 5px 30px;border:0;border-radius:5px;text-align:left;color:inherit;background:transparent;font:12px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    button.onclick=()=>{const current=(window.__diySidebarRecent||[]).find(entry=>entry.id===button.dataset.diyProjectThreadId);if(current)void openRecent(current);};button.oncontextmenu=event=>{const current=(window.__diySidebarRecent||[]).find(entry=>entry.id===button.dataset.diyProjectThreadId);if(current)void showRecentMenu(event,current);};return button;
  }
  function mountRecentProjects(){
    const root=document.getElementById('app-shell-sidebar');if(!root){recentProjectsSection.remove();return;}
    const pinned=[...root.querySelectorAll('[data-app-action-sidebar-section-toggle]')].find(e=>/^(置顶|Pinned)$/i.test(e.textContent.trim())),section=pinned?.closest('[class*="group/nav-section-title"]')?.parentElement;
    const priority=[...root.querySelectorAll('[role="list"][class*="priority-list"]')].find(node=>!node.closest('#diy-recent-projects'));
    const nativeList=priority||[...root.querySelectorAll('[role="list"]')].find(node=>!node.closest('#diy-recent-projects')&&node.querySelector('[data-app-action-sidebar-thread-row]'));
    if(section?.parentElement){if(section.nextElementSibling!==recentProjectsSection)section.insertAdjacentElement('afterend',recentProjectsSection);}
    else if(nativeList?.parentElement){if(nativeList.previousElementSibling!==recentProjectsSection)nativeList.insertAdjacentElement('beforebegin',recentProjectsSection);}
    else{recentProjectsSection.remove();return;}
    if(window.__diySidebarSnapshotReady!==true)return;
    const items=deriveRecentProjects(window.__diySidebarProjects||[],window.__diySidebarRecent||[],usageState);
    const signature=JSON.stringify([uiLanguage,items.map(item=>({id:item.id,name:item.name,threadId:item.threadId,open:recentProjectOpen.has(item.id),threads:recentProjectOpen.has(item.id)?recentProjectThreads(item.id).slice(0,5).map(t=>[t.id,t.title]):null}))]);if(signature===projectSignature)return;projectSignature=signature;
    const keep=new Set(items.map(item=>item.id));for(const [id,record]of projectRows)if(!keep.has(id)){record.row.remove();projectRows.delete(id);recentProjectOpen.delete(id);}
    items.forEach((item,index)=>{
      let record=projectRows.get(item.id);
      if(!record){
        const row=document.createElement('div');row.setAttribute('role','listitem');row.dataset.diyRecentProjectId=item.id;
        const head=document.createElement('div');head.style.cssText='display:flex;align-items:center;min-width:0;';
        const toggle=document.createElement('button');toggle.type='button';toggle.style.cssText='flex:0 0 22px;width:22px;height:28px;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;cursor:pointer;font:12px system-ui;';toggle.onclick=event=>{event.stopPropagation();if(recentProjectOpen.has(item.id))recentProjectOpen.delete(item.id);else recentProjectOpen.add(item.id);projectSignature='';mountRecentProjects();};
        const open=document.createElement('button');open.type='button';open.dataset.diyRecentProjectOpenId=item.id;open.className='sidebar-item hover:bg-primary-ghost-hover';open.style.cssText='display:flex;align-items:center;gap:7px;flex:1;min-width:0;text-align:left;padding:5px 8px 5px 0;border:0;border-radius:6px;background:transparent;color:inherit;cursor:pointer;font:inherit;';
        const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','16');icon.setAttribute('height','16');icon.setAttribute('aria-hidden','true');icon.style.flexShrink='0';const folder=document.createElementNS('http://www.w3.org/2000/svg','path');folder.setAttribute('d','M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3Z');folder.setAttribute('fill','none');folder.setAttribute('stroke','currentColor');folder.setAttribute('stroke-width','1.5');icon.append(folder);
        const label=document.createElement('span');label.style.cssText='min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';open.append(icon,label);
        open.onclick=()=>{const current=deriveRecentProjects(window.__diySidebarProjects||[],window.__diySidebarRecent||[],usageState).find(p=>p.id===item.id);if(!current)return;const thread=(window.__diySidebarRecent||[]).find(t=>t.id===current.threadId&&t.projectId===current.id);recordActiveUse({projectId:current.id,id:thread?.id});if(thread)void openRecent(thread);else void createProjectConversation({projectId:current.id}).catch(()=>{open.title=L('当前客户端导航接口不可用，请从原生侧栏打开会话。');});};
        open.oncontextmenu=event=>{const header=projectHeaderFor({projectId:item.id,project:item.name});if(header){event.preventDefault();event.stopPropagation();header.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window,button:2,clientX:event.clientX,clientY:event.clientY}));}};
        const list=document.createElement('div');list.setAttribute('role','list');head.append(toggle,open);row.append(head,list);record={row,toggle,open,label,list};projectRows.set(item.id,record);recentProjectsList.append(row);
      }
      record.label.textContent=item.name;record.open.title=item.name+' · '+L('打开最近使用的会话');record.open.setAttribute('aria-label',record.open.title);const opened=recentProjectOpen.has(item.id);record.toggle.textContent=opened?'▾':'▸';record.toggle.setAttribute('aria-expanded',String(opened));record.toggle.setAttribute('aria-label',L(opened?'收起项目会话':'展开项目会话')+' · '+item.name);record.list.hidden=!opened;
      if(opened){
        const threads=recentProjectThreads(item.id),visible=threads.slice(0,5),existing=new Map([...record.list.querySelectorAll('[data-diy-project-thread-id]')].map(button=>[button.dataset.diyProjectThreadId,button])),ids=new Set(visible.map(t=>t.id));for(const [id,button]of existing)if(!ids.has(id))button.remove();record.list.querySelector('[data-diy-project-more]')?.remove();record.list.querySelector('[data-diy-project-empty]')?.remove();
        visible.forEach((thread,i)=>{const button=existing.get(thread.id)||projectPreviewRow(thread);button.textContent=thread.title;button.title=thread.title;if(record.list.children[i]!==button)record.list.insertBefore(button,record.list.children[i]||null);});
        if(!threads.length){const empty=document.createElement('div');empty.dataset.diyProjectEmpty='';empty.textContent=L('暂无会话；点击项目名称新建');empty.style.cssText='padding:5px 8px 5px 30px;font:12px system-ui;opacity:.55;';record.list.append(empty);}else if(threads.length>5){const more=document.createElement('button');more.type='button';more.dataset.diyProjectMore='';more.textContent=L('更多会话')+' ('+threads.length+')';more.style.cssText='padding:5px 8px 5px 30px;border:0;background:transparent;color:inherit;opacity:.65;cursor:pointer;font:11px system-ui;';more.onclick=()=>openMoreMenu(item.id);record.list.append(more);}
      }
      if(recentProjectsList.children[index]!==record.row)recentProjectsList.insertBefore(record.row,recentProjectsList.children[index]||null);
    });
  }
  async function openRecent(item){
    recordActiveUse(item);dismissedRecent.delete(item.id);delete dismissedAt[item.id];saveDismissed();
    const row=document.querySelector('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');
    const navigation=props(row,p=>typeof p.href==='string'&&typeof p.onClick==='function'&&p.statusState);
    if(navigation){try{await navigation.onClick();recentBar.title='';return;}catch{}}
    const href=navigation?.href||'/local/'+encodeURIComponent(nativeThreadKey(item));
    try{await sendHostMessage({type:'navigate-to-route',path:href});recentBar.title='';}
    catch{recentBar.title=L('当前客户端导航接口不可用，请从原生侧栏打开会话。');}
  }
  let historyPanelWidth=320;try{let stored=localStorage.getItem('diy-history-panel-width');if(!localStorage.getItem('diy-history-panel-width-0412-migrated')){if(stored==='240'){localStorage.removeItem('diy-history-panel-width');stored=null;}localStorage.setItem('diy-history-panel-width-0412-migrated','1');}if(stored!==null&&stored.trim()!==''){const saved=Number(stored);if(Number.isFinite(saved))historyPanelWidth=saved;}}catch{}
  function clampHistoryPanelWidth(value){return Math.max(240,Math.min(Math.min(680,Math.floor(window.innerWidth*.58)),Math.round(value)));}
  const historyContainer=document.createElement('aside');historyContainer.id='diy-input-history-panel';historyContainer.setAttribute('aria-label',L('当前会话历史提问'));historyContainer.style.cssText='position:relative;display:flex;min-width:0;height:100%;overflow:hidden;border-left:1px solid color-mix(in srgb,currentColor 14%,transparent);background:var(--color-background);color:inherit;font:inherit;';
  function mountHistoryControls(docked,hideSettings=false){
    if(docked){
      if(usageBox.parentElement!==historyFooter)historyFooter.prepend(usageBox);
      if(panel.parentElement!==historyFooter)historyFooter.append(panel);
      if(historyCollapseButton.parentElement!==historyFooter)historyFooter.append(historyCollapseButton);
      for(const key of ['position','left','top'])usageBox.style.removeProperty(key);usageBox.style.flex='1 1 auto';usageBox.style.removeProperty('width');usageBox.style.removeProperty('height');usageBox.style.removeProperty('overflow');
      panel.style.cssText='position:relative;display:flex;flex:0 0 auto;align-items:stretch;z-index:4;font:11px system-ui;';
      settingsButton.style.height='100%';mountUsageBox();return;
    }
    if(quickBarEnabled){
      if(usageBox.parentElement!==recentDock)recentDock.prepend(usageBox);
      usageBox.style.position='absolute';usageBox.style.left='-155px';usageBox.style.top='0';usageBox.style.flex='none';usageBox.style.width='150px';usageBox.style.height='51px';usageBox.style.overflow='hidden';mountUsageBox();
    }else usageBox.remove();
    if(panel.parentElement!==document.body)document.body.append(panel);
    panel.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;font:11px system-ui;';
    if(hideSettings)panel.style.display='none';
    settingsButton.style.removeProperty('height');
  }
  function applyHistoryPanelWidth(value,persist=false){historyPanelWidth=clampHistoryPanelWidth(value);historyContainer.style.flex='0 0 '+historyPanelWidth+'px';historyContainer.style.width=historyPanelWidth+'px';document.querySelector('.diy-output-panel-right-bridge')?.style.setProperty('--diy-output-panel-shift',historyPanelWidth+'px');if(persist)try{localStorage.setItem('diy-history-panel-width',String(historyPanelWidth));}catch{}}
  const historyResizeHandle=document.createElement('div');historyResizeHandle.setAttribute('role','separator');historyResizeHandle.setAttribute('aria-label',L('拖拽调整右侧会话栏宽度'));historyResizeHandle.setAttribute('aria-orientation','vertical');historyResizeHandle.tabIndex=0;historyResizeHandle.style.cssText='position:absolute;left:0;top:0;bottom:0;z-index:3;width:7px;transform:translateX(-3px);cursor:col-resize;touch-action:none;background:transparent;transition:background-color .12s;';
  let resizingHistoryPanel=false,historyResizePointer=0,historyResizeStartX=0,historyResizeStartWidth=0;
  historyResizeHandle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();resizingHistoryPanel=true;historyResizePointer=event.pointerId;historyResizeStartX=event.clientX;historyResizeStartWidth=historyPanelWidth;historyResizeHandle.setPointerCapture(event.pointerId);historyResizeHandle.style.background='#3b82f688';document.body.style.cursor='col-resize';document.body.style.userSelect='none';};
  historyResizeHandle.onpointermove=event=>{if(!resizingHistoryPanel||event.pointerId!==historyResizePointer)return;applyHistoryPanelWidth(historyResizeStartWidth+historyResizeStartX-event.clientX);};
  historyResizeHandle.onpointerup=historyResizeHandle.onpointercancel=event=>{if(!resizingHistoryPanel||event.pointerId!==historyResizePointer)return;resizingHistoryPanel=false;try{historyResizeHandle.releasePointerCapture(event.pointerId);}catch{}historyResizeHandle.style.background='transparent';document.body.style.removeProperty('cursor');document.body.style.removeProperty('user-select');applyHistoryPanelWidth(historyPanelWidth,true);};
  historyResizeHandle.onmouseenter=()=>{if(!resizingHistoryPanel)historyResizeHandle.style.background='#3b82f644';};historyResizeHandle.onmouseleave=()=>{if(!resizingHistoryPanel)historyResizeHandle.style.background='transparent';};
  historyResizeHandle.onkeydown=event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();applyHistoryPanelWidth(historyPanelWidth+(event.key==='ArrowLeft'?20:-20),true);};
  historyContainer.append(historyResizeHandle,historyPanel);
  function setHistoryCollapsed(value,persist=false){
    historyCollapsed=!!value;
    historyCollapseButton.title=L(historyCollapsed?'展开历史提问栏':'收起历史提问栏');historyCollapseButton.setAttribute('aria-label',historyCollapseButton.title);historyCollapseButton.setAttribute('aria-expanded',String(!historyCollapsed));
    if(persist)try{localStorage.setItem('diy-history-panel-collapsed',historyCollapsed?'on':'off');}catch{}
    mountInputHistoryPanel();
  }
  setHistoryCollapsed(historyCollapsed);
  function syncOutputPanelRightBridge(){
    const thread=document.querySelector('[class~="group/realtime-voice-thread"]'),panelOpen=rightPanelEnabled&&!historyCollapsed&&historyContainer.isConnected;
    const outputNode=panelOpen?[...document.querySelectorAll('[class~="group/summary-panel"]')].find(node=>/(?:输出内容|Output(?: content)?)/i.test(node.textContent||'')&&node.getClientRects().length>0&&!node.closest('[aria-hidden="true"]')):null;
    let origin=outputNode;while(origin&&!origin.classList.contains('origin-top-right'))origin=origin.parentElement;
    for(const stale of document.querySelectorAll('.diy-output-panel-right-bridge'))if(stale!==thread){stale.classList.remove('diy-output-panel-right-bridge');stale.style.removeProperty('--diy-output-panel-shift');}
    for(const stale of document.querySelectorAll('.diy-output-panel-right-portal'))if(stale!==origin)stale.classList.remove('diy-output-panel-right-portal');
    if(thread&&origin){thread.classList.add('diy-output-panel-right-bridge');thread.style.setProperty('--diy-output-panel-shift',historyPanelWidth+'px');origin.classList.add('diy-output-panel-right-portal');}
    else if(thread){thread.classList.remove('diy-output-panel-right-bridge');thread.style.removeProperty('--diy-output-panel-shift');}
  }
  let outputPanelBridgeTimer=null;
  function queueOutputPanelBridgeSync(){if(outputPanelBridgeTimer!==null)return;outputPanelBridgeTimer=setTimeout(()=>{outputPanelBridgeTimer=null;if(!disposed)syncOutputPanelRightBridge();},0);}
  function onOutputPanelBridgeKey(event){if(event.key==='Escape')queueOutputPanelBridgeSync();}
  document.addEventListener('pointerdown',queueOutputPanelBridgeSync,true);document.addEventListener('click',queueOutputPanelBridgeSync,true);window.addEventListener('keydown',onOutputPanelBridgeKey,true);window.addEventListener('blur',queueOutputPanelBridgeSync);
  function liveContentElement(element){
    if(!element?.isConnected||element.closest('[inert],[hidden],[aria-hidden="true"]'))return false;
    try{if(typeof element.checkVisibility==='function'&&!element.checkVisibility({checkVisibilityCSS:true}))return false;}catch{}
    const rect=element.getBoundingClientRect();return rect.width>0&&rect.height>0;
  }
  function visibleComposer(){return [...document.querySelectorAll('[data-codex-composer]')].find(liveContentElement);}
  function mainContentSurface(){
    // Newer Codex keeps inactive tabs and a duplicate titlebar main area mounted.
    const composerMain=visibleComposer()?.closest('[data-app-shell-focus-area="main"]');
    if(liveContentElement(composerMain))return composerMain;
    const candidates=[...document.querySelectorAll('[data-app-shell-focus-area="main"]')].filter(liveContentElement);
    const content=candidates.filter(node=>node.closest('main')||node.getAttribute('role')==='tabpanel'||node.getBoundingClientRect().height>window.innerHeight*.5);
    return content.sort((a,b)=>b.getBoundingClientRect().height-a.getBoundingClientRect().height)[0]||[...document.querySelectorAll('main[data-app-shell-main-surface],main')].find(liveContentElement)||null;
  }
  function mountInputHistoryPanel(){
    if(!rightPanelEnabled){historyContainer.remove();historyExpandButton.remove();mountHistoryControls(false);syncOutputPanelRightBridge();return;}
    const main=mainContentSurface();
     if(!main?.parentElement){historyContainer.remove();historyExpandButton.remove();mountHistoryControls(false);syncOutputPanelRightBridge();return;}
    if(historyCollapsed){historyContainer.remove();mountHistoryControls(false,true);if(historyExpandButton.parentElement!==document.body)document.body.append(historyExpandButton);syncOutputPanelRightBridge();return;}
    historyExpandButton.remove();
    applyHistoryPanelWidth(historyPanelWidth);
    if(historyContainer.parentElement!==main.parentElement)main.insertAdjacentElement('afterend',historyContainer);
    mountHistoryControls(true);
    syncOutputPanelRightBridge();
  }
  let recentBarLastRect=null,recentBarParked=false,cachedComposerSurface=null,anchorRectFrame=0;
  function queueAnchorRect(){if(anchorRectFrame)return;anchorRectFrame=requestAnimationFrame(()=>{anchorRectFrame=0;if(disposed||!recentDock.isConnected||recentBarParked)return;const rect=recentDock.getBoundingClientRect();if(rect.width&&rect.height)recentBarLastRect={left:rect.left,top:rect.top,width:rect.width};});}
  const anchorResizeObserver=new ResizeObserver(queueAnchorRect);anchorResizeObserver.observe(recentDock);
  window.addEventListener('resize',queueAnchorRect);

  function mountRecentBarAnchor(){
    if(!quickBarEnabled)return false;
    if(!recentBarParked&&liveContentElement(cachedComposerSurface)&&cachedComposerSurface.nextElementSibling===recentDock)return true;
    const input=visibleComposer();
    const surface=input?.closest('[data-composer-surface-variant]');cachedComposerSurface=surface;
    if(surface?.parentElement){
      if(surface.nextElementSibling!==recentDock){
        const scroll=recentBar.scrollLeft;
        surface.insertAdjacentElement('afterend',recentDock);performanceStats.anchorMoves++;
        recentBar.scrollLeft=scroll;
      }
      if(recentBarParked){for(const key of ['position','left','top','width','z-index','margin-top'])recentDock.style.removeProperty(key);recentDock.style.position='relative';recentDock.style.width='100%';recentDock.style.marginTop='5px';recentBarParked=false;}
      queueAnchorRect();
      return true;
    }
    // Preserve the existing bar only while React replaces the composer subtree.
    if(!recentDock.isConnected&&recentBarLastRect){
      const r=recentBarLastRect;
      Object.assign(recentDock.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',marginTop:'0',zIndex:'30'});
      document.body.append(recentDock);recentBarParked=true;
    }
    return false;
  }
  function selectedThreadId(){
    const route=findViewRouter()?.state?.location?.pathname||location.pathname,parts=route.split('/');let routeId='';if(parts[1]==='local'&&parts[2]){try{routeId=decodeURIComponent(parts[2]);}catch{}}
    const id=routeId||document.querySelector('[data-app-action-sidebar-thread-active="true"]')?.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'')||'';
    return [...recentThreadAliases].find(([,alias])=>alias.clientThreadId===id)?.[0]||id;
  }
  function classifyQuickItem(item,type,activeId){
    const running=isRuntimeActive(type),failed=typeof type==='string'&&/error|fail|interrupt/i.test(type),unknown=!type||type==='notLoaded',completed=type==='idle'&&!!completedRecent[item.id];
    return {...item,state:type||'unknown',running,failed,unknown,completed,viewed:completed&&!!completedRecent[item.id]?.viewed,active:item.id===activeId,lastUsed:usageState.threads[item.id]?.usedAt||item.lastUsed||item.createdAt||item.time||0};
  }
  function mountPanel(){
    if(disposed)return;performanceStats.uiRefreshes++;
    if(!nativeClient&&!runtimeConnecting)void connectRuntime();
    if(window.__diySidebarSnapshotReady!==true){mountInputHistoryPanel();return;}
    const source=window.__diySidebarRecent||[],catalog=window.__diySidebarProjects||[];seedUsage(source,catalog);
    const candidates=[...source,...projectDraftsFor(source)],activeId=selectedThreadId();
    for(const [id,alias]of recentThreadAliases){const draft=usageState.threads[alias.clientThreadId];if(draft&&(draft.usedAt||0)>(usageState.threads[id]?.usedAt||0)){usageState.threads[id]={...draft};if(draft.projectId&&usageState.projects[draft.projectId]?.threadId===alias.clientThreadId)usageState.projects[draft.projectId].threadId=id;persistUsage();}}
    observeActiveUse(candidates,activeId);
    const types=runtimeTypesFor(candidates);updateCompleted(candidates,types,activeId);
    if(document.visibilityState==='visible'&&document.hasFocus())markCompletedViewed(activeId);
    mountInputHistory();mountRecentProjects();mountInputHistoryPanel();
    let restored=false;
    if(allowDismissedReturn)for(const item of candidates)if(dismissedRecent.has(item.id)&&(usageState.threads[item.id]?.usedAt||0)>(dismissedAt[item.id]||0)){dismissedRecent.delete(item.id);delete dismissedAt[item.id];restored=true;}
    if(restored)saveDismissed();
    const domDetails=new Map();for(const row of document.querySelectorAll('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id]')){const id=row.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'');if(!id)continue;const header=row.closest('div[data-sidebar-project-kind]')?.querySelector('[data-app-action-sidebar-project-row]');domDetails.set(id,{title:row.getAttribute('data-app-action-sidebar-thread-title'),project:header?.getAttribute('data-app-action-sidebar-project-label')});}
    allQuickItems=candidates.map(item=>{const details=domDetails.get(nativeThreadKey(item));return classifyQuickItem({...item,title:details?.title||item.title,project:details?.project||item.project},types.get(item.id),activeId);});
    const available=allQuickItems.filter(item=>!dismissedRecent.has(item.id)),plan=planQuickbar(available,recentOrder,activeId);recentOrder=plan.order;overflowItems=plan.overflow;
    try{const saved=JSON.stringify(recentOrder);if(localStorage.getItem(QUICK_ORDER_KEY)!==saved)localStorage.setItem(QUICK_ORDER_KEY,saved);}catch{}
    recentSource=source;recentActiveId=activeId;recentItems=plan.visible;recentMoreButton.hidden=!overflowItems.length;recentMoreButton.textContent=L('更多')+' '+overflowItems.length;recentMoreButton.setAttribute('aria-label',L('更多会话')+' · '+overflowItems.length);renderMoreMenu();
    if(!quickBarEnabled){recentDock.remove();closeRecentMenu();return;}if(!mountRecentBarAnchor())return;
    const scroll=recentBar.scrollLeft;recentTrack.dataset.itemCount=String(recentItems.length);recentTrack.style.width=Math.max(0,recentItems.length*RECENT_STRIDE-RECENT_GAP)+'px';renderRecentWindow(true);recentBar.scrollLeft=Math.min(scroll,Math.max(0,recentBar.scrollWidth-recentBar.clientWidth));revealActiveCard();
  }
  setCapacityRetryEnabled(capacityRetryEnabled);
  mountPanel();
  function scheduleUIRefresh(){if(uiRefreshTimer!==null)return;uiRefreshTimer=setTimeout(()=>{uiRefreshTimer=null;if(!disposed)mountPanel();},200);}
  const uiObserver=new MutationObserver(records=>{
    if(disposed)return;
    const external=records.some(record=>!pluginMutation(record));
    if(external){mountRecentBarAnchor();scheduleUIRefresh();}
  });
  uiObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-action-sidebar-thread-active']});
  connectRuntime();
  function setEnabled(value){
    enabled=!!value;clearInterval(timer);timer=null;
    observer?.disconnect();
    document.documentElement.toggleAttribute('data-diy-sidebar-enabled',enabled);
    if(enabled){observer=new MutationObserver(records=>{if(records.some(record=>!pluginMutation(record)))scheduleProjectApply();});apply();}else{
      clearMarkers();
      restore();for(const b of buttons.values())b.remove();buttons.clear();
      for(const state of nativeStates.values()){try{if(state.showAll!==null)state.setExpanded?.(state.showAll);}catch{}}
      nativeStates.clear();status.textContent=L('已关闭 · 原生显示已恢复');
    }
    updateSettingsButton();
    try{localStorage.setItem(STORAGE,enabled?'on':'off');}catch{}
  }
  window[KEY]={version:VERSION,get uiLanguage(){return uiLanguage;},get uiLanguagePreference(){return uiLanguagePreference;},setUiLanguagePreference,get enabled(){return enabled;},get quickBarEnabled(){return quickBarEnabled;},get rightPanelEnabled(){return rightPanelEnabled;},get allowDismissedReturn(){return allowDismissedReturn;},get capacityRetryEnabled(){return capacityRetryEnabled;},get stats(){return stats;},get performanceStats(){return {...performanceStats};},get runtimeConnected(){return !!nativeClient;},getCurrentProjectThreadIds:currentProjectThreadIds,getActiveThreadId:()=>recentActiveId,getObservedRunningIds:()=>[...observedActive],getQuickbarState:()=>({visible:recentItems.map(item=>({id:item.id,group:quickbarGroup(item),active:item.active,state:item.state})),overflow:overflowItems.length,order:recentOrder.slice()}),apply,refreshUI:mountPanel,setEnabled,setQuickBarEnabled,setRightPanelEnabled,setAllowDismissedReturn,setCapacityRetryEnabled,dispose(){document.removeEventListener('click',onUserSidebarAction,true);window.removeEventListener('storage',onUsageStorage);document.removeEventListener('dragover',onHistoryDragOver,true);document.removeEventListener('drop',onHistoryDrop,true);anchorResizeObserver.disconnect();window.removeEventListener('resize',queueAnchorRect);if(anchorRectFrame)cancelAnimationFrame(anchorRectFrame);if(projectApplyTimer!==null)clearTimeout(projectApplyTimer);document.removeEventListener('click',queueOutputPanelBridgeSync,true);document.removeEventListener('pointerdown',queueOutputPanelBridgeSync,true);window.removeEventListener('keydown',onOutputPanelBridgeKey,true);window.removeEventListener('blur',queueOutputPanelBridgeSync);if(outputPanelBridgeTimer!==null)clearTimeout(outputPanelBridgeTimer);for(const stale of document.querySelectorAll('.diy-output-panel-right-bridge')){stale.classList.remove('diy-output-panel-right-bridge');stale.style.removeProperty('--diy-output-panel-shift');}for(const stale of document.querySelectorAll('.diy-output-panel-right-portal'))stale.classList.remove('diy-output-panel-right-portal');recentBar.removeEventListener('scroll',onRecentBarScroll);recentBar.removeEventListener('wheel',onRecentBarWheel);if(recentRenderFrame)cancelAnimationFrame(recentRenderFrame);if(uiRefreshTimer!==null)clearTimeout(uiRefreshTimer);if(capacityRetryTimer!==null)clearInterval(capacityRetryTimer);if(capacityRetryScanTimer!==null)clearTimeout(capacityRetryScanTimer);capacityRetryObserver?.disconnect();closeRecentMenu();document.removeEventListener('pointerdown',recentMenuOutside,true);window.removeEventListener('keydown',recentMenuKey,true);window.removeEventListener('blur',closeRecentMenu);disposed=true;uiObserver.disconnect();if(typeof nativeUnsubscribe==='function')nativeUnsubscribe();spinCSS.remove();setEnabled(false);compactCSS.remove();settingsButton.onclick=null;historyCollapseButton.onclick=null;historyExpandButton.onclick=null;historyExpandButton.remove();document.getElementById('diy-usage-settings')?.remove();historyPanel.remove();historyContainer.remove();panel.remove();recentDock.remove();recentBar.remove();recentProjectsSection.remove();window[KEY]={version:VERSION,disposed:true};}};
  setEnabled(enabled);
})();






