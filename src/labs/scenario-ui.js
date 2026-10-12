import {getScenario,textFor,parseScenarioInput,scenarioTest,scenarioComparison} from './scenarios.mjs';
import {mountEditor} from '../editor.js';
const item=getScenario(document.querySelector('[data-scenario]').dataset.scenario);
const locale=document.documentElement.lang==='zh-CN'?'zh':'en';
const t=(en,zh)=>locale==='zh'?zh:en,txt=v=>textFor(v,locale),$=id=>document.getElementById(id);
const key='tensordrill:comprehension-lab:'+item.version;
const initialState=()=>({code:item.starter,input:JSON.stringify(item.initialInput,null,2),notes:'',pane:0,passedCode:null,transfer:false,evidence:null,phasePass:[null,null,null]});
const state=initialState();
let storageOK=true;
try {
  const saved=JSON.parse(localStorage.getItem(key)||'null');
  if(saved&&typeof saved==='object') {
    for(const [k,limit] of [['code',20000],['input',8000],['notes',4000]])if(typeof saved[k]==='string'&&saved[k].length<=limit)state[k]=saved[k];
    if(Number.isInteger(saved.pane)&&saved.pane>=0&&saved.pane<=2)state.pane=saved.pane;
    if(saved.passedCode===state.code)state.passedCode=state.code;
    state.transfer=saved.transfer===true;
    if(saved.evidence)try{state.evidence=parseScenarioInput(item,JSON.stringify(saved.evidence));}catch{}
    if(Array.isArray(saved.phasePass)&&saved.phasePass.length===3)state.phasePass=saved.phasePass.map(v=>typeof v==='string'&&/^\d+\/\d+$/.test(v)?v:null);
  }
}catch{storageOK=false;}
function save(){
  try{localStorage.setItem(key,JSON.stringify(state));}catch{storageOK=false;}
  $('save-status').textContent=storageOK?t('Saved in this browser','已保存在当前浏览器'):t('Storage unavailable','无法保存');
  if(!storageOK){$('storage-notice').hidden=false;$('storage-notice').textContent=t('Storage is unavailable. Copy your code before closing this tab.','存储不可用，请在关闭页面前复制代码。');}
}
function element(tag,text='',cls=''){const el=document.createElement(tag);el.textContent=text;el.className=cls;return el;}
function showPane(pane,scroll=true){
  state.pane=pane;
  for(let i=0;i<3;i++){$('pane-'+i).hidden=i!==pane;const button=document.querySelector(`[data-pane="${i}"]`);if(i===pane)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');}
  if(scroll){document.querySelector('.lab-heading').scrollIntoView({block:'start'});const heading=$('pane-'+pane).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  save();
}
function checklist(){
  const done=[state.passedCode===state.code,state.transfer];
  $('checklist').replaceChildren(...[t('Current code passes every regression group','当前代码通过所有回归分组'),t('Transfer check completed','完成迁移检查')].map((label,i)=>element('li',(done[i]?'✓ ':'○ ')+label,done[i]?'done':'')));
  if(state.evidence)$('checklist').append(element('li',t('✓ Custom regression input saved','✓ 已保存自定义回归输入'),'done'));
  $('complete-banner').hidden=!done.every(Boolean);
  state.phasePass.forEach((value,i)=>{$('phase-result-'+i).textContent=value||t('Not run','未运行');});
}
$('scenario-code').value=state.code;$('notes').value=state.notes;$('experiment-input').value=state.input;
const editor=mountEditor($('scenario-code'));
function changed(){state.code=$('scenario-code').value;state.passedCode=null;state.phasePass=[null,null,null];$('test-summary').textContent=t('Code changed · rerun tests','代码已修改 · 请重新测试');$('test-results').replaceChildren();$('experiment-result').replaceChildren(element('p',t('Code changed. Rerun to see current outputs.','代码已修改，请重跑查看当前输出。')));checklist();save();}
$('scenario-code').addEventListener('input',changed);
let priorCode=null;
function load(code){priorCode=$('scenario-code').value;$('scenario-code').value=code;editor.refresh();changed();$('undo-load').hidden=false;}
$('restore').addEventListener('click',()=>load(item.starter));
$('load-partial').addEventListener('click',()=>load(item.partial));
$('load-reference').addEventListener('click',()=>{load(item.reference);showPane(1);});
$('undo-load').addEventListener('click',()=>{if(priorCode===null)return;$('scenario-code').value=priorCode;priorCode=null;editor.refresh();changed();$('undo-load').hidden=true;});
$('notes').addEventListener('input',()=>{state.notes=$('notes').value;save();});
$('experiment-input').addEventListener('input',()=>{state.input=$('experiment-input').value;$('experiment-result').replaceChildren(element('p',t('Input changed. Refresh the input view and run again.','输入已修改，请刷新输入图并重新运行。')));$('input-visual').replaceChildren(element('p',t('Input view needs refresh.','输入图待刷新。'),'visual-caption'));save();});
document.querySelectorAll('[data-pane],[data-go]').forEach(button=>button.addEventListener('click',()=>showPane(Number(button.dataset.pane??button.dataset.go))));

function canvasView(shapes,host){
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 104 104');svg.setAttribute('class','canvas-visual');svg.setAttribute('role','img');svg.setAttribute('aria-label',t('Rectangle positions on the canvas','画布上的矩形位置'));
  const colors=['#d9ebde','#e6def0','#e9e8ca','#d9e6ef'];
  // User code can return arbitrary JSON. Validate geometry before drawing it.
  for(const [i,s] of shapes.slice(0,40).entries()){
    if(!s||!['x','y','width','height'].every(k=>typeof s[k]==='number'&&Number.isFinite(s[k]))||s.width<=0||s.height<=0)continue;
    const rect=document.createElementNS(ns,'rect');for(const k of ['x','y','width','height'])rect.setAttribute(k,String(Math.max(0,Math.min(100,s[k]))));rect.setAttribute('fill',colors[i%colors.length]);rect.setAttribute('stroke','#6b9574');rect.setAttribute('stroke-width','.5');svg.append(rect);
    const label=document.createElementNS(ns,'text');label.setAttribute('x',String(Math.max(2,Math.min(95,s.x+1))));label.setAttribute('y',String(Math.max(5,Math.min(98,s.y+6))));label.textContent=String(s.id??'?').slice(0,16);svg.append(label);
  }
  host.append(svg);
}
function visualize(input,host,output){
  host.replaceChildren();
  if(item.mode==='debug'){
    const grid=element('div','','maze-grid');grid.style.gridTemplateColumns=`repeat(${input.grid[0].length},minmax(0,1fr))`;
    for(const [r,row] of input.grid.entries())for(const [c,ch] of [...row].entries()){
      const same=p=>p[0]===r&&p[1]===c,start=same(input.start),goal=same(input.goal),portal=input.portals.some(p=>same(p[0]));
      const cell=element('div',start&&goal?'S/G':start?'S':goal?'G':ch==='#'?'#':portal?'P':`${r},${c}`,'maze-cell'+(ch==='#'?' wall':'')+(start||goal?' endpoint':'')+(portal?' portal':''));
      cell.title=`[${r}, ${c}]`;grid.append(cell);
    }
    host.append(grid,element('p',t('S start · G goal · # wall · purple outline: portal source. Moves and portals each cost one step.','S 起点 · G 终点 · # 墙 · 紫边为传送门入口。普通移动和传送均消耗 1 步。'),'visual-caption'));
    if(input.portals.length)host.append(element('pre',input.portals.map(([a,b])=>`[${a}] → [${b}]`).join('\n'),'portal-list'));
    if(output!==undefined)host.append(element('p',t('Returned distance: ','返回距离：')+JSON.stringify(output),'visual-caption'));
  }else if(item.mode==='review'){
    host.append(element('p',`k = ${input.k} · `+t('No queuing · lowest available ID','不排队 · 选择最小空闲 ID'),'visual-caption'));
    const table=element('table','','timeline'),head=element('thead'),hr=element('tr');
    const headers=['#',t('Arrival','到达'),t('Duration','时长'),t('Interval / end','占用区间 / 结束')];if(output!==undefined)headers.push(t('Assigned ID','分配 ID'));
    headers.forEach(label=>hr.append(element('th',label)));head.append(hr);table.append(head);const body=element('tbody');
    const end=Math.max(1,...input.requests.map(([a,d])=>a+d));
    input.requests.forEach(([a,d],i)=>{const row=element('tr');[i,a,d].forEach(v=>row.append(element('td',String(v))));const period=element('td',`[${a}, ${a+d})`);const track=element('div','','time-track');const bar=element('span','','time-bar');bar.style.width=`${d/end*100}%`;bar.style.marginLeft=`${a/end*100}%`;if(Array.isArray(output)&&output[i]===-1)bar.classList.add('dropped');track.append(bar);period.append(track);row.append(period);if(output!==undefined)row.append(element('td',Array.isArray(output)?String(output[i]??'?'):'?'));body.append(row);});table.append(body);host.append(table);
    if(!input.requests.length)host.append(element('p',t('No requests.','没有请求。'),'visual-caption'));
    host.append(element('p',t('Intervals show the occupied period if accepted. End time itself is available. Dropped requests occupy no interval.','区间表示请求被接受时的占用时间；结束时刻已可复用。丢弃的请求不占用服务器。'),'visual-caption'));
  }else{
    const shapes=output===undefined?input.initial:Array.isArray(output?.shapes)?output.shapes:[];
    canvasView(shapes,host);
    if(output===undefined)host.append(element('p',t('Initial state only. Commands below have not run. Coordinates use a 0–100 canvas.','仅为初始状态，下方命令尚未执行。画布坐标范围为 0–100。'),'visual-caption'));
    else host.append(element('p',`undo: ${String(output?.undo_depth??'?')} · redo: ${String(output?.redo_depth??'?')}`,'visual-caption'));
    host.append(element('pre',input.commands.map((c,i)=>`${i+1}. ${JSON.stringify(c)}`).join('\n')||t('No commands.','没有命令。'),'command-list'));
  }
}
function parseInput(){return parseScenarioInput(item,$('experiment-input').value);}
function inputError(error){return ({size:t('Input exceeds 8 KB.','输入超过 8 KB。'),json:t('Invalid JSON. Use double quotes and remove trailing commas.','JSON 无法解析，请使用双引号并删除多余逗号。'),shape:t('The JSON keys must be exactly: ','JSON 须恰好包含：')+item.args.join(', '),contract:t('Input is outside the stated contract. Check sizes, coordinates, command fields and ordering.','输入不符合题目约束，请检查大小、坐标、命令字段与顺序。')})[error.message]||t('Invalid input.','输入不合法。');}
function inspect(){try{visualize(parseInput(),$('input-visual'));}catch(error){$('input-visual').replaceChildren(element('p',inputError(error),'bad-text'));}}
$('inspect').addEventListener('click',inspect);
$('example-select').addEventListener('change',()=>{const v=$('example-select').value;state.input=JSON.stringify(v==='initial'?item.initialInput:item.fixtures[Number(v)].input,null,2);$('experiment-input').value=state.input;$('experiment-result').replaceChildren();inspect();save();});

document.querySelectorAll('[name="transfer"]').forEach(input=>input.addEventListener('change',()=>{state.transfer=false;$('transfer-feedback').textContent='';checklist();save();}));
$('check-transfer').addEventListener('click',()=>{const selected=document.querySelector('[name="transfer"]:checked');state.transfer=!!selected&&Number(selected.value)===item.transfer.answer;$('transfer-feedback').textContent=state.transfer?t('Correct. ','正确。')+txt(item.transfer.explanation):selected?t('Check the acceptance contract and try again.','请对照验收契约重新判断。'):t('Choose an answer first.','请先选择答案。');$('transfer-feedback').className='inline-feedback '+(state.transfer?'good-text':'bad-text');checklist();save();});
if(state.transfer)document.querySelector(`[name="transfer"][value="${item.transfer.answer}"]`).checked=true;

let worker=null,active=null,serial=0,timer=null;
const buttons=['run-experiment','run-all','load-partial','load-reference','restore','undo-load'];
function busy(value){[...buttons,'restart','confirm-restart'].forEach(id=>$(id).disabled=value);document.querySelectorAll('[data-phase]').forEach(b=>b.disabled=value);$('scenario-code').readOnly=value;$('experiment-input').readOnly=value;$('example-select').disabled=value;$('stop').hidden=!value;document.querySelector('.runtime-bar').classList.toggle('busy',value);}
function finish(){clearTimeout(timer);timer=null;active=null;busy(false);}
function fail(message){if(!active)return;$(active.kind==='experiment'?'experiment-result':'test-summary').textContent=message;$('runtime-status').textContent=message;worker?.terminate();worker=null;finish();}
function observation(row){const line=row.stdout?.split('\n').filter(s=>s.startsWith('TD_SCENARIO_RESULT=')).at(-1);return line?JSON.parse(line.slice('TD_SCENARIO_RESULT='.length)):null;}
function showResults(job,rows){
  if(job.kind==='experiment'){
    const data=observation(rows[0]);if(!rows[0].pass||!data){$('experiment-result').replaceChildren(element('pre',rows[0].error||t('Could not read the experiment output.','无法读取试验输出。'),'bad-text'));return;}
    const host=$('experiment-result');host.replaceChildren(element('strong',data.different?t('Difference found · saved for regression','发现差异 · 已加入回归'):t('Outputs agree on this input','这个输入下结果一致'),data.different?'bad-text':'good-text'));
    if(data.mutated)host.append(element('p',t('The input was mutated, which violates the contract.','输入被修改，违反契约。'),'bad-text'));
    const pair=element('div','','output-visuals');
    for(const [label,value] of [[t('Your current code','你的当前代码'),data.error??data.actual],[t('Contract reference','契约参考'),data.expected]]){
      const box=element('div');box.append(element('h3',label));const view=element('div','','input-visual');if(!data.error||label===t('Contract reference','契约参考'))visualize(job.input,view,value);box.append(view,element('pre',JSON.stringify(value,null,2),'test-output'));pair.append(box);
    }
    host.append(pair);if(data.different){state.evidence=job.input;state.passedCode=null;checklist();save();}
    return;
  }
  const passed=rows.filter(r=>r.pass).length;
  $('test-summary').textContent=`${passed}/${rows.length} `+t('passed','项通过')+(job.phase===null?'':t(' · group only',' · 仅本分组'));
  $('test-summary').className='regression-summary '+(passed===rows.length?'good-text':'bad-text');
  for(let i=0;i<3;i++){const indices=job.tests.map((test,j)=>test.phase===i?j:-1).filter(j=>j>=0);if(indices.length)state.phasePass[i]=`${indices.filter(j=>rows[j].pass).length}/${indices.length}`;}
  if(job.phase===null)state.passedCode=passed===rows.length?job.code:null;
  $('test-results').replaceChildren(...rows.map((row,i)=>{
    const container=element('div','','regression-case'),header=element('div','','test-name');header.append(element('span',row.name),element('span',row.pass?t('PASS','通过'):t('FAIL','失败'),row.pass?'good-text':'bad-text'));container.append(header);
    const detail=element('details');detail.append(element('summary',t('Inspect input, outputs & test','查看输入、输出与测试')));const f=job.fixtures[i];if(f)detail.append(element('pre',JSON.stringify(f.input,null,2)));
    const data=observation(row);if(data)detail.append(element('pre',t('Actual / expected','实际 / 预期')+'\n'+JSON.stringify(data,null,2)));
    if(!row.pass)detail.append(element('pre',[row.error_type,row.error,row.location].filter(Boolean).join('\n')));
    detail.append(element('pre',job.tests[i].code));container.append(detail);return container;
  }));checklist();save();
}
function start(kind,tests,extra={}){
  if(active)return;const code=$('scenario-code').value;
  if(new TextEncoder().encode(code).length>20000){$('runtime-status').textContent=t('Code exceeds 20 KB.','代码超过 20 KB。');return;}
  active={kind,tests,code,id:++serial,...extra};busy(true);$('runtime-status').textContent=t('Preparing Python… first download can take a moment.','正在准备 Python… 首次下载可能需要一些时间。');
  timer=setTimeout(()=>fail(t('Python did not load in 90 seconds. Check the connection and retry.','90 秒内未加载 Python，请检查网络后重试。')),90000);
  if(!worker){worker=new Worker(new URL('../runner.worker.js',import.meta.url));worker.onerror=()=>fail(t('Worker failed. Retry to start a new one.','运行器出错，请重试以重新启动。'));worker.onmessage=event=>{
    const data=event.data;if(!active||data.requestId!==active.id)return;
    if(data.type==='loading')$('runtime-status').textContent=t('Downloading Python runtime…','正在下载 Python 运行环境…');
    if(data.type==='running'){clearTimeout(timer);timer=setTimeout(()=>fail(t('Execution exceeded 15 seconds and was stopped. Edit and retry.','执行超过 15 秒，已停止；可修改后重试。')),15000);$('runtime-status').textContent=t('Running Python locally…','正在本地运行 Python…');}
    if(data.type==='progress')$('runtime-status').textContent=t('Running locally','本地运行中')+` · ${data.finished}/${data.total}`;
    if(data.type==='error')fail(t('Runtime error: ','运行器出错：')+data.error);
    if(data.type==='results'){const job=active;try{showResults(job,data.results);}catch{fail(t('Could not display the result. Retry.','无法展示结果，请重试。'));return;}$('runtime-status').textContent=t('Python ready · all code runs in this browser','Python 已就绪 · 代码均在当前浏览器运行');finish();}
  };}
  worker.postMessage({type:'run',requestId:active.id,code,tests});
}
$('run-experiment').addEventListener('click',()=>{let input;try{input=parseInput();}catch(error){$('experiment-result').replaceChildren(element('p',inputError(error),'bad-text'));return;}visualize(input,$('input-visual'));start('experiment',[scenarioComparison(item,input)],{input});});
function runTests(phase=null){
  if(active)return;
  const fixtures=item.fixtures.filter(f=>phase===null||f.phase===phase),tests=fixtures.map(f=>scenarioTest(item,f,locale));
  if(phase===null&&state.evidence){const custom=scenarioComparison(item,state.evidence);tests.push({...custom,name:t('Saved custom input','保存的自定义输入'),phase:3,code:custom.code+'\nassert observation["different"] is False'});fixtures.push({input:state.evidence});}
  if(phase===null){state.passedCode=null;checklist();save();}
  $('test-summary').textContent=t('Running tests…','正在运行测试…');
  start('tests',tests,{phase,fixtures});
}
$('run-all').addEventListener('click',()=>runTests());document.querySelectorAll('[data-phase]').forEach(b=>b.addEventListener('click',()=>runTests(Number(b.dataset.phase))));
$('stop').addEventListener('click',()=>fail(t('Stopped. You can edit and run again.','已停止，可以编辑后重新运行。')));
$('restart').addEventListener('click',()=>{$('restart-confirmation').hidden=false;$('confirm-restart').focus();});
$('cancel-restart').addEventListener('click',()=>{$('restart-confirmation').hidden=true;$('restart').focus();});
$('confirm-restart').addEventListener('click',()=>{Object.assign(state,initialState());save();location.reload();});
$('scenario-code').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!active)runTests();}});
if(state.passedCode===state.code)$('test-summary').textContent=t('Previously passed · rerun for detailed results','此前已通过 · 可重跑查看逐项结果');
inspect();showPane(state.pane,false);checklist();save();
