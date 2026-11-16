import {homepageReviewedDate} from '@/lib/homepage-content';
export const metadata={authors:[{name:'Gomzo',url:'https://gomzo.co/about'}],other:{'article:modified_time':homepageReviewedDate}};
import StayApp from './stay-app';
import {headers} from 'next/headers';
import {AdminApp} from '@/components/stays/admin-app';
export default async function Home(){const host=(await headers()).get('host')||'';return host.startsWith('admin.')||host.includes('stays-admin.')?<AdminApp/>:<StayApp/>}
