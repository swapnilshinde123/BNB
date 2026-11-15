'use client';
import {usePathname} from 'next/navigation';
import {brandSchema,homepageSchema,jsonLd} from '@/lib/seo';
export function SiteStructuredData({privateHost}:{privateHost:boolean}){const path=usePathname();if(privateHost)return null;return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(path==='/'?homepageSchema():brandSchema())}}/>}
