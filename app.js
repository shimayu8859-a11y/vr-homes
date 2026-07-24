/* ══════════════════════════════════════
   CONSTANTS & STATE
══════════════════════════════════════ */
const MASTER_EMAIL = 'nori1216chopper@gmail.com';
const ADMIN_CODE   = '123456';

let isLoggedIn  = false;
let currentUser = null;

const userStore = [
  { name:'デモユーザー', email:'demo@vrhomes.jp',         password:'demo1234',       role:'user',   active:true,  photoURL:null },
  { name:'田中 太郎',    email:'tanaka@email.com',         password:'tanaka123',      role:'user',   active:true,  photoURL:null },
  { name:'鈴木 花子',    email:'suzuki@email.com',         password:'suzuki123',      role:'admin',  active:true,  photoURL:null },
  { name:'山本 次郎',    email:'yamamoto@email.com',       password:'yamamoto123',    role:'user',   active:false, photoURL:null },
  { name:'のり',         email:MASTER_EMAIL,               password:'nori1216master', role:'master', active:true,  photoURL:null },
];

/* ── Leaflet map state ── */
let leafletMap  = null;
let mapMarkers  = {};   // id → L.marker

/* ══════════════════════════════════════
   AWS連携設定
   本番運用時はここにAPIのURLを記入してください
   例: 'https://xxxx.execute-api.ap-northeast-3.amazonaws.com/prod/properties'
══════════════════════════════════════ */
const AWS_API_URL = null;

/* ── ローカルフォールバックデータ(lat/lng付き) ── */
const LOCAL_PROPS = [
  {id:1,name:'コート渋谷',    area:'渋谷区',address:'東京都渋谷区道玄坂1丁目',  station:'渋谷駅 徒歩3分',  price:92000,  size:48, madori:'2LDK',tags:['ペット可','南向き'],  lat:35.6580,lng:139.7016,photoURL:null,floorplanURL:null},
  {id:2,name:'グランツ新宿',  area:'新宿区',address:'東京都新宿区西新宿3丁目',   station:'新宿駅 徒歩8分',  price:68000,  size:33, madori:'1LDK',tags:['オートロック'],        lat:35.6896,lng:139.6917,photoURL:null,floorplanURL:null},
  {id:3,name:'ソレイユ目黒',  area:'目黒区',address:'東京都目黒区上目黒2丁目',   station:'目黒駅 徒歩5分',  price:115000, size:62, madori:'3LDK',tags:['南向き','宅配BOX'],  lat:35.6336,lng:139.7157,photoURL:null,floorplanURL:null},
  {id:4,name:'アーバン品川',  area:'品川区',address:'東京都品川区港南1丁目',     station:'品川駅 徒歩10分', price:75000,  size:40, madori:'1LDK',tags:['ネット無料'],         lat:35.6082,lng:139.7304,photoURL:null,floorplanURL:null},
  {id:5,name:'ルミエール恵比寿',area:'渋谷区',address:'東京都渋谷区恵比寿1丁目',station:'恵比寿駅 徒歩6分',price:88000,  size:45, madori:'2LDK',tags:['バルコニー'],       lat:35.6462,lng:139.7096,photoURL:null,floorplanURL:null},
  {id:6,name:'シティ池袋',    area:'豊島区',address:'東京都豊島区西池袋2丁目',   station:'池袋駅 徒歩4分',  price:58000,  size:28, madori:'1K',  tags:['24hゴミ'],          lat:35.7295,lng:139.7109,photoURL:null,floorplanURL:null},
];

let PROPS      = [...LOCAL_PROPS];
let favs       = new Set([1]);
let nextPropId = 100;

/* ══════════════════════════════════════
   ROLE HELPERS
══════════════════════════════════════ */
function isMaster(u)  { return (u||currentUser)?.role==='master'; }
function isAdmin(u)   { const r=(u||currentUser)?.role; return r==='admin'||r==='master'; }
function isRegular(u) { return (u||currentUser)?.role==='user'; }
function roleLabel(role){
  if(role==='master') return '<span class="tag tmaster">マスター</span>';
  if(role==='admin')  return '<span class="tag tgold">管理者</span>';
  return '<span class="tag tgr">一般</span>';
}

/* ══════════════════════════════════════
   UI UPDATE AFTER LOGIN
══════════════════════════════════════ */
function applyRoleUI(){
  const u=currentUser; if(!u) return;

  /* アバター */
  updateAvatarDisplay();
  document.getElementById('mp-name').textContent  = u.name;
  document.getElementById('mp-email').textContent = u.email;
  document.getElementById('mp-role-badge').innerHTML = roleLabel(u.role);
  if(document.getElementById('prof-email')) document.getElementById('prof-email').value = u.email;

  /* プロフィール姓名を設定 */
  const parts = u.name.split(' ');
  if(document.getElementById('prof-sei')) document.getElementById('prof-sei').value = parts[0]||'';
  if(document.getElementById('prof-mei')) document.getElementById('prof-mei').value = parts[1]||'';

  /* タブ表示制御 */
  document.getElementById('tab-admin').classList.toggle('hidden', !isAdmin());
  document.getElementById('tab-master').classList.toggle('hidden', !isMaster());
  document.getElementById('mp-nav-code').classList.toggle('hidden', !isRegular());
  document.getElementById('nav-admin-btn').classList.toggle('hidden', !isAdmin());
  document.getElementById('admin-email-display').textContent = u.email;
  refreshStats();
}

function updateAvatarDisplay(){
  const u = currentUser; if(!u) return;
  const el = document.getElementById('mp-avatar');
  if(!el) return;
  if(u.photoURL){
    el.style.backgroundImage  = `url(${u.photoURL})`;
    el.style.backgroundSize   = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = u.name.charAt(0);
  }
}

function refreshStats(){
  const total   = userStore.filter(u=>u.role!=='master').length;
  const admins  = userStore.filter(u=>u.role==='admin').length;
  const regulars= userStore.filter(u=>u.role==='user').length;
  [['admin-user-count',total],['master-user-count',userStore.length],
   ['master-admin-count',admins],['master-regular-count',regulars]]
    .forEach(([id,v])=>{ const el=document.getElementById(id); if(el) el.textContent=v; });
}

/* ══════════════════════════════════════
   LOGIN GATE
══════════════════════════════════════ */
function showGateMsg(msg,isError){
  const el=document.getElementById('gate-msg');
  el.style.background = isError?'var(--red-light)':'var(--green-light)';
  el.style.border     = isError?'1px solid var(--red-border)':'1px solid #a8d080';
  el.style.color      = isError?'var(--red)':'var(--green)';
  el.textContent=msg; el.style.display='block';
  if(!isError) setTimeout(()=>{ el.style.display='none'; },3000);
}

function switchGateAuth(t){
  const isLogin=t==='login';
  const tl=document.getElementById('gatab-login'), tr=document.getElementById('gatab-reg');
  tl.style.background=isLogin?'var(--blue)':'transparent'; tl.style.color=isLogin?'#fff':'var(--text-secondary)';
  tr.style.background=isLogin?'transparent':'var(--blue)'; tr.style.color=isLogin?'var(--text-secondary)':'#fff';
  const msg=document.getElementById('gate-msg'); if(msg) msg.style.display='none';
  const hint=document.getElementById('gate-switch-hint');
  if(isLogin){
    document.getElementById('gate-form').innerHTML=`
      <div class="field"><div class="flabel">メールアドレス</div><input class="finput" id="g-email" type="text" placeholder="example@email.com"></div>
      <div class="field" style="margin-bottom:6px"><div class="flabel">パスワード</div>
        <div class="pass-wrap"><input class="finput" id="g-pass" type="password" placeholder="••••••••">
        <button class="eye-btn" id="g-eye" type="button" onclick="toggleGateEye()"><i class="ti ti-eye"></i></button></div>
      </div>
      <div style="text-align:right;font-size:11px;color:var(--blue);cursor:pointer;margin-bottom:20px">パスワードをお忘れですか？</div>
      <button class="btn btn-p" type="button" onclick="gateLogin()" style="width:100%;padding:12px;font-size:14px;justify-content:center;border-radius:var(--radius-md)">
        ログイン <i class="ti ti-arrow-right"></i></button>`;
    hint.innerHTML='アカウントをお持ちでない方は <a style="color:var(--blue);cursor:pointer;font-weight:500" onclick="switchGateAuth(\'reg\')">新規登録</a>';
  } else {
    document.getElementById('gate-form').innerHTML=`
      <div class="field"><div class="flabel">お名前 <span class="req">*</span></div><input class="finput" id="g-name" placeholder="田中 太郎"></div>
      <div class="field"><div class="flabel">メールアドレス <span class="req">*</span></div><input class="finput" id="g-email" type="text" placeholder="example@email.com"></div>
      <div class="field" style="margin-bottom:6px"><div class="flabel">パスワード <span class="req">*</span>（6文字以上）</div>
        <div class="pass-wrap"><input class="finput" id="g-pass" type="password" placeholder="6文字以上">
        <button class="eye-btn" id="g-eye" type="button" onclick="toggleGateEye()"><i class="ti ti-eye"></i></button></div>
        <div class="str-bar" style="margin-top:6px"><div class="str-seg" id="gs1"></div><div class="str-seg" id="gs2"></div><div class="str-seg" id="gs3"></div><div class="str-seg" id="gs4"></div></div>
      </div>
      <button class="btn btn-p" type="button" onclick="gateRegister()" style="width:100%;padding:12px;font-size:14px;justify-content:center;border-radius:var(--radius-md);margin-top:14px">
        <i class="ti ti-user-plus"></i> 会員登録する</button>`;
    hint.innerHTML='すでにアカウントをお持ちの方は <a style="color:var(--blue);cursor:pointer;font-weight:500" onclick="switchGateAuth(\'login\')">ログイン</a>';
    document.getElementById('g-pass').addEventListener('input',function(){
      const v=this.value,segs=[document.getElementById('gs1'),document.getElementById('gs2'),document.getElementById('gs3'),document.getElementById('gs4')];
      segs.forEach(s=>{s.className='str-seg';});
      if(v.length>=2) segs[0].className='str-seg weak';
      if(v.length>=4) segs[1].className='str-seg weak';
      if(v.length>=6){segs[0].className='str-seg mid';segs[1].className='str-seg mid';segs[2].className='str-seg mid';}
      if(v.length>=10&&/[A-Z]/.test(v)) segs.forEach(s=>s.className='str-seg strong');
    });
  }
}

function toggleGateEye(){
  const inp=document.getElementById('g-pass'),btn=document.getElementById('g-eye');
  inp.type=inp.type==='password'?'text':'password';
  btn.innerHTML=inp.type==='text'?'<i class="ti ti-eye-off"></i>':'<i class="ti ti-eye"></i>';
}

function gateLogin(){
  const email=(document.getElementById('g-email')||{}).value?.trim()||'';
  const pass =(document.getElementById('g-pass') ||{}).value||'';
  if(!email||!pass){showGateMsg('メールアドレスとパスワードを入力してください',true);return;}
  const user=userStore.find(u=>u.email===email&&u.password===pass);
  if(!user){showGateMsg('メールアドレスまたはパスワードが違います',true);return;}
  if(!user.active){showGateMsg('このアカウントは停止されています',true);return;}
  isLoggedIn=true; currentUser=user;
  document.getElementById('login-gate').classList.add('hidden');
  applyRoleUI();
  if(isMaster()){ renderMasterUserTable(); renderRoleTable(); showScreen('master'); }
  else showScreen('top');
}

function gateRegister(){
  const name =(document.getElementById('g-name') ||{}).value?.trim()||'';
  const email=(document.getElementById('g-email')||{}).value?.trim()||'';
  const pass =(document.getElementById('g-pass') ||{}).value||'';
  if(!name) {showGateMsg('お名前を入力してください',true);return;}
  if(!email){showGateMsg('メールアドレスを入力してください',true);return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showGateMsg('正しいメールアドレスを入力してください',true);return;}
  if(pass.length<6){showGateMsg('パスワードは6文字以上で入力してください',true);return;}
  if(userStore.find(u=>u.email===email)){showGateMsg('このメールアドレスはすでに登録されています',true);return;}
  userStore.push({name,email,password:pass,role:'user',active:true,photoURL:null});
  showGateMsg('登録完了！ログインしてください',false);
  setTimeout(()=>switchGateAuth('login'),1200);
}

function doLogout(){
  isLoggedIn=false; currentUser=null;
  switchGateAuth('login');
  document.getElementById('login-gate').classList.remove('hidden');
  window.scrollTo(0,0);
}

/* ══════════════════════════════════════
   コード入力（一般→管理者昇格）
══════════════════════════════════════ */
function submitCode(){
  const code=(document.getElementById('code-input')||{}).value?.trim()||'';
  const msgEl=document.getElementById('code-msg');
  const ok=code===ADMIN_CODE;
  msgEl.style.cssText=`display:block;background:var(--${ok?'green':'red'}-light);border:1px solid ${ok?'#a8d080':'var(--red-border)'};color:var(--${ok?'green':'red'});border-radius:var(--radius-md);padding:9px 13px;font-size:13px;margin-bottom:14px`;
  if(ok){
    currentUser.role='admin';
    const stored=userStore.find(u=>u.email===currentUser.email); if(stored) stored.role='admin';
    msgEl.textContent='✓ 管理者として認証されました！管理者タブが追加されました。';
    applyRoleUI();
    setTimeout(()=>{msgEl.style.display='none';document.getElementById('code-input').value='';},3000);
  } else {
    msgEl.textContent='コードが正しくありません。';
    setTimeout(()=>{msgEl.style.display='none';},3000);
  }
}

/* ══════════════════════════════════════
   プロフィール保存・アバター写真
══════════════════════════════════════ */
function saveProfile(){
  const sei=(document.getElementById('prof-sei')||{}).value?.trim()||'';
  const mei=(document.getElementById('prof-mei')||{}).value?.trim()||'';
  const newName=(sei+' '+mei).trim()||currentUser.name;
  currentUser.name=newName;
  const stored=userStore.find(u=>u.email===currentUser.email); if(stored) stored.name=newName;
  document.getElementById('mp-name').textContent=newName;
  updateAvatarDisplay();
  const msg=document.getElementById('prof-save-msg');
  if(msg){ msg.style.display='block'; setTimeout(()=>msg.style.display='none',2500); }
}

function handleAvatarUpload(input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(e)=>{
    const url=e.target.result;
    currentUser.photoURL=url;
    const stored=userStore.find(u=>u.email===currentUser.email); if(stored) stored.photoURL=url;
    updateAvatarDisplay();
  };
  reader.readAsDataURL(file);
}

/* ══════════════════════════════════════
   ADMIN: USER TABLE
══════════════════════════════════════ */
function renderUserTable(){
  const q=(document.getElementById('user-search')||{}).value?.toLowerCase()||'';
  const f=(document.getElementById('user-filter')||{}).value||'';
  const tbody=document.getElementById('user-table-body'); if(!tbody) return;
  const list=userStore.filter(u=>u.role!=='master')
    .filter(u=>!q||(u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)))
    .filter(u=>!f||u.role===f);
  tbody.innerHTML=list.map(u=>`
    <div class="admin-table-row" style="grid-template-columns:1.5fr 2fr 1fr 1fr 1fr">
      <span style="font-weight:500">${u.name}</span>
      <span style="color:var(--text-secondary);font-size:11px">${u.email}</span>
      <span>${roleLabel(u.role)}</span>
      <span><span class="tag ${u.active?'tg':'tr'}" style="font-size:9px">${u.active?'有効':'停止'}</span></span>
      <span style="display:flex;gap:4px">
        <button class="btn btn-sm" style="font-size:10px;padding:3px 8px" title="削除" onclick="deleteUser('${u.email}')"><i class="ti ti-trash" style="color:var(--red)"></i></button>
      </span>
    </div>`).join('')||'<div style="padding:14px;font-size:13px;color:var(--text-secondary);text-align:center">該当するユーザーはいません</div>';
}

function deleteUser(email){
  if(email===MASTER_EMAIL){alert('マスターアカウントは削除できません');return;}
  if(email===currentUser?.email){alert('自分自身は削除できません');return;}
  const idx=userStore.findIndex(u=>u.email===email);
  if(idx>-1) userStore.splice(idx,1);
  renderUserTable(); renderMasterUserTable(); renderRoleTable(); refreshStats();
}

/* ══════════════════════════════════════
   MASTER: USER TABLE
══════════════════════════════════════ */
function renderMasterUserTable(){
  const q=(document.getElementById('master-search')||{}).value?.toLowerCase()||'';
  const f=(document.getElementById('master-filter')||{}).value||'';
  const tbody=document.getElementById('master-user-table-body'); if(!tbody) return;
  const list=userStore
    .filter(u=>!q||(u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)))
    .filter(u=>!f||u.role===f);
  tbody.innerHTML=list.map(u=>`
    <div class="admin-table-row" style="grid-template-columns:1.5fr 2fr 1fr 1fr 1fr">
      <span style="font-weight:500">${u.name}${u.email===MASTER_EMAIL?' <span class="master-badge" style="font-size:9px"><i class="ti ti-crown" style="font-size:9px"></i></span>':''}</span>
      <span style="color:var(--text-secondary);font-size:11px">${u.email}</span>
      <span>${roleLabel(u.role)}</span>
      <span><span class="tag ${u.active?'tg':'tr'}" style="font-size:9px">${u.active?'有効':'停止'}</span></span>
      <span style="display:flex;gap:4px">
        ${u.role!=='master'?`<button class="btn btn-sm" style="font-size:10px;padding:3px 8px" onclick="quickToggleActive('${u.email}')">${u.active?'<i class="ti ti-ban" style="color:var(--warn)"></i>':'<i class="ti ti-check" style="color:var(--green)"></i>'}</button>`:'' }
        ${u.email!==MASTER_EMAIL?`<button class="btn btn-sm" style="font-size:10px;padding:3px 8px" onclick="deleteUser('${u.email}')"><i class="ti ti-trash" style="color:var(--red)"></i></button>`:'' }
      </span>
    </div>`).join('')||'<div style="padding:14px;font-size:13px;color:var(--text-secondary);text-align:center">該当するユーザーはいません</div>';
}

function quickToggleActive(email){
  const u=userStore.find(u=>u.email===email); if(!u) return;
  u.active=!u.active;
  renderMasterUserTable(); renderUserTable(); renderRoleTable(); refreshStats();
}

/* ══════════════════════════════════════
   MASTER: ROLE CHANGE
══════════════════════════════════════ */
function renderRoleTable(){
  const tbody=document.getElementById('role-table-body'); if(!tbody) return;
  tbody.innerHTML=userStore.filter(u=>u.role!=='master').map(u=>`
    <div class="admin-table-row" style="grid-template-columns:1.5fr 2fr 1fr 1fr">
      <span style="font-weight:500">${u.name}</span>
      <span style="color:var(--text-secondary);font-size:11px">${u.email}</span>
      <span id="role-tag-${u.email.replace(/[@.]/g,'_')}">${roleLabel(u.role)}</span>
      <span>
        <select class="finput" style="padding:4px 8px;font-size:11px;width:auto" onchange="quickSetRole('${u.email}',this.value)">
          <option value="user" ${u.role==='user'?'selected':''}>一般</option>
          <option value="admin" ${u.role==='admin'?'selected':''}>管理者</option>
        </select>
      </span>
    </div>`).join('');
}

function changeUserRole(){
  const email=(document.getElementById('role-target-email')||{}).value?.trim()||'';
  const role=document.getElementById('role-select').value;
  const msgEl=document.getElementById('role-msg');
  const u=userStore.find(u=>u.email===email);
  const showMsg=(msg,ok)=>{
    msgEl.style.cssText=`display:block;background:var(--${ok?'green':'red'}-light);border:1px solid ${ok?'#a8d080':'var(--red-border)'};color:var(--${ok?'green':'red'});border-radius:var(--radius-md);padding:9px 13px;font-size:13px;margin-bottom:14px`;
    msgEl.textContent=msg; setTimeout(()=>msgEl.style.display='none',3000);
  };
  if(!u){ showMsg('該当するユーザーが見つかりません',false); return; }
  if(u.role==='master'){ showMsg('マスターアカウントのロールは変更できません',false); return; }
  u.role=role;
  showMsg(`${u.name} のロールを「${role==='admin'?'管理者':'一般ユーザー'}」に変更しました`,true);
  renderRoleTable(); renderMasterUserTable(); renderUserTable(); refreshStats();
}

function quickSetRole(email,role){
  const u=userStore.find(u=>u.email===email); if(!u||u.role==='master') return;
  u.role=role;
  renderRoleTable(); renderMasterUserTable(); renderUserTable(); refreshStats();
}

/* ══════════════════════════════════════
   SCREEN NAVIGATION
══════════════════════════════════════ */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('s-'+id).classList.add('active');
  const tabEl=document.getElementById('tab-'+id); if(tabEl) tabEl.classList.add('active');
  window.scrollTo(0,0);
}

function guardedScreen(id){
  if(!isLoggedIn){ document.getElementById('login-gate').classList.remove('hidden'); return; }
  if(id==='admin'&&!isAdmin()){ alert('管理者権限が必要です'); return; }
  if(id==='master'&&!isMaster()){ alert('マスター権限が必要です'); return; }
  if(id==='admin') renderUserTable();
  if(id==='master'){ renderMasterUserTable(); renderRoleTable(); }
  showScreen(id);
  if(id==='map') setTimeout(initLeafletMap, 80);
}

/* ══════════════════════════════════════
   LEAFLET MAP
══════════════════════════════════════ */
function initLeafletMap(){
  if(leafletMap) { leafletMap.invalidateSize(); return; }
  const el=document.getElementById('leaf-map'); if(!el) return;
  if(typeof L === 'undefined') { el.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:13px">地図を読み込めませんでした(Leaflet未読み込み)</div>'; return; }

  leafletMap=L.map('leaf-map').setView([35.6762,139.6503],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom:18,
  }).addTo(leafletMap);

  /* 既存物件のピンを追加 */
  PROPS.forEach(p=>{ if(p.lat&&p.lng) addMapMarker(p); });
  renderMapSidebar();
}

function addMapMarker(prop){
  if(!leafletMap||!prop.lat||!prop.lng) return;
  if(mapMarkers[prop.id]){ mapMarkers[prop.id].remove(); }
  const tags=(Array.isArray(prop.tags)?prop.tags:(prop.tags?String(prop.tags).split(','):[])).map(t=>`<span style="background:#e6f1fb;color:#185fa5;border-radius:4px;padding:1px 5px;font-size:10px">${t}</span>`).join(' ');
  const photoHTML=prop.photoURL?`<img src="${prop.photoURL}" style="width:100%;height:64px;object-fit:cover;border-radius:4px;margin-bottom:6px">`:'' ;
  const marker=L.marker([prop.lat,prop.lng])
    .addTo(leafletMap)
    .bindPopup(`<div style="min-width:180px;font-family:-apple-system,sans-serif">
      ${photoHTML}
      <div style="font-size:13px;font-weight:600;margin-bottom:3px;color:#0f1923">${prop.name}</div>
      <div style="font-size:12px;color:#185fa5;font-weight:500;margin-bottom:4px">¥${Number(prop.price).toLocaleString()}/月</div>
      <div style="font-size:11px;color:#6b7685;margin-bottom:4px">${prop.madori} ／ ${prop.size}㎡ ／ ${prop.station||''}</div>
      <div style="font-size:10px;color:#6b7685;margin-bottom:6px">${prop.address||''}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${tags}</div>
    </div>`,{maxWidth:220});
  mapMarkers[prop.id]=marker;
}

function removeMapMarker(id){
  if(mapMarkers[id]){ mapMarkers[id].remove(); delete mapMarkers[id]; }
}

function renderMapSidebar(){
  const container=document.getElementById('map-results'); if(!container) return;
  container.innerHTML=PROPS.map((p,i)=>`
    <div class="result-item${i===0?' on':''}" onclick="focusMapPin(${p.id})">
      <div style="font-size:12px;font-weight:500">${p.name}</div>
      <div style="font-size:11px;color:var(--text-secondary);margin:2px 0">¥${Number(p.price).toLocaleString()} / ${p.madori}</div>
      <span class="tag tb" style="font-size:9px">VR対応</span>
    </div>`).join('');
  const cnt=document.getElementById('map-count'); if(cnt) cnt.textContent=PROPS.length+'件';
}

function focusMapPin(id){
  const p=PROPS.find(p=>p.id===id); if(!p||!p.lat||!p.lng) return;
  if(leafletMap){ leafletMap.setView([p.lat,p.lng],15); if(mapMarkers[id]) mapMarkers[id].openPopup(); }
}

/* ══════════════════════════════════════
   ADDRESS → LAT/LNG (Nominatim)
══════════════════════════════════════ */
async function geocodeAddress(address){
  try{
    const url='https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(address)+'&limit=1&accept-language=ja';
    const res=await fetch(url,{headers:{'User-Agent':'VRHomes/1.0'}});
    const data=await res.json();
    if(data.length>0) return {lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)};
  }catch(e){ console.warn('geocode failed:',e); }
  return null;
}

/* ══════════════════════════════════════
   AWS POST
══════════════════════════════════════ */
async function uploadToAWS(prop){
  if(!AWS_API_URL) return;
  try{
    const body={...prop}; delete body.photoURL; delete body.floorplanURL;
    const res=await fetch(AWS_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(res.ok){ console.log('AWS upload success'); showDataSourceBadge('AWS'); }
    else throw new Error('status '+res.status);
  }catch(e){ console.warn('AWS upload failed:',e); }
}

/* ══════════════════════════════════════
   PROPERTY DATA
══════════════════════════════════════ */
async function fetchAndRenderProps(){
  const grid=document.getElementById('card-grid');
  grid.innerHTML=`<div style="grid-column:1/-1;padding:40px 0;text-align:center;color:var(--text-secondary)">
    <i class="ti ti-loader-2" style="font-size:24px;animation:spin 1s linear infinite;display:inline-block"></i>
    <div style="margin-top:10px;font-size:13px">物件情報を読み込み中…</div></div>`;
  try{
    if(AWS_API_URL){
      const res=await fetch(AWS_API_URL,{method:'GET',headers:{'Content-Type':'application/json'}});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      PROPS=Array.isArray(data)?data:(data.items||data.properties||[]);
      showDataSourceBadge('AWS');
    }else{
      await new Promise(r=>setTimeout(r,300));
      PROPS=[...LOCAL_PROPS];
      showDataSourceBadge('local');
    }
  }catch(e){
    console.warn('AWS fetch failed:',e);
    PROPS=[...LOCAL_PROPS];
    showDataSourceBadge('error');
  }
  renderCards(); renderAdminPropTable();
  const resultSpan=document.querySelector('.results-bar span');
  if(resultSpan) resultSpan.innerHTML=`<strong style="color:var(--text-primary)">${PROPS.length}</strong> 件の物件`;
}

function showDataSourceBadge(source){
  let badge=document.getElementById('data-source-badge');
  if(!badge){
    badge=document.createElement('div'); badge.id='data-source-badge';
    badge.style.cssText='display:flex;align-items:center;gap:6px;font-size:11px;padding:4px 10px;border-radius:20px;margin-left:8px';
    const bar=document.querySelector('.results-bar .nav-r')||document.querySelector('.results-bar > div:last-child');
    if(bar) bar.prepend(badge);
  }
  if(source==='AWS'){ badge.style.background='var(--green-light)'; badge.style.color='var(--green)'; badge.style.border='1px solid #a8d080'; badge.innerHTML='<i class="ti ti-cloud-check"></i>AWS同期済み'; }
  else if(source==='error'){ badge.style.background='var(--warn-light)'; badge.style.color='var(--warn)'; badge.style.border='1px solid #f0c070'; badge.innerHTML='<i class="ti ti-cloud-off"></i>ローカルデータ（AWS接続エラー）'; }
  else{ badge.style.background='var(--bg-secondary)'; badge.style.color='var(--text-secondary)'; badge.style.border='1px solid var(--border)'; badge.innerHTML='<i class="ti ti-database"></i>ローカルデータ'; }
}

function renderCards(){
  const grid=document.getElementById('card-grid');
  if(!PROPS.length){
    grid.innerHTML='<div style="grid-column:1/-1;padding:40px 0;text-align:center;color:var(--text-secondary);font-size:13px"><i class="ti ti-building-off" style="font-size:28px;display:block;margin-bottom:8px"></i>物件が見つかりませんでした</div>';
    return;
  }
  grid.innerHTML=PROPS.map(p=>{
    const fav=favs.has(p.id);
    const tags=Array.isArray(p.tags)?p.tags:(p.tags?String(p.tags).split(','):[]);
    const photoStyle=p.photoURL?`background-image:url(${p.photoURL});background-size:cover;background-position:center;`:'';
    return `<div class="prop-card">
      <div class="prop-img" style="${photoStyle}">
        ${!p.photoURL?'<i class="ti ti-building" style="font-size:30px;color:#85B7EB"></i>':''}
        <div class="fav-btn${fav?' on':''}" onclick="toggleFav(${JSON.stringify(p.id)},this)"><i class="ti ti-heart"></i></div>
      </div>
      <div class="prop-body">
        <div class="prop-price">¥${Number(p.price).toLocaleString()}<span style="font-size:11px;font-weight:400;color:var(--text-secondary)">/月</span></div>
        <div class="prop-name">${p.name}</div>
        <div class="prop-loc"><i class="ti ti-map-pin"></i>${p.station||p.area||''}</div>
        <div class="prop-tags"><span class="tag tg">${p.madori||p.layout||''}</span>${tags.map(t=>`<span class="tag tgr">${t}</span>`).join('')}</div>
      </div>
      <div class="prop-footer"><span class="prop-area">${p.size||p.area_sqm||'−'}㎡</span></div>
    </div>`;
  }).join('');
}

function renderAdminPropTable(){
  const tbody=document.getElementById('prop-table-body'); if(!tbody) return;
  tbody.innerHTML=PROPS.map(p=>`
    <div class="admin-table-row" style="grid-template-columns:2fr 1fr 1fr 90px">
      <span style="font-weight:500">${p.name}${p.floorplanURL?'<i class="ti ti-photo" style="color:var(--blue);font-size:12px;margin-left:4px" title="間取り図あり"></i>':''}</span>
      <span style="color:var(--text-secondary)">${p.area}</span>
      <span>¥${Number(p.price).toLocaleString()}</span>
      <span style="display:flex;gap:5px">
        <button class="btn btn-sm" style="font-size:10px;padding:3px 8px"><i class="ti ti-edit"></i></button>
        <button class="btn btn-sm" style="font-size:10px;padding:3px 8px;color:var(--red);border-color:var(--red-border)" onclick="deleteProp(${p.id})"><i class="ti ti-trash"></i></button>
      </span>
    </div>`).join('');
}

function deleteProp(id){
  PROPS=PROPS.filter(p=>p.id!==id);
  removeMapMarker(id);
  renderCards(); renderAdminPropTable(); renderMapSidebar();
  const resultSpan=document.querySelector('.results-bar span');
  if(resultSpan) resultSpan.innerHTML=`<strong style="color:var(--text-primary)">${PROPS.length}</strong> 件の物件`;
}

function startPolling(){
  if(!AWS_API_URL) return;
  setInterval(async()=>{
    try{
      const res=await fetch(AWS_API_URL,{headers:{'Content-Type':'application/json'}});
      if(!res.ok) return;
      const data=await res.json();
      const newProps=Array.isArray(data)?data:(data.items||data.properties||[]);
      if(newProps.length!==PROPS.length){
        PROPS=newProps; renderCards(); renderAdminPropTable();
        const resultSpan=document.querySelector('.results-bar span');
        if(resultSpan) resultSpan.innerHTML=`<strong style="color:var(--text-primary)">${PROPS.length}</strong> 件の物件`;
        showDataSourceBadge('AWS');
      }
    }catch(_){}
  },30000);
}

/* ── ファイル→DataURL ── */
function readFileAsDataURL(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>resolve(e.target.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════
   ADMIN: ADD PROPERTY（完全動作版）
══════════════════════════════════════ */
function toggleAddForm(){
  const f=document.getElementById('add-form');
  f.style.display=f.style.display==='block'?'none':'block';
}

async function addProperty(){
  const name   = (document.getElementById('af-name')   .value||'').trim()||'新規物件';
  const area   = (document.getElementById('af-area')   .value||'').trim()||'−';
  const rent   = parseInt(document.getElementById('af-rent')  .value)||0;
  const madori = document.getElementById('af-madori').value;
  const size   = parseFloat(document.getElementById('af-size')   .value)||0;
  const station= (document.getElementById('af-station').value||'').trim();
  const address= (document.getElementById('af-address').value||'').trim();
  const photoFile = document.getElementById('af-photo').files[0];

  let photoURL=null;
  if(photoFile) photoURL=await readFileAsDataURL(photoFile);

  const newProp={
    id:nextPropId++, name, area, address, station,
    price:rent, size, madori,
    tags:[], photoURL, floorplanURL:window.mctAttachedDataURL||null,
    lat:null, lng:null,
  };

  /* PROPS配列に追加 */
  PROPS.push(newProp);

  /* TOP カードを更新 */
  renderCards();
  renderAdminPropTable();
  const resultSpan=document.querySelector('.results-bar span');
  if(resultSpan) resultSpan.innerHTML=`<strong style="color:var(--text-primary)">${PROPS.length}</strong> 件の物件`;

  /* マップサイドバー更新 */
  renderMapSidebar();

  /* ジオコーディング → マップにピン追加 */
  if(address){
    const addr=address||area+'東京都';
    geocodeAddress(addr).then(coords=>{
      if(coords){
        newProp.lat=coords.lat; newProp.lng=coords.lng;
        addMapMarker(newProp);
      }
    });
  }

  /* AWS POST */
  uploadToAWS(newProp);

  /* フォームリセット */
  ['af-name','af-area','af-rent','af-size','af-station','af-address'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('af-photo').value='';
  document.getElementById('af-madori').selectedIndex=0;
  if(window.mctClearAttachment) window.mctClearAttachment();

  toggleAddForm();
}

/* ══════════════════════════════════════
   MISC
══════════════════════════════════════ */
const _style=document.createElement('style');
_style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
document.head.appendChild(_style);

function toggleFav(id,el){if(favs.has(id)){favs.delete(id);el.classList.remove('on');}else{favs.add(id);el.classList.add('on');}}
function togglePin(id){['pa','pb','pc'].forEach(p=>{const el=document.getElementById(p);if(p===id){el.classList.toggle('show');}else{el.classList.remove('show');}});}

function switchMp(id,el){
  ['fav','hist','prof','code'].forEach(k=>document.getElementById('mp-'+k).style.display=k===id?'block':'none');
  document.querySelectorAll('.mp-nav-item').forEach(i=>i.classList.remove('on'));
  el.classList.add('on');
}
function switchAdmin(id,el){
  ['props','users','stats'].forEach(k=>document.getElementById('admin-'+k).style.display=k===id?'block':'none');
  document.querySelectorAll('.admin-nav-item').forEach(i=>i.classList.remove('on'));
  el.classList.add('on');
  if(id==='users') renderUserTable();
}
function switchMaster(id,el){
  ['users','roles'].forEach(k=>document.getElementById('master-'+k).style.display=k===id?'block':'none');
  document.querySelectorAll('.admin-nav-item').forEach(i=>i.classList.remove('on'));
  el.classList.add('on');
  if(id==='users') renderMasterUserTable();
  if(id==='roles') renderRoleTable();
}

/* 初回ロード */
fetchAndRenderProps();
startPolling();
