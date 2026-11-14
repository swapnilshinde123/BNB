import {identity,json} from '@/lib/server';
import {sameOrigin} from '@/lib/tenancy';
import {recordWebsiteUser} from '@/lib/user-registry';
export async function POST(req:Request){
 if(!sameOrigin(req))return json({error:'Open the website.'},403);
 const user=await identity();if(!user)return json({error:'Sign in required.'},401);
 await recordWebsiteUser(user,req.url);return json({ok:true});
}
