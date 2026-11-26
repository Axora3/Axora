import {z} from 'zod';
import {answerValue} from '@/lib/order/schema';
import {calculateForAnswers} from '@/lib/order-workflow/server';
import {fail,ok,readJson,rateLimit} from '@/lib/server/http';
const schema=z.object({answers:z.record(z.string().max(16),answerValue)});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return fail(403,'origin','Хүсэлтийг зөвшөөрсөнгүй.');
 if(!await rateLimit(req,'quotation-preview',60,60))return fail(429,'rate','Түр хүлээгээд дахин оролдоно уу.');
 const body=await readJson(req,65536);if(!body.ok)return body.res;
 const parsed=schema.safeParse(body.data);if(!parsed.success)return fail(422,'invalid','Мэдээллээ шалгана уу.');
 try{return ok({quotation:await calculateForAnswers(parsed.data.answers)});}
 catch{return fail(503,'unavailable','Урьдчилсан тооцоо түр ачаалагдахгүй байна.');}
}
