"use server";
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {requireAdminAction} from '@/lib/admin/auth';
const settingsSchema=z.object({price_mnt:z.number().int().min(1).max(10000000),coin_price:z.number().int().min(1).max(1000000),welcome_coins:z.number().int().min(0).max(100000),discount_percent:z.number().int().min(0).max(90),streak_days:z.number().int().min(1).max(365),daily_coins:z.number().int().min(0).max(10000),battle_win_coins:z.number().int().min(0).max(10000),sales_enabled:z.boolean(),gate_enabled:z.boolean(),payment_instructions:z.string().max(2000),purchase_url:z.union([z.literal(''),z.url().startsWith('https://')])});
export async function saveEnglishWordsSettings(input:unknown){
 const ctx=await requireAdminAction();if(!ctx)return {error:'Админ эрх шаардлагатай.'};
 const p=settingsSchema.safeParse(input);if(!p.success)return {error:'Тохиргооны утгуудаа шалгана уу.'};
 if(p.data.sales_enabled&&!p.data.payment_instructions.trim())return {error:'Банкны төлбөрийн заавраа оруулна уу.'};
 if(p.data.gate_enabled&&(!p.data.sales_enabled||!p.data.purchase_url))return {error:'Эрхийн хязгаарлалтыг идэвхжүүлэхийн өмнө борлуулалт, худалдан авах URL-аа тохируулна уу.'};
 const {error}=await ctx.db.from('ew_product_settings').update(p.data).eq('id',1);if(error)return {error:'Хадгалж чадсангүй. Migration болон холболтоо шалгана уу.'};
 revalidatePath('/english-words');revalidatePath('/admin/english-words');return {ok:true};
}
export async function manageEnglishWordsOrder(input:unknown){
 const ctx=await requireAdminAction();if(!ctx)return {error:'Админ эрх шаардлагатай.'};
 const p=z.object({id:z.uuid(),action:z.enum(['confirm','cancel','revoke']),reference:z.string().max(100).optional()}).safeParse(input);
 if(!p.success)return {error:'Хүсэлт буруу байна.'};
 const {error}=await ctx.db.rpc('ew_manage_order',{p_id:p.data.id,p_action:p.data.action,p_reference:p.data.reference||null});
 if(error)return {error:'Үйлдэл амжилтгүй. Захиалга дууссан, хүчингүй эсвэл гүйлгээний дугаар давхардсан байж болно.'};
 revalidatePath('/admin/english-words');return {ok:true};
}

export async function manageEnglishWordsMember(input:unknown){
 const ctx=await requireAdminAction();if(!ctx)return {error:'Админ эрх шаардлагатай.'};
 const p=z.object({email:z.email().max(254),action:z.enum(['grant','unlimited','ban','unban','revoke']),months:z.number().int().min(1).max(120)}).safeParse(input);
 if(!p.success)return {error:'Email, хугацаагаа шалгана уу.'};
 const {error}=await ctx.db.rpc('ew_admin_member',{p_email:p.data.email,p_action:p.data.action,p_months:p.data.months});
 if(error)return {error:'Эрх өөрчилж чадсангүй.'};revalidatePath('/admin/english-words');return {ok:true};
}
