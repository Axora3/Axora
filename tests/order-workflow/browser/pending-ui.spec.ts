import {test,expect} from '@playwright/test';
import {submitQuestionnaire} from './questionnaire';
test.use({extraHTTPHeaders:{'x-forwarded-for':'192.0.2.41'}});
test('saved questionnaire UI succeeds without retry warning while quotation schema is unavailable',async({page,request})=>{
 await request.post('http://127.0.0.1:43434/__quotation_settings',{data:{available:false}});
 try{
  const saved=await submitQuestionnaire(page,{allowPending:true});expect(saved.orderId).toBeTruthy();
  await expect(page.getByRole('heading',{name:'Үнийн санал бэлтгэж байна',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Хэрхэн төлөх вэ?',exact:true})).toHaveCount(0);
  await expect(page.getByText('Анкетыг амжилттай хүлээн авлаа.',{exact:false})).toBeVisible();await expect(page.getByText('Дахин илгээх шаардлагагүй.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:'Дахин илгээх',exact:true})).toHaveCount(0);await expect(page.getByText('Үнийн саналын систем түр ачаалагдахгүй байна.',{exact:false})).toHaveCount(0);
  const state=await(await request.get('http://127.0.0.1:43434/__order_state?id='+saved.orderId)).json();expect(state.order.answers.q2).toBe('Recovery UI Studio');expect(state.quotes).toBe(0);
  await page.screenshot({path:'qa-evidence/axora-upgrade/after/intake-pending-success.png',fullPage:true});
 }finally{await request.post('http://127.0.0.1:43434/__quotation_settings',{data:{available:true}});}
});
