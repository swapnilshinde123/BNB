import {notFound} from 'next/navigation';
import {staysMetadata,StaysPage} from '@/lib/stays-page';
type Props={params:Promise<{slug:string}>};
// Only the Pune hub lives here; area pages moved to /stays/pune/<slug> (the worker 301-redirects old links).
export async function generateMetadata({params}:Props){const {slug}=await params;return slug==='pune'?staysMetadata('pune'):{title:'Page not found | GOMZO',robots:{index:false,follow:false}}}
export default async function Stays({params}:Props){const {slug}=await params;if(slug!=='pune')notFound();return <StaysPage slug="pune"/>}
