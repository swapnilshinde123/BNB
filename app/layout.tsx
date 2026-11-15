import {SiteStructuredData} from '@/components/stays/site-structured-data';
import type {Metadata} from 'next';
import './globals.css';
import {headers} from 'next/headers';
import {homeTitle,homeDescription,pageMetadata} from '@/lib/seo';
export async function generateMetadata():Promise<Metadata>{const host=(await headers()).get('host')||'';return {...pageMetadata(homeTitle,homeDescription,'/'),metadataBase:new URL('https://gomzo.co'),applicationName:'GOMZO',robots:host.startsWith('admin.')||host.endsWith('.workers.dev')?{index:false,follow:false}:{index:true,follow:true},icons:{icon:[48,96,192].map(size=>({url:`/brand/favicon-${size}.png`,type:'image/png',sizes:`${size}x${size}`})),apple:'/brand/favicon-192.png'}}}
export default async function RootLayout({children}:{children:React.ReactNode}){const host=(await headers()).get('host')||'';return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="preconnect" href="https://images.unsplash.com"/></head><body><SiteStructuredData privateHost={host.startsWith('admin.')||host.includes('stays-admin.')}/>{children}</body></html>}
