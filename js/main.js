import {createEngine} from './game-engine.js';
import {createUI} from './ui.js';
import {saveGame} from './save-system.js';
const root=document.getElementById('app');
if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('PWA service worker registration failed:',err)));
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();window.__pwaInstallEvent=event;});
window.addEventListener('appinstalled',()=>{window.__pwaInstallEvent=null;});
const showErr=(t,h)=>{root.innerHTML=`<section class="panel"><h2>${t}</h2>${h}</section>`};
async function boot(){
  if(location.protocol==='file:')return showErr('請用本地伺服器開啟','<p>瀏覽器不允許以 file:// 載入 JSON 與模組。</p><p>在專案資料夾執行：<code>python -m http.server 8000</code>，然後開啟 <code>http://localhost:8000</code>。或部署到 GitHub Pages。</p>');
  try{
    const names=['config','subjects','schools','events','careers'];
    const arr=await Promise.all(names.map(n=>fetch(`data/${n}.json`).then(r=>{if(!r.ok)throw new Error(n+'.json');return r.json()})));
    const data=Object.fromEntries(names.map((n,i)=>[n,arr[i]]));
    const seed=Number(new URLSearchParams(location.search).get('seed'))||undefined;
    const engine=createEngine(data,{save:s=>saveGame(s,localStorage)});
    createUI(root,engine,localStorage,{seed}).render();
  }catch(e){showErr('載入失敗','<p>'+String(e.message).replace(/</g,'&lt;')+'</p>')}
}
boot();
