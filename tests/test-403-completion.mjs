import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEngine} from '../js/game-engine.js';
const names=['config','subjects','schools','events','careers'];
const data=Object.fromEntries(names.map(n=>[n,JSON.parse(fs.readFileSync(new URL(`../data/${n}.json`,import.meta.url)))]));
const form={name:'4.0.3測試',age:29,experienceYears:0,gender:'男',education:'bachelor',qualification:'pgde',subject:data.subjects[0].id,family:'single',birthMonth:3,employmentType:'perm'};
const make=()=>{const e=createEngine(data);const school=e.rollSchools(20261111,{type:'aided'})[0];assert.equal(e.start({mode:'story',seed:20261111,form,school}).ok,true);return e;};
test('4.0.3 學生個案可按評估→支援計劃→檢討→結案完成生命周期',()=>{
 const e=make(),s=e.state,id='case-lifecycle';s.students.incidents.push({id,studentId:s.students.cohort[0].id,type:'high-risk-absence',turn:0,status:'monitoring',factors:['缺席']});
 assert.equal(e.studentCasework(id,'assess').ok,true);assert.equal(e.studentCasework(id,'plan').ok,true);assert.ok(s.students.incidents[0].supportPlan);assert.equal(e.studentCasework(id,'review').ok,true);assert.equal(e.studentCasework(id,'close').ok,true);assert.equal(s.students.incidents[0].status,'closed');assert.equal(s.administration.auditTrail.length,4);
});
test('4.0.3 行政個案須經索取、核對、批核及歸檔',()=>{
 const e=make(),s=e.state;s.administration.cases.push({id:'admin-flow',type:'procurement',status:'open',notes:[]});
 assert.equal(e.advanceAdminCase('admin-flow','complete').ok,false);assert.equal(e.advanceAdminCase('admin-flow','request').ok,true);assert.equal(e.advanceAdminCase('admin-flow','verify').ok,true);assert.equal(e.advanceAdminCase('admin-flow','approve').ok,true);assert.equal(e.advanceAdminCase('admin-flow','complete').ok,true);assert.equal(s.administration.cases[0].status,'closed');
});
test('4.0.3 正式人事程序有職級、預算、AP 及離任狀態檢查',()=>{
 const e=make(),s=e.state;s.career.rank=7;s.management.staffRoster.push({id:'hr-1',name:'測試教師',role:'教師',strength:70,performance:70,morale:60,months:18,salary:30000,active:true});
 assert.equal(e.staffHRAction('hr-1','improve').ok,true);let person=s.management.staffRoster.find(x=>x.id==='hr-1');assert.equal(person.performancePlan.status,'active');assert.equal(e.staffHRAction('hr-1','exit').ok,true);assert.equal(person.active,false);assert.equal(e.staffHRAction('hr-1','coach').ok,false);
});
test('4.0.3 學年末可建立學科模擬成績分布並防止重複',()=>{
 const e=make(),s=e.state;s.career.rank=3;s.date.month=6;s.date.year=2027;const r=e.runDSEAssessment();assert.equal(r.ok,true);assert.equal(r.report.subjects.length,5);assert.ok(r.report.subjects.every(x=>x.levelDistribution.length===7));assert.equal(e.runDSEAssessment().ok,false);assert.match(r.report.model,/非真實/);
});
test('4.0.3 新功能入口及版本快取已更新',()=>{
 const ui=fs.readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(ui,/data-act="studentCasework"/);assert.match(ui,/data-act="staffHR"/);assert.match(ui,/data-act="adminStep"/);assert.match(ui,/data-act="runDSE"/);assert.match(sw,/tls-4\.0\.3-completion-v1/);
});
test('4.0.3 生態頁可見新流程入口，互動事件可更新狀態',async()=>{
 const {createUI}=await import('../js/ui.js');const e=make(),root={innerHTML:'',addEventListener(){}},storage={getItem(){return null},setItem(){}};const u=createUI(root,e,storage);u.ui.screen='game';e.state.students.incidents.push({id:'ui-case',studentId:e.state.students.cohort[0].id,type:'high-risk-absence',turn:0,status:'monitoring',factors:['出席下降']});u.act('tab',{tab:'ecosystem'});assert.match(root.innerHTML,/公開考試及 DSE 模擬分析/);assert.match(root.innerHTML,/啟動學生保護/);assert.match(root.innerHTML,/制定支援計劃/);
 u.act('studentCasework',{id:'ui-case',choice:'assess'});assert.equal(e.state.students.incidents.find(x=>x.id==='ui-case').status,'assessed');
});
