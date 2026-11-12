import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
test('4.0.2：職涯頁提供目前職涯及最近升職分享入口',()=>{assert.match(ui,/data-act="shareCareer"/);assert.match(ui,/data-act="sharePromotion"/);});
test('4.0.2：人生總結提供分享圖片入口',()=>{assert.match(ui,/data-act="shareEnding"/);});
test('4.0.2：分享卡使用本機 Canvas PNG，支援 Web Share 及下載備援',()=>{assert.match(ui,/createElement\('canvas'\)/);assert.match(ui,/toBlob\(resolve,'image\/png'\)/);assert.match(ui,/navigator\.share/);assert.match(ui,/a\.download=filename/);});
test('4.0.2：Service Worker 版本更新以清除舊快取',()=>{const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/tls-4\.0\.3-completion-v1/);});
