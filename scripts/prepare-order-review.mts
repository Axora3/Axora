import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import {submitQuestionnaire} from '../tests/order-workflow/browser/questionnaire';
const root='qa-evidence/axora-upgrade';
const complete=JSON.parse(fs.readFileSync(root+'/workflow/review-order.json','utf8'));
fs.writeFileSync(root+'/workflow/full-lifecycle-order.json',JSON.stringify(complete,null,2));
if(!fs.existsSync(root+'/workflow/questionnaire-review-desktop.png'))fs.copyFileSync(root+'/workflow/questionnaire-review.png',root+'/workflow/questionnaire-review-desktop.png');
const b=await chromium.launch({channel:'chrome'}),admin=await b.newContext({baseURL:'http://localhost:43435',viewport:{width:1440,height:1000},reducedMotion:'reduce'}),customer=await b.newContext({baseURL:'http://localhost:43435',viewport:{width:390,height:1000},extraHTTPHeaders:{'x-forwarded-for':'192.0.2.40'},reducedMotion:'reduce'});
await admin.addInitScript(()=>localStorage.setItem('axora-theme','dark'));
const a=await admin.newPage(),c=await customer.newPage();
try{
 await a.goto('/admin/login');await a.getByLabel('Имэйл',{exact:true}).fill('admin@example.invalid');await a.getByLabel('Нууц үг',{exact:true}).fill('fixture-admin-only-2026');await a.getByRole('button',{name:'Нэвтрэх',exact:true}).click();await expect(a).toHaveURL('/admin');
 await a.goto('/admin/settings');await a.getByRole('group',{name:'Starter',exact:true}).getByLabel('Үнэ (₮)',{exact:true}).fill('100000');await a.getByRole('button',{name:'Тохиргоо хадгалах',exact:true}).click();await expect(a.getByText('Тохиргоо хадгаллаа.',{exact:false})).toBeVisible();
 const order=await submitQuestionnaire(c);fs.copyFileSync(root+'/workflow/questionnaire-review.png',root+'/mobile/questionnaire-review.png');fs.copyFileSync(root+'/workflow/questionnaire-review-desktop.png',root+'/workflow/questionnaire-review.png');
 await a.goto('/admin/orders/'+order.orderId);await a.getByLabel('Анкет, задаргаа, давхардал болон тусгай шаардлагыг хянасан').check();await a.getByRole('button',{name:'Үнийн саналыг баталж илгээх',exact:true}).click();await expect(a.getByText('Хадгаллаа.',{exact:true})).toBeVisible();
 await c.goto(order.trackingUrl);await c.screenshot({path:root+'/mobile/customer-quote.png',fullPage:true});await c.getByRole('button',{name:'Үнийн саналыг зөвшөөрөх',exact:true}).click();await c.getByRole('button',{name:'Батлах',exact:true}).click();await expect(c.getByText('TEST123456',{exact:false})).toBeVisible();await c.screenshot({path:root+'/mobile/customer-payment.png',fullPage:true});
 await c.getByRole('button',{name:'Төлбөр шилжүүлснээ мэдэгдэх',exact:true}).click();await c.getByRole('button',{name:'Батлах',exact:true}).click();await c.reload();await expect(c.getByText('Шилжүүлгийн мэдэгдлийг хүлээн авсан.',{exact:false})).toBeVisible();await c.screenshot({path:root+'/mobile/customer-payment-reported.png',fullPage:true});
 await a.reload();await a.getByRole('button',{name:'Төлбөр баталгаажуулах · хугацааны санал авах'}).click();const dialog=a.getByRole('dialog',{name:'Төлбөр баталгаажуулах',exact:true});await expect(dialog).toBeVisible();await a.setViewportSize({width:390,height:1000});await dialog.screenshot({path:root+'/mobile/admin-payment-dialog.png'});await dialog.getByRole('button',{name:'Болих',exact:true}).click();
 const response=await c.request.get(complete.customerUrl.replace('http://localhost:43435/order/pay/','http://localhost:43435/api/order-workflow/'));const project=(await response.json()).workflow.project;
 await a.setViewportSize({width:1440,height:1000});await a.goto('/admin/projects/'+project.id);await expect(a.getByRole('link',{name:'Захиалгын ажиллагааг нээх',exact:true})).toBeVisible();await expect(a.getByLabel('Эхлэх огноо',{exact:true})).toHaveCount(0);await a.screenshot({path:root+'/workflow/project-date-controls.png',fullPage:true});
 await a.goto('/admin');await a.getByRole('button',{name:/^Мэдэгдэл/}).first().click();await expect(a.getByLabel('Сүүлийн мэдэгдэл',{exact:true})).toBeVisible();await a.screenshot({path:root+'/workflow/admin-notification-panel.png'});
 fs.writeFileSync(root+'/workflow/review-order.json',JSON.stringify({environment:'Loopback-only QA; synthetic data, test bank, sandbox SMTP',orderId:order.orderId,reference:order.reference,customerUrl:'http://localhost:43435'+order.trackingUrl,adminUrl:'http://localhost:43435/admin/orders/'+order.orderId,status:'payment_reported; unverified',adminLogin:'admin@example.invalid',testPassword:'fixture-admin-only-2026',completedCustomerUrl:complete.customerUrl,completedAdminUrl:complete.adminUrl},null,2));
 console.log({result:'PASS',reviewOrder:order.reference,mobileQuote:true,mobilePayment:true,mobileDialog:true,projectControls:true});
}finally{await b.close();}
