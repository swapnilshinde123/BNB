import {hostAccess} from '@/lib/tenancy';
import {hostDirectory} from '@/lib/host-directory';
import {json} from '@/lib/server';
export async function GET(){
 if((await hostAccess()).role!=='super_admin')return json({error:'Super admin access required.'},403);
 return json(await hostDirectory());
}
