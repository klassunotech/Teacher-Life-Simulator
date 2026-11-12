// 純 UI 資產：以程式生成的原創像素畫（SVG rect，無外部圖片）
const PAL={H:'#3b2a20',S:'#f2c9a0',E:'#1a1c2c',M:'#b13e53',C:'#41a6f6',T:'#b13e53',P:'#333c57',B:'#1a1c2c'};
const BASE=['...HHHHHH...','..HHHHHHHH..','..HSSSSSSH..','..SSESSESS..','..SSSSSSSS..','...SSMMSS...','....SSSS....','..CCCCCCCC..','.CCCCTTCCCC.','.CCCCTTCCCC.','.SCCCCCCCCS.','..CCCCCCCC..','..PPPPPPPP..','..PPP..PPP..','..PPP..PPP..','..BBB..BBB..'];
function pix(rows,pal){let o='';rows.forEach((row,y)=>{let x=0;while(x<row.length){const ch=row[x];if(ch==='.'){x++;continue}let n=1;while(row[x+n]===ch)n++;o+=`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${pal[ch]}"/>`;x+=n}});
  return`<svg viewBox="0 0 12 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${o}</svg>`}
export function person(o={}){const g=BASE.map(r=>r.split(''));
  if(o.long)for(let y=3;y<=9;y++){if(g[y][1]==='.')g[y][1]='H';if(g[y][10]==='.')g[y][10]='H'}
  return pix(g.map(r=>r.join('')),{...PAL,...(o.pal||{})})}
export const hero=c=>person({long:c.gender==='女',pal:{C:'#f4f4f4',T:'#b13e53',P:'#29366f'}});
const NPC={principal:{name:'校長',pal:{H:'#aab',C:'#333c57',T:'#ffcd75',P:'#1a1c2c'}},director:{name:'教務主任',pal:{C:'#566c86',T:'#b13e53'}},
  parent:{name:'家長',long:true,pal:{H:'#7a4a2a',C:'#38b764',T:'#38b764'}},student:{name:'學生',pal:{H:'#1a1c2c',C:'#fff',T:'#41a6f6',P:'#29366f'}},
  colleague:{name:'同事',long:true,pal:{H:'#5d275d',C:'#b55088',T:'#b55088'}}};
const CAT={work:['classroom','student'],parent:['corridor','parent'],student:['playground','student'],admin:['principal','director'],career:['principal','principal'],
  health:['staffroom','colleague'],colleague:['staffroom','colleague'],professional:['staffroom','director'],family:['corridor','parent','家人'],personal:['corridor','parent']};
export const sceneFor=cat=>(CAT[cat]||CAT.work)[0];
export function npcFor(cat){const[,k,nm]=CAT[cat]||CAT.work;const n=NPC[k];return{name:nm||n.name,svg:person(n)}}
export const ACTION_SCENE={teaching:'classroom',administration:'principal',extracurricular:'playground',professional:'staffroom',family:'corridor',rest:'playground',personal:'corridor'};
const r=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const wrap=b=>`<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
const floor=(y,a,b)=>{let s=r(0,y,160,90-y,a);for(let y2=y;y2<90;y2+=6)s+=r(0,y2,160,1,b);return s};
const row=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join('');
export const SCENES={
classroom:{name:'課室',svg:()=>wrap(r(0,0,160,60,'#e8dcc0')+floor(60,'#9c6b3f','#7a5230')+r(28,8,104,32,'#7a5230')+r(31,11,98,26,'#2f5d3a')+r(36,16,40,1,'#dfe')+r(36,22,60,1,'#dfe')+r(36,28,30,1,'#dfe')+r(6,12,14,24,'#9bd1ff')+r(12,12,1,24,'#fff')+r(140,10,12,12,'#fff')+r(145,12,1,5,'#1a1c2c')+row(4,i=>r(14+i*36,62,22,5,'#b5793c')+r(16+i*36,67,2,8,'#7a5230')+r(32+i*36,67,2,8,'#7a5230')))},
staffroom:{name:'教員室',svg:()=>wrap(r(0,0,160,56,'#d9c7a0')+floor(56,'#6b8e9f','#566c86')+r(6,8,36,36,'#7a5230')+row(3,i=>r(8,12+i*11,32,2,'#a77b4a')+row(8,j=>r(9+j*4,2+12+i*11-2,3,6,['#b13e53','#41a6f6','#ffcd75','#38b764'][(i+j)%4]))).slice(0,0)+row(3,i=>r(8,19+i*11,32,2,'#a77b4a'))+r(60,6,40,26,'#9bd1ff')+r(79,6,2,26,'#fff')+r(60,18,40,2,'#fff')+r(110,56,44,6,'#b5793c')+r(112,62,3,14,'#7a5230')+r(150,62,3,14,'#7a5230')+r(120,44,18,12,'#333c57')+r(122,46,14,8,'#73eff7')+r(14,56,40,6,'#b5793c')+r(16,62,3,14,'#7a5230')+r(50,62,3,14,'#7a5230')+r(28,44,14,12,'#333c57')+r(30,46,10,8,'#73eff7')+r(144,40,8,10,'#38b764')+r(145,50,6,6,'#a0522d'))},
playground:{name:'操場',svg:()=>wrap(r(0,0,160,50,'#73c7ff')+r(120,6,12,12,'#ffcd75')+r(20,12,24,5,'#fff')+r(26,8,12,5,'#fff')+r(70,20,22,5,'#fff')+r(84,24,66,32,'#c96b4b')+r(84,22,66,3,'#8b4a35')+row(5,i=>row(2,j=>r(90+i*12,28+j*12,7,7,'#9bd1ff')))+r(114,46,10,10,'#7a5230')+r(0,56,160,34,'#5ea05a')+r(0,70,160,20,'#b5513a')+r(0,78,160,1,'#fff')+r(0,86,160,1,'#fff')+r(14,38,3,32,'#566c86')+r(14,34,16,10,'#fff')+r(20,38,5,1,'#b13e53')+r(26,44,5,1,'#ef7d57')+r(100,76,6,6,'#ef7d57'))},
principal:{name:'校長室',svg:()=>wrap(r(0,0,160,62,'#7a2f3a')+r(0,44,160,18,'#5b2230')+floor(62,'#3b2a20','#2a1c15')+r(14,8,22,16,'#fff')+r(14,8,22,2,'#b13e53')+r(14,12,22,2,'#41a6f6')+r(12,6,2,40,'#d9d9d9')+r(60,8,36,26,'#9bd1ff')+r(77,8,2,26,'#7a5230')+r(60,20,36,2,'#7a5230')+r(112,6,40,50,'#5b3a22')+row(4,i=>r(114,10+i*12,36,2,'#a77b4a')+row(8,j=>r(115+j*4,2+10+i*12-8,3,8,['#b13e53','#41a6f6','#ffcd75','#38b764','#fff'][(i+j)%5]))).slice(0,0)+r(40,56,80,10,'#8b5a2b')+r(44,66,6,14,'#5b3a22')+r(110,66,6,14,'#5b3a22')+r(72,52,16,4,'#ffcd75'))},
corridor:{name:'走廊',svg:()=>wrap(r(0,0,160,60,'#cfd8e3')+floor(60,'#b9a98c','#9c8c70')+row(8,i=>r(4+i*20,14,16,40,'#566c86')+r(4+i*20,14,16,2,'#3b5dc9')+r(10+i*20,30,4,2,'#ffcd75')+r(6+i*20,20,12,1,'#333c57')+r(6+i*20,36,12,1,'#333c57'))+r(0,56,160,4,'#7f8ea3')+row(8,i=>r(i*20,60,1,30,'#9c8c70')))}};
// MVP 0.3：擴充校園地點，全部以原創 SVG 像素場景生成，無外部素材依賴。
const extra={
 gate:{name:'學校正門',svg:()=>wrap(r(0,0,160,54,'#83c9f2')+r(0,54,160,36,'#6b9c58')+r(12,24,136,42,'#d8c8a5')+r(20,12,120,44,'#b9c9d8')+r(24,20,112,36,'#e7e2d1')+r(42,8,76,18,'#566c86')+r(48,12,64,8,'#ffcd75')+r(0,64,160,3,'#fff')+r(70,50,20,40,'#7a5230')+r(76,44,8,8,'#ffcd75'))},
 gym:{name:'體育館',svg:()=>wrap(r(0,0,160,58,'#d9e5ed')+floor(58,'#9a754d','#765537')+r(8,8,144,46,'#566c86')+r(12,12,136,38,'#d8e4e8')+r(20,20,120,26,'#b9d7e7')+r(78,12,3,42,'#fff')+r(12,48,136,2,'#ffcd75')+r(18,34,20,18,'#b13e53')+r(122,34,20,18,'#41a6f6'))},
 hall:{name:'學校禮堂',svg:()=>wrap(r(0,0,160,60,'#e9d7c3')+floor(60,'#765537','#5b402b')+r(8,8,144,48,'#8b4a52')+r(16,14,128,34,'#b13e53')+r(22,20,116,24,'#29366f')+r(40,26,80,3,'#ffcd75')+r(52,34,56,2,'#fff')+r(68,54,24,6,'#7a5230'))},
 computer:{name:'電腦室',svg:()=>wrap(r(0,0,160,58,'#d8e3ec')+floor(58,'#8a725d','#66513e')+row(4,i=>r(8+i*38,26,30,20,'#7a5230')+r(12+i*38,8,22,16,'#29366f')+r(14+i*38,10,18,12,'#73eff7')+r(16+i*38,28,14,2,'#ffcd75')+r(20+i*38,46,5,8,'#566c86'))+r(8,6,144,2,'#566c86'))},
 rest:{name:'教師休息區',svg:()=>wrap(r(0,0,160,58,'#e8dcc0')+floor(58,'#9c6b3f','#7a5230')+r(12,12,42,34,'#38b764')+r(18,18,30,22,'#d9e8d2')+r(72,34,72,18,'#b5793c')+r(76,52,4,12,'#7a5230')+r(136,52,4,12,'#7a5230')+r(92,10,24,18,'#9bd1ff')+r(102,10,2,18,'#fff'))}
};
Object.assign(SCENES,extra);
export const sceneSVG=id=>(SCENES[id]||SCENES.classroom).svg();
