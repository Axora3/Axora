import {test,expect} from '@playwright/test';
import {login} from '../../ecosystem/browser/fixture-auth';
for(const height of [300,1000])test(`notification popover stays inside ${height}px viewport and scrolls when constrained`,async({context,page})=>{
 await login(context,'http://127.0.0.1:43434');await page.setViewportSize({width:1440,height});await page.goto('/admin');await page.getByRole('button',{name:/^Мэдэгдэл/}).first().click();const panel=page.getByLabel('Сүүлийн мэдэгдэл',{exact:true});await expect(panel).toBeVisible();const rect=(await panel.boundingBox())!;expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(height);
 if(height===300){const scroll=await panel.locator('ul').evaluate(e=>{e.scrollTop=60;return{moved:e.scrollTop>0,width:getComputedStyle(e).scrollbarWidth};});expect(scroll.moved).toBe(true);expect(scroll.width).toBe('thin');}
 await panel.getByRole('link',{name:'Бүх мэдэгдэл харах',exact:true}).click();await expect(page).toHaveURL('/admin/notifications');
});
