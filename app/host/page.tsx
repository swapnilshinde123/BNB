import {privateMetadata} from '@/lib/seo';
import {AdminApp} from '@/components/stays/admin-app';
export const metadata={...privateMetadata,title:'Host workspace | GOMZO'};
export default function HostPage(){return <AdminApp/>}
