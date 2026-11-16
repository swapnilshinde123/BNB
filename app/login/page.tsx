import {privateMetadata} from '@/lib/seo';
import StayApp from '../stay-app';
import {headers} from 'next/headers';
import {AdminApp} from '@/components/stays/admin-app';
export const metadata={...privateMetadata,title:'Sign in | GOMZO'};
export default async function LoginPage(){const host=(await headers()).get('host')||'';return host.startsWith('admin.')||host.includes('stays-admin.')?<AdminApp/>:<StayApp/>}
