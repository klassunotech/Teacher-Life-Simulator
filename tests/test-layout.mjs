import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
test('4.0.1：遊戲 HUD 設為頂部 sticky 並有足夠層級',()=>{
  assert.match(css,/\.hdr\.hud\s*\{[^}]*position\s*:\s*sticky/s);
  assert.match(css,/\.hdr\.hud\s*\{[^}]*top\s*:\s*0/s);
  assert.match(css,/\.hdr\.hud\s*\{[^}]*z-index\s*:\s*30/s);
});
test('4.0.1：桌面主欄取消錯誤 max-width 置中並填滿可用欄位',()=>{
  assert.match(css,/@media\s*\(min-width:\s*721px\)[\s\S]*?\.shell>main\s*\{[^}]*max-width\s*:\s*none[^}]*margin\s*:\s*0/s);
});
test('4.0.1：手機版 HUD 明確 sticky，並避開橫向 hidden 造成的捲動祖先',()=>{
  assert.match(css,/@media\s*\(max-width:\s*720px\)[\s\S]*?\.hdr\.hud\s*\{[^}]*position\s*:\s*sticky[^}]*top\s*:\s*0/s);
  assert.match(css,/html,body\s*\{overflow-x:\s*clip;overflow-y:\s*visible\}/);
  assert.match(css,/env\(safe-area-inset-top\)/);
});
test('4.0.1：手機版仍保留底部導航',()=>{
  assert.match(css,/@media\s*\(max-width:\s*720px\)[\s\S]*?\.nav\s*\{[^}]*position\s*:\s*fixed[^}]*bottom\s*:\s*0/s);
});
test('4.0.2：畫面版本同步',()=>{
  assert.match(html,/Teacher Life Simulator 4\.0\.3|香港教師生涯模擬器 4\.0\.3/);
  assert.match(ui,/Teacher Life Simulator · 4\.0\.3/);
});
