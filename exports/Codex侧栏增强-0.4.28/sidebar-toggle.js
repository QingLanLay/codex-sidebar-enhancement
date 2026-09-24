(() => {
  'use strict';
  if (window.top !== window || /avatar-overlay|quick-chat|prewarm/.test(location.href)) return;
  const KEY='__sidebarToggleProbe', VERSION='0.4.28.0', STORAGE='diy-sidebar-enhancement-v2', UI_LANGUAGE_KEY='diy-sidebar-ui-language';
  if(window[KEY]?.version===VERSION){window[KEY].refreshUI?.();return;}
  const previousEnabled=window[KEY]?.enabled;
  window[KEY]?.dispose?.();
  for(const selector of ['#diy-sidebar-toggle-probe','#diy-sidebar-compact-css','#diy-usage-settings','#diy-input-history','#diy-running-conversations','#diy-input-history-panel','#diy-input-history-expand'])for(const stale of document.querySelectorAll(selector))stale.remove();
  let enabled=true, timer=null,quickBarEnabled=true,rightPanelEnabled=true,allowDismissedReturn=true,capacityRetryEnabled=true,capacityRetryTimer=null,usageHidden=false,historyCollapsed=false;
  try{quickBarEnabled=localStorage.getItem('diy-quickbar-enabled')!=='off';rightPanelEnabled=localStorage.getItem('diy-rightpanel-enabled')!=='off';allowDismissedReturn=localStorage.getItem('diy-dismissed-recent-return-on-update')!=='off';capacityRetryEnabled=localStorage.getItem('diy-capacity-auto-retry')!=='off';usageHidden=localStorage.getItem('diy-usage-hidden')==='on';historyCollapsed=localStorage.getItem('diy-history-panel-collapsed')==='on';if(!localStorage.getItem('diy-input-history-right-panel-migrated')){rightPanelEnabled=true;localStorage.setItem('diy-rightpanel-enabled','on');localStorage.setItem('diy-input-history-right-panel-migrated','1');}}catch{}
  let uiLanguagePreference='auto';try{const saved=localStorage.getItem(UI_LANGUAGE_KEY);if(['auto','zh','en'].includes(saved))uiLanguagePreference=saved;}catch{}
  function detectUiLanguage(){if(uiLanguagePreference==='zh'||uiLanguagePreference==='en')return uiLanguagePreference;const nativeLabels=[...document.querySelectorAll('#app-shell-sidebar [data-app-action-sidebar-section-toggle]')].map(el=>(el.textContent||'').trim());if(nativeLabels.some(label=>label==='置顶'))return'zh';if(nativeLabels.some(label=>/^Pinned$/i.test(label)))return'en';const locale=(document.documentElement.lang||navigator.language||navigator.userLanguage||'zh-CN').toLowerCase();return locale.startsWith('zh')?'zh':'en';}
  let uiLanguage=detectUiLanguage(),settingsFormRefresh=null;
  const englishText={
    '已开启':'Enabled','个项目':'projects','最近活动排序':'sorted by recent activity','设置':'Settings','侧栏增强设置':'Sidebar Enhancement Settings','项目排序 ':'Project sorting ','快捷栏 ':'Quick bar ','右侧栏 ':'History panel ','容量自动继续 ':'Auto-retry capacity errors ','开':'On','关':'Off',
    '项目按最近会话活动排序':'Sort projects by recent conversation activity','输入框下方快捷会话栏':'Session quick bar below the composer','右侧当前会话历史提问':'Current conversation history panel','移除的会话再次活动后回到快捷栏':'Restore removed sessions when they become active again','模型容量错误每 10 秒自动继续':'Retry model capacity errors every 10 seconds','界面语言':'Interface language','跟随 Codex':'Follow Codex','简体中文':'Chinese (Simplified)',
    '额度接口地址':'Usage API URL','额度密钥':'Usage API key','额度密钥已保存，留空保持不变':'Usage key saved; leave blank to keep it','输入额度密钥':'Enter usage API key','开关即时保存；额度地址和密钥仅保存在本机。':'Toggles save immediately. The usage URL and key are stored locally only.','保存额度设置':'Save usage settings','恢复已移除会话':'Restore removed sessions','关闭':'Close','已恢复全部手动移除的会话。':'All manually removed sessions have been restored.','请输入有效的 HTTP 或 HTTPS 地址。':'Enter a valid HTTP or HTTPS URL.','请输入密钥。':'Enter the API key.','正在保存并刷新…':'Saving and refreshing…',
    '快捷会话':'Session quick bar',' · 正在运行':' · Running',' · 已完成 · 已查看':' · Completed · Viewed',' · 已完成 · 未查看':' · Completed · Not viewed',' · 当前活动会话':' · Current active session','正在运行':'Running',
    ' 剩余 ':' Remaining ','额度 ':'Quota ','账号共享剩余额度（非现金余额）':'Shared account usage remaining (not a cash balance)','当前额度：':'Current quota: ','剩余：':'Remaining: ','重置：':'Resets: ','点击切换下一项':'Click to switch to the next quota','刷新失败，当前为上次数据':'Refresh failed; showing the last available data','每 30 秒刷新':'Refreshes every 30 seconds','额度已隐藏 · 点击显示':'Usage hidden · Click to show','额度隐藏 · 点击显示':'Usage hidden · Click to show','点击显示额度；按住 Shift 点击可切换额度项':'Click to show usage; Shift-click to switch quota','额度未配置':'Usage not configured','额度接口尚未配置':'Usage API is not configured','额度暂不可用':'Usage temporarily unavailable','额度显示中，点击隐藏':'Usage visible · Click to hide','点击隐藏额度；按住 Shift 点击切换额度项':'Click to hide usage; Shift-click to switch quota',
    '当前会话历史提问':'Current conversation history','当前会话 · ':'Current conversation · ','当前会话 · 历史提问':'Current conversation · History','收起历史提问栏':'Collapse history panel','展开历史提问栏':'Expand history panel','历史':'History','展开右侧历史提问':'Open conversation history','当前会话 · 正在读取历史…':'Current conversation · Loading history…','当前会话 · 暂无历史提问':'Current conversation · No history yet','正在读取当前会话历史…':'Loading conversation history…','当前会话暂无历史提问':'No questions in this conversation yet',' 条历史提问':' questions','定位历史提问：':'Go to question:','单击定位当前会话中的这条提问；拖到输入框可引用提问和 Codex 回复':'Click to jump to this question; drag to the composer to quote the question and Codex reply','当前':'Current','你':'You','暂无可预览的用户输入':'No user input preview available','等待回复…':'Waiting for reply…','拖拽调整右侧会话栏宽度':'Drag to resize the history panel',
    '新建项目会话':'New project conversation','从快捷栏移除':'Remove from quick bar','无法打开该项目的新会话，请从原生项目栏创建。':'Could not open a new conversation for this project. Create it from the native project list.','请先在左侧加载该会话，再使用原版右键菜单':'Load this conversation in the sidebar first, then use the native context menu.','最近项目':'Recent projects','请先展开项目所在分区':'Expand the project section first.','当前客户端导航接口不可用，请从原生侧栏打开会话。':'The client navigation API is unavailable. Open the conversation from the native sidebar.','已关闭 · 原生显示已恢复':'Disabled · Native layout restored','输出内容':'Output content'
  };
  const L=text=>uiLanguage==='en'?(englishText[text]||text):text;
  try{enabled=typeof previousEnabled==='boolean'?previousEnabled:localStorage.getItem(STORAGE)!=='off';}catch{}
  const styles=new Map(), expanded=new Set(), nativeStates=new Map(), buttons=new Map();
  let stats={projects:0,compact:0};
  let observer=null, applying=false;
  const requestedAll=new WeakSet();
  const compactCSS=document.createElement('style');compactCSS.id='diy-sidebar-compact-css';
  compactCSS.textContent='';
  document.head.append(compactCSS);
  function observe(){observer?.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded','data-app-action-sidebar-project-collapsed','data-app-action-sidebar-thread-title']});}
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
    applying=true;observer?.disconnect();
    try {
    const projects=[];
    for(const header of document.querySelectorAll('[data-app-action-sidebar-project-row]')){
      const group=header.closest('div[data-sidebar-project-kind]');
      if(!group)continue;
      const id=header.getAttribute('data-app-action-sidebar-project-id');
      const gp=props(header,p=>p.group?.projectId===id)?.group;
      if(!nativeStates.has(id))nativeStates.set(id,{showAll:null});
      const project={outer:rowItem(group,document.body),latest:Math.max(0,...(gp?.threadKeys||[]).map(k=>window.__diySidebarTimes?.[k]||0)),id};
      projects.push(project);
    }
    // 每个原生分区独立排序，非项目项保留相对槽位。
    const parents=new Map();for(const p of projects){if(!parents.has(p.outer.parentElement))parents.set(p.outer.parentElement,[]);parents.get(p.outer.parentElement).push(p);}
    for(const [parent,items] of parents){const slots=[...parent.children];const projectNodes=new Set(items.map(i=>i.outer));const indices=slots.map((n,i)=>projectNodes.has(n)?i:-1).filter(i=>i>=0);const sorted=items.sort((a,b)=>b.latest-a.latest);slots.forEach((n,i)=>style(n,'order',String(i)));sorted.forEach((p,i)=>style(p.outer,'order',String(indices[i])));}
    for(const [id,b]of buttons)if(!projects.some(p=>p.id===id)){b.remove();buttons.delete(id);}
    stats={projects:projects.length,compact:projects.filter(p=>!expanded.has(p.id)).length};
    status.textContent=`${L('已开启')} · ${stats.projects} ${L('个项目')} · ${L('最近活动排序')}`;
    for(const el of styles.keys())if(!el.isConnected)styles.delete(el);
    } finally {applying=false;if(enabled)observe();}
  }
  const panel=document.createElement('div');panel.id='diy-sidebar-toggle-probe';panel.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;font:11px system-ui;';
  const status=document.createElement('div');status.hidden=true;
  const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.textContent=L('设置');settingsButton.style.cssText='padding:3px 7px;cursor:pointer;border:1px solid #64748b;border-radius:6px;background:#18212f;color:#fff;font:11px system-ui;';
  panel.append(settingsButton);document.body.append(panel);
  function updateSettingsButton(){settingsButton.title=L('侧栏增强设置')+'\n'+L('项目排序 ')+(enabled?L('开'):L('关'))+' · '+L('快捷栏 ')+(quickBarEnabled?L('开'):L('关'))+' · '+L('右侧栏 ')+(rightPanelEnabled?L('开'):L('关'))+' · '+L('容量自动继续 ')+(capacityRetryEnabled?L('开'):L('关'));}
  function capacityRetryTick(){if(!capacityRetryEnabled)return;const body=(document.body?.innerText||'').replace(/\\s+/g,' ');if(!/Selected model is at capacity\\. Please try a different model\\.?/i.test(body))return;const labels=/^(继续|重试|再试一次|Continue|Retry|Try again|继续生成|重新尝试)$/i;const button=[...document.querySelectorAll('button,[role=button]')].find(el=>{const text=(el.innerText||el.getAttribute('aria-label')||'').trim();return labels.test(text)&&!el.disabled&&el.offsetParent!==null;});if(button){button.click();}}
  function setCapacityRetryEnabled(value){capacityRetryEnabled=!!value;try{localStorage.setItem('diy-capacity-auto-retry',capacityRetryEnabled?'on':'off');}catch{}if(capacityRetryTimer){clearInterval(capacityRetryTimer);capacityRetryTimer=null;}if(capacityRetryEnabled)capacityRetryTimer=setInterval(capacityRetryTick,10000);updateSettingsButton();}
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
    const projectSort=settingRow('项目按最近会话活动排序',enabled),quick=settingRow('输入框下方快捷会话栏',quickBarEnabled),right=settingRow('右侧当前会话历史提问',rightPanelEnabled),allowReturn=settingRow('移除的会话再次活动后回到快捷栏',allowDismissedReturn),capacityRetry=settingRow('模型容量错误每 10 秒自动继续',capacityRetryEnabled),language=settingSelectRow('界面语言',uiLanguagePreference,[['auto','跟随 Codex'],['zh','简体中文'],['en','English']]);
    const separator=document.createElement('div');separator.style.cssText='height:1px;background:#ffffff18;margin:2px 0;';
    const address=document.createElement('input');address.type='url';address.required=true;address.value=window.__diyUsageConfig?.url||'';
    const key=document.createElement('input');key.type='password';key.autocomplete='new-password';
    for(const input of [address,key])input.style.cssText='width:100%;box-sizing:border-box;padding:7px;background:#151515;color:#eee;border:1px solid #555;border-radius:5px;font:inherit;';
    let messageKey='开关即时保存；额度地址和密钥仅保存在本机。';const message=document.createElement('div');message.style.opacity='.7';
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap;';
    const save=document.createElement('button');save.type='submit';
    const restoreDismissed=document.createElement('button');restoreDismissed.type='button';restoreDismissed.onclick=()=>{dismissedRecent.clear();dismissedAt={};try{localStorage.setItem('diy-dismissed-recent-conversations','[]');localStorage.setItem('diy-dismissed-recent-at','{}');}catch{}recentSignature='';messageKey='已恢复全部手动移除的会话。';message.textContent=L(messageKey);mountPanel();};
    const close=document.createElement('button');close.type='button';close.onclick=()=>{form.remove();settingsFormRefresh=null;};
    const refreshLabels=()=>{title.textContent=L('侧栏增强设置');projectSort.text.textContent=L('项目按最近会话活动排序');quick.text.textContent=L('输入框下方快捷会话栏');right.text.textContent=L('右侧当前会话历史提问');allowReturn.text.textContent=L('移除的会话再次活动后回到快捷栏');capacityRetry.text.textContent=L('模型容量错误每 10 秒自动继续');language.text.textContent=L('界面语言');language.select.setAttribute('aria-label',L('界面语言'));for(const option of language.select.options)option.textContent=L(option.dataset.label);address.setAttribute('aria-label',L('额度接口地址'));address.placeholder=L('额度接口地址');key.setAttribute('aria-label',L('额度密钥'));key.placeholder=window.__diyUsageConfig?.configured?L('额度密钥已保存，留空保持不变'):L('输入额度密钥');message.textContent=L(messageKey);save.textContent=L('保存额度设置');restoreDismissed.textContent=L('恢复已移除会话');close.textContent=L('关闭');};
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
  const recentTrack=document.createElement('div');recentTrack.style.cssText='position:relative;height:51px;';recentBar.append(recentTrack);
  const RECENT_WIDTH=150,RECENT_GAP=5,RECENT_STRIDE=RECENT_WIDTH+RECENT_GAP;
  let recentItems=[],recentRange='',recentRenderFrame=0;
  function updateRecentButton(button,item,index){
    button.dataset.recentThreadId=item.id;button.dataset.quickGroup=item.completed?'completed':'recent';
    const nextTitle=item.project+' · '+item.title+(item.running?L(' · 正在运行'):item.completed?(item.viewed?L(' · 已完成 · 已查看'):L(' · 已完成 · 未查看')):'')+(item.active?L(' · 当前活动会话'):'');if(button.title!==nextTitle)button.title=nextTitle;
    button.style.left=(index*RECENT_STRIDE)+'px';
    button.style.borderColor=item.running?'color-mix(in srgb,#3b82f6 65%,transparent)':item.completed&&!item.viewed?'color-mix(in srgb,#f59e0b 75%,transparent)':'color-mix(in srgb,#22c55e 45%,transparent)';
    if(item.completed)button.dataset.completionViewed=String(item.viewed);else delete button.dataset.completionViewed;
    if(item.running&&item.active){button.dataset.activeSession='true';button.setAttribute('aria-current','true');button.style.background='linear-gradient(145deg,rgba(255,255,255,.27),rgba(96,165,250,.18) 52%,rgba(59,130,246,.12))';button.style.backdropFilter='blur(8px) saturate(155%)';button.style.webkitBackdropFilter='blur(8px) saturate(155%)';button.style.borderColor='rgba(147,197,253,.88)';button.style.boxShadow='inset 0 1px 0 rgba(255,255,255,.52),inset 0 0 0 1px rgba(255,255,255,.09),0 0 9px rgba(59,130,246,.16)';}
    else{delete button.dataset.activeSession;button.removeAttribute('aria-current');button.style.background='transparent';button.style.backdropFilter='';button.style.webkitBackdropFilter='';button.style.boxShadow='';}
    const project=button.querySelector('[data-recent-project]'),title=button.querySelector('[data-recent-title]'),top=project?.parentElement;
    if(project&&project.textContent!==item.project)project.textContent=item.project;if(title&&title.textContent!==item.title)title.textContent=item.title;
    let indicator=top?.querySelector('.diy-runtime-indicator');
    if(item.running&&!indicator){indicator=document.createElement('span');indicator.className='diy-runtime-indicator';indicator.setAttribute('role','status');top.append(indicator);}
    if(item.running&&indicator)indicator.setAttribute('aria-label',L('正在运行'));else if(!item.running)indicator?.remove();
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
  function renderRecentWindow(force=false){
    const overscan=3,start=Math.max(0,Math.floor(recentBar.scrollLeft/RECENT_STRIDE)-overscan),visible=Math.ceil((recentBar.clientWidth||RECENT_STRIDE)/RECENT_STRIDE)+overscan*2,end=Math.min(recentItems.length,start+visible),range=start+':'+end+':'+recentItems.length;
    if(!force&&range===recentRange)return;
    const visibleItems=recentItems.slice(start,end),current=[...recentTrack.children];
    const sameWindow=range===recentRange&&current.length===visibleItems.length&&current.every((button,index)=>button.dataset.recentThreadId===visibleItems[index]?.id);
    recentRange=range;
    if(sameWindow){visibleItems.forEach((item,index)=>updateRecentButton(current[index],item,start+index));return;}
    recentTrack.replaceChildren();for(let index=start;index<end;index++)recentTrack.append(makeRecentButton(recentItems[index],index));
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
  usageBox.onclick=event=>{if(event.shiftKey&&!usageHidden){showUsageQuota(true);return;}usageHidden=!usageHidden;try{localStorage.setItem('diy-usage-hidden',usageHidden?'on':'off');}catch{}mountUsageBox();};
  usageBox.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();usageBox.click();}};
  function mountUsageBox(){
    const data=window.__diyUsage;
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
  function currentHistoryThreadId(){return document.querySelector('[data-app-action-sidebar-thread-active="true"]')?.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'')||decodeURIComponent(location.pathname.match(/^\/local\/([^/?#]+)/)?.[1]||'');}
  function focusHistoryTurn(item){const needle=(item.user||'').replace(/\s+/g,' ').trim();if(!needle)return;const match=[...document.querySelectorAll('p,pre,code,[data-message-author-role],[data-message-content]')].find(node=>node.textContent?.replace(/\s+/g,' ').includes(needle.slice(0,120)));if(match){match.scrollIntoView({behavior:'smooth',block:'center'});match.animate?.([{backgroundColor:'transparent'},{backgroundColor:'color-mix(in srgb,#3b82f6 22%,transparent)'},{backgroundColor:'transparent'}],{duration:900});}}
  function currentProjectThreadIds(){const active=document.querySelector('[data-app-action-sidebar-thread-active="true"]'),group=active?.closest('div[data-sidebar-project-kind]'),header=group?.querySelector('[data-app-action-sidebar-project-row]'),id=header?.getAttribute('data-app-action-sidebar-project-id'),nativeGroup=id?props(header,p=>p.group?.projectId===id)?.group:null;return [...new Set((nativeGroup?.threadKeys||[]).map(key=>String(key).replace(/^local:/,'')).filter(Boolean))];}
  function mountInputHistory(){
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
  let recentSignature='',recentSource=null,recentActiveId='',recentOrder=[],recentOrderInitialized=false;
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
  function closeRecentMenu(){recentMenu?.remove();recentMenu=null;}
  function recentMenuOutside(event){if(recentMenu&&!recentMenu.contains(event.target))closeRecentMenu();}
  function recentMenuKey(event){if(event.key==='Escape')closeRecentMenu();}
  document.addEventListener('pointerdown',recentMenuOutside,true);
  window.addEventListener('keydown',recentMenuKey,true);
  window.addEventListener('blur',closeRecentMenu);
  function projectNewChatButton(item){
    const thread=document.querySelector('[data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');
    const header=(item.projectId&&document.querySelector('[data-app-action-sidebar-project-row][data-app-action-sidebar-project-id="'+CSS.escape(item.projectId)+'"]'))||thread?.closest('div[data-sidebar-project-kind]')?.querySelector('[data-app-action-sidebar-project-row]');
    return [...(header?.querySelectorAll('button')||[])].find(button=>/开始新聊天|新建会话|Start new chat|New chat in/i.test(button.getAttribute('aria-label')||''));
  }
  async function sendHostMessage(message){
    const send=window.electronBridge?.sendMessageFromView;
    if(typeof send==='function'){await send.call(window.electronBridge,message);return;}
    const module=await loadInitialModule();
    if(typeof module.xmn?.dispatchHostMessage==='function'){module.xmn.dispatchHostMessage(message);return;}
    throw new Error('host navigation unavailable');
  }
  async function createProjectConversation(item){
    if(item.projectId&&typeof window.electronBridge?.sendMessageFromView==='function'){
      await sendHostMessage({type:'navigate-to-route',path:'/',state:{focusComposerNonce:Date.now(),project:{type:'local',projectId:item.projectId}}});
      recentBar.title='';
      setTimeout(()=>{if(!disposed){recentSignature='';mountPanel();}},180);
      setTimeout(()=>{if(!disposed){recentSignature='';mountPanel();}},650);
      return;
    }
    const button=projectNewChatButton(item);
    if(button){button.click();return;}
    throw new Error('project conversation unavailable');
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
      const projectId=rowProps?.hoverCardProjectId;
      if(!projectId)continue;
      const title=row.getAttribute('data-app-action-sidebar-thread-title')?.trim()||recentDrafts.get(id)?.item.title||'新建会话';
      const project=rowProps.hoverCardProjectLabel||saved.find(item=>item.projectId===projectId)?.project||'项目会话';
      const persisted=saved.find(entry=>entry.id===id||(entry.projectId===projectId&&!placeholderDraftTitle(title)&&normalizedTitle(entry.title)===normalizedTitle(title)));
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
    if(selected?.id==='diy-new-project-conversation'){try{await createProjectConversation(item);}catch{recentBar.title=L('无法打开该项目的新会话，请从原生项目栏创建。');}}
    else if(selected?.id==='diy-remove-quick-conversation'){
      dismissedRecent.add(item.id);dismissedAt[item.id]=window.__diySidebarTimes?.['local:'+item.id]||0;
      try{localStorage.setItem('diy-dismissed-recent-conversations',JSON.stringify([...dismissedRecent]));localStorage.setItem('diy-dismissed-recent-at',JSON.stringify(dismissedAt));}catch{}
      recentSignature='';mountPanel();
    }else if(selected?.id){const action=actions.get(selected.id);if(action?.enabled!==false)action?.onSelect?.();}
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
    if(row&&!disposed){try{if(await nativeMenuWithRemove(row,item))return;}catch{}row.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,view:window,button:2,buttons:2,clientX:x,clientY:y}));return;}
    const hint=document.createElement('div');recentMenu=hint;hint.setAttribute('role','status');hint.textContent=L('请先在左侧加载该会话，再使用原版右键菜单');hint.style.cssText='position:fixed;right:12px;bottom:70px;z-index:2147483647;padding:10px;border-radius:6px;background:#202123;color:#eee;font:13px system-ui;';document.body.append(hint);
  }
  let nativeClient=null, nativeUnsubscribe=null, disposed=false, runtimeConnecting=false;
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
      for(const item of nativeClient.getCachedConversations?.()||[]){const type=item?.threadRuntimeStatus?.type;if(wanted.has(item.id)&&type)types.set(item.id,type);}
      for(const item of nativeClient.threadStore?.getThreadSummaries?.()||[]){const type=item?.threadRuntimeStatus?.type;if(wanted.has(item.conversationId)&&type)types.set(item.conversationId,type);}
    }
    for(const item of items){const row=document.querySelector('[data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');if(!row)continue;const summaryProps=props(row,p=>p.threadSummary),statusProps=props(row,p=>p.statusState),type=summaryProps?.threadSummary?.threadRuntimeStatus?.type||statusProps?.statusState?.type;if(type)types.set(item.id,type);}
    return types;
  }
  const observedActive=new Set();
  let completedRecent={};try{completedRecent=JSON.parse(localStorage.getItem('diy-completed-recent')||'{}');if(!completedRecent||Array.isArray(completedRecent)||typeof completedRecent!=='object')completedRecent={};}catch{}
  function markCompletedViewed(id){
    const entry=completedRecent[id];if(!entry||entry.viewed)return;
    entry.viewed=true;try{localStorage.setItem('diy-completed-recent',JSON.stringify(completedRecent));}catch{}
    recentSignature='';mountPanel();
  }
  function onCompletedThreadClick(event){
    const row=event.target.closest?.('[data-app-action-sidebar-thread-id]');
    const id=row?.getAttribute('data-app-action-sidebar-thread-id');
    if(id?.startsWith('local:')){const clientId=id.slice(6),entry=[...recentThreadAliases].find(([,alias])=>alias.clientThreadId===clientId)?.[0]||clientId;markCompletedViewed(entry);}
  }
  document.addEventListener('click',onCompletedThreadClick,true);
  function updateCompleted(items,runtimeTypes){
    let changed=false;const completedNow=[];
    for(const item of items){const type=runtimeTypes.get(item.id);
      if(isRuntimeActive(type)){observedActive.add(item.id);if(completedRecent[item.id]){delete completedRecent[item.id];changed=true;}}
      else if(type==='idle'&&observedActive.delete(item.id)){completedRecent[item.id]={...item,completedAt:Date.now(),viewed:false};completedNow.push(item.id);changed=true;}
    }
    if(changed){completedRecent=Object.fromEntries(Object.entries(completedRecent).sort((a,b)=>b[1].completedAt-a[1].completedAt).slice(0,50));try{localStorage.setItem('diy-completed-recent',JSON.stringify(completedRecent));}catch{}}return completedNow;
  }
  let initialModulePromise=null;
  async function loadInitialModule(){
    if(initialModulePromise)return initialModulePromise;
    initialModulePromise=(async()=>{
      const indexScript=[...document.scripts].map(script=>script.src).find(src=>/\/assets\/index-[^/]+\.js(?:$|[?#])/.test(src));
      if(!indexScript)throw new Error('app bundle unavailable');
      const source=await (await fetch(indexScript)).text();
      const match=source.match(/["'](?:\.\/)?(app-initial-[^"']+\.js)["']/);
      if(!match)throw new Error('app initial bundle unavailable');
      return import(new URL(match[1],indexScript).href);
    })().catch(error=>{initialModulePromise=null;throw error;});
    return initialModulePromise;
  }
  async function connectRuntime(){
    if(runtimeConnecting||nativeClient||disposed)return;runtimeConnecting=true;
    try{
      const m=await loadInitialModule();
      const contextKeys=[m.Mwt,m.cSt].filter(Boolean);
      if(disposed)return;
      const element=document.querySelector('[data-app-action-sidebar-thread-row]');
      let fiber=element?.[Object.keys(element).find(k=>k.startsWith('__reactFiber'))];
      const seen=new Set();
      for(let depth=0;fiber&&depth<180;fiber=fiber.return,depth++){
        for(let dep=fiber.dependencies?.firstContext;dep;dep=dep.next){
          const value=dep.memoizedValue;if(!(value instanceof Map)||seen.has(value))continue;seen.add(value);
          for(let entry of value.values()){
            if(!entry?.familyBindings)continue;
            for(let scope=entry;scope;scope=scope.parent){
              for(const contextKey of contextKeys){
                const binding=scope.familyBindings?.get(contextKey)?.get('local');
                const client=binding?.value?.get?.();
                if(client?.getCachedConversations){nativeClient=client;nativeUnsubscribe=client.subscribe(()=>{if(!disposed){recentSignature='';mountPanel();}});recentSignature='';mountPanel();return;}
              }
            }
          }
        }
      }
    }catch{}finally{runtimeConnecting=false;}
  }

  const recentProjectsSection=document.createElement('section');recentProjectsSection.id='diy-recent-projects';
  recentProjectsSection.setAttribute('aria-label',L('最近项目'));recentProjectsSection.style.cssText='display:flex;flex-direction:column;margin:4px 0 6px;';
  const recentProjectsTitle=document.createElement('div');recentProjectsTitle.textContent=L('最近项目');recentProjectsTitle.style.cssText='padding:5px 8px;opacity:.6;font:500 13px system-ui;';
  const recentProjectsList=document.createElement('div');recentProjectsList.setAttribute('role','list');
  recentProjectsSection.append(recentProjectsTitle,recentProjectsList);
  let projectSignature='';
  const recentProjectOpen=new Set();
  let stableProjects=[],projectActivityWatermark=0;
  try{const saved=JSON.parse(localStorage.getItem('diy-stable-recent-projects')||'null');if(Array.isArray(saved?.items)){stableProjects=saved.items.filter(p=>p?.id).slice(0,5);projectActivityWatermark=Number(saved.watermark)||0;}}catch{}
  function stableRecentProjects(incoming){
    if(!incoming.length)return stableProjects;
    if(!stableProjects.length)stableProjects=incoming.slice(0,5);
    else{
      stableProjects=stableProjects.map(item=>incoming.find(p=>p.id===item.id)||item);
      const newcomers=incoming.filter(item=>!stableProjects.some(p=>p.id===item.id)&&Number(item.time)>projectActivityWatermark).sort((a,b)=>b.time-a.time);
      if(stableProjects.length<5){for(const item of incoming)if(stableProjects.length<5&&!stableProjects.some(p=>p.id===item.id))stableProjects.push(item);}
      else if(newcomers.length){recentProjectOpen.delete(stableProjects[4].id);stableProjects[4]=newcomers[0];}
    }
    projectActivityWatermark=Math.max(projectActivityWatermark,...incoming.map(p=>Number(p.time)||0));
    const state=JSON.stringify({items:stableProjects,watermark:projectActivityWatermark});
    try{if(localStorage.getItem('diy-stable-recent-projects')!==state)localStorage.setItem('diy-stable-recent-projects',state);}catch{}
    return stableProjects;
  }
  function mountRecentProjects(){
    const pinned=[...document.querySelectorAll('#app-shell-sidebar [data-app-action-sidebar-section-toggle]')].find(e=>/^(置顶|Pinned)$/i.test(e.textContent.trim()));
    const section=pinned?.closest('[class*="group/nav-section-title"]')?.parentElement;
    if(!section?.parentElement){recentProjectsSection.remove();return;}
    if(section.nextElementSibling!==recentProjectsSection)section.insertAdjacentElement('afterend',recentProjectsSection);
    const items=stableRecentProjects((window.__diySidebarRecentProjects||[]).slice(0,5));
    const signature=JSON.stringify(items.map(({id,name})=>({id,name,open:recentProjectOpen.has(id),html:document.querySelector('[data-app-action-sidebar-project-list-id="'+CSS.escape(id)+'"]')?.outerHTML||''})));
    if(signature===projectSignature)return;projectSignature=signature;
    recentProjectsList.replaceChildren();
    for(const item of items){
      const row=document.createElement('div');row.setAttribute('role','listitem');
      const button=document.createElement('button');button.type='button';button.dataset.diyRecentProjectId=item.id;button.title=item.name;
      button.className='sidebar-item hover:bg-primary-ghost-hover';
      button.style.cssText='display:flex;align-items:center;gap:8px;width:100%;min-width:0;text-align:left;padding:5px 8px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;border-radius:6px;height:var(--height-token-row);';
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('width','16');icon.setAttribute('height','16');icon.setAttribute('aria-hidden','true');icon.style.flexShrink='0';
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3Z');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');icon.append(path);
      const label=document.createElement('span');label.textContent=item.name;label.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';button.append(icon,label);
      const nativeHeader=()=>document.querySelector('[data-app-action-sidebar-project-row][data-app-action-sidebar-project-id="'+CSS.escape(item.id)+'"]');
      const native=nativeHeader();
      const nativeLabel=native?.querySelector('[data-marquee-content]');
      if(nativeLabel){const css=getComputedStyle(nativeLabel);label.style.font=css.font;label.style.letterSpacing=css.letterSpacing;}
      if(native){const css=getComputedStyle(native);button.style.color=css.color;}
      const opened=recentProjectOpen.has(item.id);button.setAttribute('aria-expanded',String(opened));
      button.onclick=()=>{
        if(recentProjectOpen.has(item.id))recentProjectOpen.delete(item.id);
        else{recentProjectOpen.add(item.id);const header=nativeHeader();if(header?.getAttribute('aria-expanded')==='false')header.click();}
        projectSignature='';mountRecentProjects();
      };
      row.append(button);
      if(opened){
        const source=document.querySelector('[data-app-action-sidebar-project-list-id="'+CSS.escape(item.id)+'"]');
        if(source){
          const copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
          clones.forEach((node,index)=>{
            for(const attr of [...node.attributes])if(attr.name==='id'||attr.name==='aria-labelledby'||attr.name.startsWith('data-app-action')||attr.name.startsWith('data-sidebar'))node.removeAttribute(attr.name);
            if(originals[index].matches('[data-app-action-sidebar-thread-row],button,[role="button"]'))node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();originals[index].click();});
          });
          row.append(copy);
        }else{const hint=document.createElement('div');hint.textContent=L('请先展开项目所在分区');hint.style.cssText='padding:4px 12px;opacity:.6;font:inherit';row.append(hint);}
      }
      recentProjectsList.append(row);
    }
  }
  async function openRecent(item){
    markCompletedViewed(item.id);
    const row=document.querySelector('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id="local:'+CSS.escape(nativeThreadKey(item))+'"]');
    if(row){row.click();return;}
    try{await sendHostMessage({type:'navigate-to-route',path:'/local/'+encodeURIComponent(item.id)});recentBar.title='';}
    catch{recentBar.title=L('当前客户端导航接口不可用，请从原生侧栏打开会话。');}
  }
  let historyPanelWidth=320;try{let stored=localStorage.getItem('diy-history-panel-width');if(!localStorage.getItem('diy-history-panel-width-0412-migrated')){if(stored==='240'){localStorage.removeItem('diy-history-panel-width');stored=null;}localStorage.setItem('diy-history-panel-width-0412-migrated','1');}if(stored!==null&&stored.trim()!==''){const saved=Number(stored);if(Number.isFinite(saved))historyPanelWidth=saved;}}catch{}
  function clampHistoryPanelWidth(value){return Math.max(240,Math.min(Math.min(680,Math.floor(window.innerWidth*.58)),Math.round(value)));}
  const historyContainer=document.createElement('aside');historyContainer.id='diy-input-history-panel';historyContainer.setAttribute('aria-label',L('当前会话历史提问'));historyContainer.style.cssText='position:relative;display:flex;min-width:0;height:100%;overflow:hidden;border-left:1px solid color-mix(in srgb,currentColor 14%,transparent);background:var(--color-background);color:inherit;font:inherit;';
  function mountHistoryControls(docked,hideSettings=false){
    if(docked){
      historyFooter.append(usageBox,panel,historyCollapseButton);
      panel.style.cssText='position:relative;display:flex;flex:0 0 auto;align-items:stretch;z-index:4;font:11px system-ui;';
      settingsButton.style.height='100%';mountUsageBox();return;
    }
    usageBox.remove();
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
  function mountInputHistoryPanel(){
    if(!rightPanelEnabled){historyContainer.remove();historyExpandButton.remove();mountHistoryControls(false);syncOutputPanelRightBridge();return;}
    const main=document.querySelector('[data-app-shell-focus-area="main"]');if(!main?.parentElement){historyContainer.remove();historyExpandButton.remove();mountHistoryControls(false);syncOutputPanelRightBridge();return;}
    if(historyCollapsed){historyContainer.remove();mountHistoryControls(false,true);if(historyExpandButton.parentElement!==document.body)document.body.append(historyExpandButton);syncOutputPanelRightBridge();return;}
    historyExpandButton.remove();
    applyHistoryPanelWidth(historyPanelWidth);
    if(historyContainer.parentElement!==main.parentElement)main.insertAdjacentElement('afterend',historyContainer);
    mountHistoryControls(true);
    syncOutputPanelRightBridge();
  }
  function mountPanel(){
    if(!nativeClient&&!runtimeConnecting&&!disposed)void connectRuntime();
    mountInputHistory();
    mountRecentProjects();
    mountInputHistoryPanel();
    if(!quickBarEnabled){recentBar.remove();return;}
    const inputs=[...document.querySelectorAll('[data-codex-composer]')];
    const input=inputs.find(e=>e.checkVisibility())||inputs[0];
    const surface=input?.closest('[data-composer-surface-variant]');
    if(!surface?.parentElement)return;
    if(surface.nextElementSibling!==recentBar)surface.insertAdjacentElement('afterend',recentBar);
    const activeNativeId=document.querySelector('[data-app-action-sidebar-thread-active="true"]')?.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'');
    const activeId=[...recentThreadAliases].find(([,alias])=>alias.clientThreadId===activeNativeId)?.[0]||activeNativeId;
    const source=window.__diySidebarRecent||[];
    const times=window.__diySidebarTimes||{};
    const candidates=[...source,...projectDraftsFor(source)].sort((a,b)=>(Number(b.time)||times['local:'+b.id]||0)-(Number(a.time)||times['local:'+a.id]||0)||String(b.id).localeCompare(String(a.id))),runtimeTypes=runtimeTypesFor(candidates);
    const resumedIds=candidates.filter(item=>!!completedRecent[item.id]&&isRuntimeActive(runtimeTypes.get(item.id))).map(item=>item.id);
    updateCompleted(candidates,runtimeTypes);
    let restored=false;
    if(allowDismissedReturn)for(const item of candidates)if(dismissedRecent.has(item.id)&&(window.__diySidebarTimes?.['local:'+item.id]||0)>(dismissedAt[item.id]||0)){dismissedRecent.delete(item.id);delete dismissedAt[item.id];restored=true;}
    if(restored)try{localStorage.setItem('diy-dismissed-recent-conversations',JSON.stringify([...dismissedRecent]));localStorage.setItem('diy-dismissed-recent-at',JSON.stringify(dismissedAt));}catch{}
    const available=candidates.filter(item=>!dismissedRecent.has(item.id));
    const domDetails=new Map();for(const row of document.querySelectorAll('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-id]')){const id=row.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^local:/,'');if(!id)continue;const header=row.closest('div[data-sidebar-project-kind]')?.querySelector('[data-app-action-sidebar-project-row]');domDetails.set(id,{title:row.getAttribute('data-app-action-sidebar-thread-title'),project:header?.getAttribute('data-app-action-sidebar-project-label')});}
    const byId=new Map(available.map(item=>[item.id,item])),newSessionIds=available.map(item=>item.id).filter(id=>!recentOrder.includes(id)),prioritizeIds=[...new Set([...resumedIds,...newSessionIds])].filter(id=>byId.has(id));
    if(!recentOrderInitialized){recentOrder=available.map(item=>item.id);recentOrderInitialized=true;}
    else recentOrder=[...prioritizeIds,...recentOrder.filter(id=>byId.has(id)&&!prioritizeIds.includes(id))];
    const runningIds=recentOrder.filter(id=>byId.has(id)&&isRuntimeActive(runtimeTypes.get(id))),viewedCompletedIds=recentOrder.filter(id=>byId.has(id)&&!isRuntimeActive(runtimeTypes.get(id))&&!!completedRecent[id]?.viewed),otherIds=recentOrder.filter(id=>byId.has(id)&&!runningIds.includes(id)&&!viewedCompletedIds.includes(id));
    recentOrder=[...runningIds,...otherIds,...viewedCompletedIds];
    const recent=recentOrder.map(id=>byId.get(id)).filter(Boolean).map(item=>{const running=isRuntimeActive(runtimeTypes.get(item.id)),details=domDetails.get(item.id);return {...item,completed:!!completedRecent[item.id]&&!running,viewed:!!completedRecent[item.id]?.viewed,running,active:item.id===activeId&&running,title:details?.title||item.title,project:details?.project||item.project};
    });
    const signature=JSON.stringify(recent.map(({id,project,title,running,completed,viewed})=>({id,project,title,running,completed,viewed})));
    recentSource=source;recentActiveId=activeId;recentItems=recent;
    if(signature===recentSignature){renderRecentWindow(true);return;}recentSignature=signature;
    const previousScrollLeft=recentBar.scrollLeft;recentTrack.dataset.itemCount=String(recent.length);recentTrack.style.width=Math.max(0,recent.length*RECENT_STRIDE-RECENT_GAP)+'px';renderRecentWindow(true);
    recentBar.scrollLeft=Math.min(previousScrollLeft,Math.max(0,recentBar.scrollWidth-recentBar.clientWidth));
    renderRecentWindow(true);
  }
  mountPanel();
  let uiRefreshTimer=null;
  function scheduleUIRefresh(){if(uiRefreshTimer!==null)return;uiRefreshTimer=setTimeout(()=>{uiRefreshTimer=null;if(!disposed)mountPanel();},32);}
  const uiObserver=new MutationObserver(records=>{
    if(disposed)return;
    const external=records.some(r=>![recentBar,recentProjectsSection,panel,historyContainer,historyPanel].some(el=>el===r.target||el.contains(r.target)));
    if(external)scheduleUIRefresh();
  });
  uiObserver.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-app-action-sidebar-thread-active']});
  connectRuntime();
  function setEnabled(value){
    enabled=!!value;clearInterval(timer);timer=null;
    observer?.disconnect();
    document.documentElement.toggleAttribute('data-diy-sidebar-enabled',enabled);
    if(enabled){observer=new MutationObserver(()=>apply());apply();}else{
      clearMarkers();
      restore();for(const b of buttons.values())b.remove();buttons.clear();
      for(const state of nativeStates.values()){try{if(state.showAll!==null)state.setExpanded?.(state.showAll);}catch{}}
      nativeStates.clear();status.textContent=L('已关闭 · 原生显示已恢复');
    }
    updateSettingsButton();
    try{localStorage.setItem(STORAGE,enabled?'on':'off');}catch{}
  }
  window[KEY]={version:VERSION,get uiLanguage(){return uiLanguage;},get uiLanguagePreference(){return uiLanguagePreference;},setUiLanguagePreference,get enabled(){return enabled;},get quickBarEnabled(){return quickBarEnabled;},get rightPanelEnabled(){return rightPanelEnabled;},get allowDismissedReturn(){return allowDismissedReturn;},get capacityRetryEnabled(){return capacityRetryEnabled;},get stats(){return stats;},getCurrentProjectThreadIds:currentProjectThreadIds,apply,refreshUI:mountPanel,setEnabled,setQuickBarEnabled,setRightPanelEnabled,setAllowDismissedReturn,setCapacityRetryEnabled,dispose(){document.removeEventListener('click',onCompletedThreadClick,true);document.removeEventListener('click',queueOutputPanelBridgeSync,true);document.removeEventListener('pointerdown',queueOutputPanelBridgeSync,true);window.removeEventListener('keydown',onOutputPanelBridgeKey,true);window.removeEventListener('blur',queueOutputPanelBridgeSync);if(outputPanelBridgeTimer!==null)clearTimeout(outputPanelBridgeTimer);for(const stale of document.querySelectorAll('.diy-output-panel-right-bridge')){stale.classList.remove('diy-output-panel-right-bridge');stale.style.removeProperty('--diy-output-panel-shift');}for(const stale of document.querySelectorAll('.diy-output-panel-right-portal'))stale.classList.remove('diy-output-panel-right-portal');recentBar.removeEventListener('scroll',onRecentBarScroll);recentBar.removeEventListener('wheel',onRecentBarWheel);if(recentRenderFrame)cancelAnimationFrame(recentRenderFrame);if(uiRefreshTimer!==null)clearTimeout(uiRefreshTimer);if(capacityRetryTimer!==null)clearInterval(capacityRetryTimer);closeRecentMenu();document.removeEventListener('pointerdown',recentMenuOutside,true);window.removeEventListener('keydown',recentMenuKey,true);window.removeEventListener('blur',closeRecentMenu);disposed=true;uiObserver.disconnect();if(typeof nativeUnsubscribe==='function')nativeUnsubscribe();spinCSS.remove();setEnabled(false);compactCSS.remove();settingsButton.onclick=null;historyCollapseButton.onclick=null;historyExpandButton.onclick=null;historyExpandButton.remove();document.getElementById('diy-usage-settings')?.remove();historyPanel.remove();historyContainer.remove();panel.remove();recentBar.remove();recentProjectsSection.remove();window[KEY]={version:VERSION,disposed:true};}};
  setEnabled(enabled);
})();






