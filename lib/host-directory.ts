import {config,database} from './server';
import {ensureTenancy} from './tenancy';

export type HostCompany={id:string;name:string;admins:{email:string;name:string;active:boolean}[]};
// Called only after a host authorization check. Never include this directory in guest responses.
export async function hostDirectory():Promise<HostCompany[]>{
 await ensureTenancy();const db=database();
 const [companies,members]=await Promise.all([
  db.prepare('SELECT id,name FROM host_companies ORDER BY name').all<{id:string;name:string}>(),
  db.prepare('SELECT m.email,m.company_id,m.active,p.name FROM host_members m LEFT JOIN host_profiles p ON p.email=m.email ORDER BY m.active DESC,m.email').all<{email:string;company_id:string;active:number;name:string|null}>()
 ]);
 return [{id:'platform',name:'Aangan Stays',admins:[{email:config().ADMIN_EMAIL||'',name:'Super Admin',active:true}]},...companies.results.map(c=>({...c,admins:members.results.filter(m=>m.company_id===c.id).map(m=>({email:m.email,name:m.name||m.email,active:!!m.active}))}))];
}
