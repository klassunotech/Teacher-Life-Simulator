# 真實瀏覽器測試（Playwright + Chromium）。需先啟動靜態伺服器：python3 -m http.server 8123
# 用法：python3 tools/browser-test.py   → 輸出 tools/out/browser-results.json 及 tools/out/screens/*.png
import json,os,sys
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TLS_URL','http://localhost:8123/index.html')
HERE=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(HERE,'out');os.makedirs(os.path.join(OUT,'screens'),exist_ok=True)
FIX=os.path.join(HERE,'..','tests','fixtures','save-3.0.x-sport-path.json')
VIEWPORTS={'desktop':dict(viewport={'width':1280,'height':800}),'mobile':dict(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)}
results={}
def rec(vp,name,ok,detail=''):
    results.setdefault(vp,[]).append({'check':name,'ok':bool(ok),'detail':str(detail)[:300]});print(('PASS' if ok else 'FAIL'),vp,name,str(detail)[:140])
def save(pg):return pg.evaluate("()=>{try{return JSON.parse(localStorage.getItem('tls:autosave')).state}catch(e){return null}}")
def run(p,vp,opts):
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH'),args=['--no-sandbox']);ctx=b.new_context(**opts);pg=ctx.new_page();errs=[];bad=[]
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('requestfailed',lambda r:bad.append(r.url))
    pg.on('dialog',lambda d:d.accept())
    pg.goto(BASE);pg.wait_for_timeout(400)
    rec(vp,'載入頁面且標題含 3.4.2','3.4.2' in pg.title(),pg.title())
    # 橫向溢出檢查
    def overflow(label):
        r=pg.evaluate("()=>({sw:document.documentElement.scrollWidth,iw:window.innerWidth,over:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.career-path,.shell nav,pre,table,[style*=\"overflow\"]')}).slice(0,3).map(e=>e.tagName+'.'+e.className)})")
        rec(vp,f'無橫向溢出：{label}',r['sw']<=r['iw']+1,r)
    overflow('標題畫面')
    rec(vp,'PWA manifest 已連結',pg.locator('link[rel="manifest"]').count()==1)
    rec(vp,'PWA 安裝入口存在',pg.locator('[data-act="install"]').count()>=1)
    try:
        pg.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.getRegistration().then(r=>!!r)",timeout=6000)
        reg=pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>({scope:r.scope,active:!!r.active}))")
        rec(vp,'Service Worker 已註冊',reg.get('active') is True,reg)
    except Exception as ex: rec(vp,'Service Worker 已註冊',False,str(ex))
    pg.click('[data-act="new"]');pg.click('[data-act="story"]');pg.wait_for_timeout(150)
    rec(vp,'建立角色頁有難度／年資／聘用方式選項',pg.locator('[data-f="difficulty"] option').count()==3 and pg.locator('[data-f="experienceYears"]').count()==1 and pg.locator('[data-f="employmentType"] option').count()==2,pg.eval_on_selector_all('[data-f="employmentType"] option','o=>o.map(x=>x.value)'))
    overflow('建立角色')
    pg.fill('[data-f="name"]','瀏覽器測試');pg.fill('[data-f="experienceYears"]','2');pg.select_option('[data-f="employmentType"]','contract');pg.select_option('[data-f="difficulty"]','hard');pg.click('[data-act="toschool"]');pg.wait_for_timeout(150)
    # 選校篩選：資助學校，揀第 2 張卡
    pg.select_option('[data-school-filter="type"]','aided');pg.wait_for_timeout(150)
    cards=pg.locator('[data-act="pick"]');n=cards.count();names=pg.eval_on_selector_all('.school h3','e=>e.map(x=>x.textContent)')
    types=pg.eval_on_selector_all('.school','els=>els.map(e=>e.innerText)');rec(vp,'選校：篩選資助後 16 張卡全部標示為資助學校',n==16 and all('資助' in t for t in types),f'{n} 張卡；標示資助：{sum("資助" in t for t in types)}')
    overflow('選校頁')
    pg.locator('[data-act="pick"]').nth(1).click();pg.wait_for_timeout(400);s=save(pg)
    rec(vp,'選校：點擊第 2 張卡入到資助學校（真實瀏覽器）',s and s['school']['type']=='aided' and s['school']['name']==names[1],(s or {}).get('school',{}).get('name'))
    rec(vp,'難度「困難」已寫入存檔',s and s['meta']['difficulty']=='hard',(s or {}).get('meta',{}).get('difficulty'))
    rec(vp,'存檔版本 3.4.2',s and s['meta']['gameVersion']=='3.4.2')
    rec(vp,'Contract 聘用身份及兩年認可年資已保存',s and s['career']['employmentType']=='contract' and s['character']['careerMonths']==24 and s['career']['contractEndTurn'] in [12,24,36] and s['career']['contractMonths']==s['career']['contractEndTurn'],(s or {}).get('career',{}).get('employmentType'))
    pg.click('[data-act="tab"][data-tab="career"]');pg.wait_for_timeout(120);salary_text=pg.inner_text('body');rec(vp,'職涯頁顯示 2026 MPS 薪點及 Contract',('MPS 第 17 點' in salary_text) and ('定期合約' in salary_text) and ('$39,490' in salary_text),'')
    # 各分頁溢出與觸控目標
    small=[]
    for tab in ['overview','actions','people','career','finance','log']:
        pg.click(f'[data-act="tab"][data-tab="{tab}"]');pg.wait_for_timeout(120);overflow('分頁 '+tab)
        sm=pg.evaluate("()=>[...document.querySelectorAll('button,.btn,select,input')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<36||r.width<36)}).map(e=>(e.dataset.act||e.tagName)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))")
        small+=[f'{tab}/{x}' for x in sm]
        pg.screenshot(path=os.path.join(OUT,'screens',f'{vp}-{tab}.png'))
    rec(vp,'觸控目標：可見按鈕／輸入框最小邊 ≥ 36px',len(small)==0,f'{len(small)} 個偏小：'+', '.join(sorted(set(small))[:8]))
    # AP ±1
    pg.click('[data-act="tab"][data-tab="actions"]')
    for d in ['1','1','1','-1']:pg.click(f'[data-act="ap"][data-k="teaching"][data-d="{d}"]');pg.wait_for_timeout(60)
    s=save(pg);rec(vp,'AP ±1 按鈕（+1+1+1−1 = 2）',s and s['ap']['allocation']['teaching']==2,(s or {}).get('ap',{}).get('allocation',{}).get('teaching'))
    rec(vp,'行動頁 -1／+1 按鈕存在',pg.locator('[data-act="ap"][data-d="-1"]').count()>0 and pg.locator('[data-act="ap"][data-d="1"]').count()>0)
    # 配置並結算
    for _ in range(9):pg.click('[data-act="ap"][data-k="teaching"][data-d="10"]') if False else None
    for k,times in [('teaching',3),('rest',3),('family',1)]:
        for _ in range(times):pg.click(f'[data-act="ap"][data-k="{k}"][data-d="10"]')
    pg.click('[data-act="settle"]');pg.wait_for_timeout(500)
    s=save(pg);rec(vp,'結算一個月後進入下一回合／事件',s and (s['date']['turn']>=1) ,(s or {}).get('date'))
    for _ in range(4):
        if pg.locator('[data-act="choose"]').count():pg.locator('[data-act="choose"]').first.click();pg.wait_for_timeout(500)
        elif pg.locator('[data-act="ack"]').count():pg.locator('[data-act="ack"]').first.click();pg.wait_for_timeout(300)
    overflow('事件後畫面')
    s=save(pg);rec(vp,'AP 分配沿用到下月（教學 32 + 休息 30 + 家庭 10）',s and s['phase']=='play' and s['ap']['allocation']['teaching']==32 and s['ap']['allocation']['rest']==30,(s or {}).get('ap',{}).get('allocation'))
    # 計時器倒數
    pg.click('[data-act="tab"][data-tab="overview"]')
    t1=pg.inner_text('header, .hud, .top') if pg.locator('header, .hud, .top').count() else pg.inner_text('body');pg.wait_for_timeout(2600);t2=pg.inner_text('header, .hud, .top') if pg.locator('header, .hud, .top').count() else pg.inner_text('body')
    rec(vp,'月份倒數正在更新',t1!=t2,'畫面文字於 2.6 秒內有變化')
    # 速度控制
    sp=pg.locator('[data-act="speed"]');rec(vp,'速度控制存在',sp.count()>=1,sp.count())
    if sp.count():sp.last.click();pg.wait_for_timeout(150);s=save(pg);rec(vp,'速度切換寫入存檔',s and s['timer']['speed']!=1,(s or {}).get('timer',{}).get('speed'))
    # 財務頁
    pg.click('[data-act="tab"][data-tab="finance"]');pg.wait_for_timeout(100)
    pg.click('[data-act="setLifestyle"][data-level="frugal"]');s=save(pg);rec(vp,'生活質素切換為節儉',s and s['finance']['lifestyle']=='frugal',(s or {}).get('finance',{}).get('lifestyle'))
    w0=s['character']['status']['wealth'];pg.click('[data-act="spendWealth"][data-kind="hobby"]');pg.wait_for_timeout(100);s=save(pg)
    rec(vp,'財富用途：個人興趣扣款並進入冷卻',s and s['character']['status']['wealth']<w0 and 'hobby' in s['finance']['cooldowns'],(w0,(s or {}).get('character',{}).get('status',{}).get('wealth')))
    pg.click('[data-act="fund"][data-amount="10000"]');pg.wait_for_timeout(100);s=save(pg);rec(vp,'退休儲備存入 10,000',s and s['finance']['fund']>=10000,(s or {}).get('finance',{}).get('fund'))
    # 職涯頁：八條路線
    pg.click('[data-act="tab"][data-tab="career"]');pg.wait_for_timeout(100)
    rec(vp,'職涯頁顯示八條路線按鈕',pg.locator('[data-act="path"]').count()==8,pg.locator('[data-act="path"]').count())
    txt=pg.inner_text('body');rec(vp,'職涯頁無體育／裁判專屬路線',('裁判' not in txt) and ('體育機構' not in txt),'')
    pg.click('[data-act="path"][data-path="study"]');pg.wait_for_timeout(100);s=save(pg)
    rec(vp,'切換路線：專業進修型',s and s['career']['path']=='study',(s or {}).get('career',{}).get('path'))
    pg.click('[data-act="path"][data-path="management"]');pg.wait_for_timeout(100);s2=save(pg)
    rec(vp,'路線切換冷卻生效（12 個月內不可再轉）',s2 and s2['career']['path']=='study',(s2 or {}).get('career',{}).get('path'))
    # 重新整理後繼續
    turn=save(pg)['date']['turn'];pg.reload();pg.wait_for_timeout(400)
    rec(vp,'重新整理後出現「繼續」',pg.locator('[data-act="continue"]').count()>0)
    pg.click('[data-act="continue"]');pg.wait_for_timeout(400);s=save(pg)
    rec(vp,'重新整理後資料保留（回合、路線、財務）',s and s['date']['turn']>=turn and s['career']['path']=='study' and s['finance']['lifestyle']=='frugal',(s or {}).get('date'))
    # 匯入舊版存檔
    pg.click('[data-act="tab"][data-tab="finance"]');pg.fill('[data-import-text]',open(FIX,encoding='utf-8').read());pg.click('[data-act="importSave"]');pg.wait_for_timeout(500);s=save(pg)
    rec(vp,'匯入 3.0.x 舊存檔：路線 sport→student、版本遷移、難度預設',s and s['career']['path']=='student' and s['meta']['gameVersion']=='3.4.2' and s['meta'].get('migratedFrom') and s['meta']['difficulty']=='balanced',json.dumps({k:(s or {}).get(k) for k in []}) or ((s or {}).get('career',{}).get('path'),(s or {}).get('meta')))
    pg.wait_for_timeout(300);pg.screenshot(path=os.path.join(OUT,'screens',f'{vp}-after-import.png'))
    rec(vp,'整個流程無 console／頁面錯誤',len(errs)==0,errs[:3])
    rec(vp,'無請求失敗（資源均可載入）',len(bad)==0,bad[:3])
    try:
        pg.reload();pg.wait_for_timeout(500)
        ctx.set_offline(True);pg.reload();pg.wait_for_timeout(600)
        rec(vp,'PWA 離線重新載入仍可開啟', '3.4.2' in pg.title(),pg.title())
        ctx.set_offline(False)
    except Exception as ex:
        rec(vp,'PWA 離線重新載入仍可開啟',False,str(ex))
        try:ctx.set_offline(False)
        except:pass
    b.close()
with sync_playwright() as p:
    for vp,opts in VIEWPORTS.items():
        try:run(p,vp,opts)
        except Exception as e:rec(vp,'測試流程例外',False,repr(e)[:280])
json.dump(results,open(os.path.join(OUT,'browser-results.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
tot=sum(len(v) for v in results.values());ok=sum(1 for v in results.values() for c in v if c['ok']);print(f'\nSUMMARY {ok}/{tot} passed');sys.exit(0 if ok==tot else 1)
