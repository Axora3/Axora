import {chromium} from '@playwright/test';
import {login} from '../tests/ecosystem/browser/fixture-auth';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors:string[]=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await login(context,'http://127.0.0.1:43434');await page.goto('http://localhost:3005/admin');await page.getByRole('button',{name:/^Мэдэгдэл/}).first().click();await page.getByLabel('Сүүлийн мэдэгдэл',{exact:true}).waitFor();await page.screenshot({path:'qa-evidence/real-liquid-glass/desktop/admin-notification.png'});
 await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa-evidence/real-liquid-glass/mobile/admin-dock.png'});
 await page.goto('http://localhost:3005/order/pay/'+ 'fixture-order-token-'.padEnd(32,'x'));await page.locator('main').waitFor();await page.screenshot({path:'qa-evidence/real-liquid-glass/mobile/customer-order.png',fullPage:true});
 fs.writeFileSync('qa-evidence/real-liquid-glass/after/admin-runtime.json',JSON.stringify({errors},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}
