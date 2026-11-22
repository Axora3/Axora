import {z} from 'zod';
import {adminClient,isBackendConfigured} from '@/lib/supabase/server';
import {readJson,rateLimit,fail,ok} from '@/lib/server/http';
export async function POST(req:Request){
 if(!isBackendConfigured())return fail(503,'unavailable','Төлбөрийн систем түр бэлэн биш байна.');
 const body=await readJson(req,2048);if(!body.ok)return body.res;
 const parsed=z.object({email:z.email().max(254)}).safeParse(body.data);if(!parsed.success)return fail(400,'invalid','Email хаягаа шалгана уу.');
 if(!await rateLimit(req,'english-words-orders',5,600))return fail(429,'limited','Түр хүлээгээд дахин оролдоно уу.');
 const {data,error}=await adminClient().rpc('ew_create_order',{p_email:parsed.data.email.trim().toLowerCase()});
 if(error)return fail(409,'unavailable','Захиалга үүсгэх боломжгүй. Өмнөх захиалгаа ашиглах эсвэл админтай холбогдоно уу.');
 return ok({order:data},201);
}
