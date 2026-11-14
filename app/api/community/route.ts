import {hostAccess,ensureTenancy} from '@/lib/tenancy';
import {database,json} from '@/lib/server';
import {ensureUserRegistry} from '@/lib/user-registry';
import {allProperties} from '@/lib/property-data';
import {communityAnalytics,type RegisteredUser,type CommunityBooking} from '@/lib/community-analytics';

export async function GET(req:Request){
 if((await hostAccess()).role!=='super_admin')return json({error:'Super Admin access required.'},403);
 await Promise.all([ensureTenancy(),ensureUserRegistry()]);const db=database();
 const email=new URL(req.url).searchParams.get('email');
 if(email){
  if(email.length>254)return json({error:'Choose a valid user.'},400);
  const rows=await db.prepare('SELECT b.id,b.name,b.email,b.property_id,b.check_in,b.check_out,b.guests,b.total,b.status,b.source,b.created_at FROM bookings b WHERE lower(trim(b.email))=? ORDER BY b.created_at DESC').bind(email.trim().toLowerCase()).all();
  return json(rows.results);
 }
 const [users,bookings,members,companies,homes,start]=await Promise.all([
  db.prepare('SELECT email,user_id,name,first_signed_in,last_active FROM platform_users').all<RegisteredUser>(),
  db.prepare('SELECT id,user_id,name,email,property_id,check_in,check_out,total,status,source,created_at FROM bookings ORDER BY created_at DESC').all<CommunityBooking>(),
  db.prepare('SELECT m.email,m.company_id,m.active,m.joined_at,p.name FROM host_members m LEFT JOIN host_profiles p ON p.email=m.email ORDER BY m.joined_at DESC').all<{email:string;company_id:string;active:number;joined_at:number;name:string|null}>(),
  db.prepare('SELECT id,name FROM host_companies ORDER BY name').all<{id:string;name:string}>(),
  allProperties(true),
  db.prepare("SELECT started_at FROM platform_tracking WHERE id='users'").first<{started_at:number}>(),
 ]);
 const now=Date.now();return json({...communityAnalytics(users.results,bookings.results,members.results,companies.results,homes,now),generatedAt:now,trackingStartedAt:start?.started_at||now});
}
