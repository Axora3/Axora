import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const root = process.cwd();
const cache = new Map();
function load(file) {
  const full=path.resolve(root,file);
  if(cache.has(full)) return cache.get(full).exports;
  const loaded={exports:{}};cache.set(full,loaded);
  const output=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const localRequire=(name)=>name.startsWith('@/')?load(`src/${name.slice(2)}.ts`):name.startsWith('.')?load(path.resolve(path.dirname(full),`${name}.ts`)):require(name);
  new Function('require','module','exports',output)(localRequire,loaded,loaded.exports);
  return loaded.exports;
}
const {isCalendarDate,dateBounds}=load('src/lib/admin/dates.ts');
const {resolvePeriod}=load('src/lib/admin/period.ts');
const {canOrderTransition,canRequestTransition}=load('src/lib/admin/transitions.ts');
const {templateForm,validateTemplate}=load('src/lib/admin/template-schema.ts');
const {STEPS}=load('src/lib/order/questions.ts');
const {runAdminAction}=load('src/lib/admin/action-client.ts');
const {notificationEntityHref}=load('src/lib/admin/notifications.ts');
test('notification destinations only allow known admin records and UUIDs',()=>{
  const id='20000000-0000-4000-8000-000000000001';
  assert.equal(notificationEntityHref('website_order',id),`/admin/orders/${id}`);
  assert.equal(notificationEntityHref('template_request',id),`/admin/template-requests/${id}`);
  assert.equal(notificationEntityHref('contact_message',id),`/admin/support/${id}`);
  for(const type of ['__proto__','constructor','https://example.test'])assert.equal(notificationEntityHref(type,id),null);
  assert.equal(notificationEntityHref('website_order','../../settings'),null);
});
test('calendar rejects overflow, accepts leap days',()=>{
  for(const date of ['2026-02-29','2026-04-31','2026-13-01','2026-00-01','2026-01-00','bad'])assert.equal(isCalendarDate(date),false,date);
  assert.equal(isCalendarDate('2028-02-29'),true);
});
test('inclusive local days include final fractional second through exclusive next midnight',()=>{
  assert.deepEqual(dateBounds('2026-10-31','2026-10-31'),{from:'2026-10-30T16:00:00.000Z',to:'2026-10-31T16:00:00.000Z'});
  assert.deepEqual(dateBounds('2026-02-30',''),{from:null,to:null});
});
test('invalid/reversed custom periods safely fall back',()=>{
  const now=Date.parse('2026-10-30T18:00:00Z');
  for(const sp of [{period:'custom',from:'2026-02-30',to:'2026-03-01'},{period:'custom',from:'2026-11-01',to:'2026-10-01'}])assert.equal(resolvePeriod(sp,now).key,'7d');
  assert.equal(resolvePeriod({},now).toDate,'2026-10-31');
});
test('delivery requires contact and settled payment; copied links do not qualify',()=>{
  for(const payment of ['pending','needs_review','link_created',''])assert.equal(canRequestTransition('contacted','fulfilled',payment),false);
  assert.equal(canRequestTransition('new','fulfilled','confirmed_manual'),false);
  assert.equal(canRequestTransition('contacted','fulfilled','confirmed_manual'),true);
  assert.equal(canRequestTransition('contacted','fulfilled','not_required'),true);
});
test('completed orders only follow in-progress and reopen to in-progress',()=>{
  assert.equal(canOrderTransition('new','completed'),false);
  assert.equal(canOrderTransition('in_progress','completed'),true);
  assert.equal(canOrderTransition('completed','cancelled'),false);
  assert.equal(canOrderTransition('completed','in_progress'),true);
});
const valid={title:'Template',slug:'template',category:'Canva',shortDescription:'Short',longDescription:'Long',isFree:false,price:1000,currency:'MNT',forWhom:'Business',included:['File'],howTo:['Open'],requirements:'Canva',format:'PDF',sortOrder:100,previewImages:[],file:{storagePath:'folder/file.pdf',externalUrl:null,label:'File'}};
test('paid publish requires private delivery and consistent price',()=>{
  assert.deepEqual(validateTemplate(valid,'publish'),{});
  assert.ok(validateTemplate({...valid,file:null},'publish').file);
  assert.ok(validateTemplate({...valid,isFree:true},'publish').price);
  assert.ok(validateTemplate({...valid,price:0},'publish').price);
  assert.equal(templateForm.safeParse({...valid,file:{...valid.file,storagePath:'https://public.example/paid.pdf'}}).success,false);
});
test('39 original questionnaire fields remain present',()=>{
  const ids=STEPS.flatMap(s=>s.fields.map(f=>f.id));
  for(let i=1;i<=39;i++)assert.ok(ids.includes(`q${i}`),`q${i}`);
});
test('transport failures never claim successful save',async()=>{
  const result=await runAdminAction(async()=>{throw new Error('network')});
  assert.equal(result.ok,false);assert.equal(result.code,'connection');
  assert.deepEqual(await runAdminAction(async()=>({ok:true,id:'saved'})),{ok:true,id:'saved'});
});
