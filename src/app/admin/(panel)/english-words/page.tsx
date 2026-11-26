import {Suspense} from 'react';
import {requireAdminPage} from '@/lib/admin/auth';
import {EnglishWordsAdmin} from '@/components/english-words/Admin';
export const metadata={title:'English Words'};
async function Content(){const auth=await requireAdminPage();if(auth.kind!=='ok')return null;
 const [settings,orders,members]=await Promise.all([auth.ctx.db.from('ew_product_settings').select('*').eq('id',1).single(),auth.ctx.db.from('ew_orders').select('*').order('created_at',{ascending:false}).limit(200),auth.ctx.db.from('ew_memberships').select('*').order('expires_at',{ascending:false}).limit(200)]);
 if(settings.error||orders.error||members.error)return <p className="p-8" role="alert">English Words-ийн membership migration-ийг Supabase дээр ажиллуулж, дахин нээнэ үү.</p>;
 return <EnglishWordsAdmin settings={settings.data} orders={orders.data||[]} members={members.data||[]}/>;
}
export default function Page(){return <main id="main" tabIndex={-1} className="min-w-0"><Suspense fallback={<p className="p-8">English Words ачаалж байна…</p>}><Content/></Suspense></main>;}
