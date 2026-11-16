'use client';
import dynamic from 'next/dynamic';

const HostWorkspace=dynamic(()=>import('@/app/stay-app'),{
 ssr:false,
 loading:()=> <div className="host-shell"><header className="header"><div className="brand"><img className="brand-logo" src="/brand/gomzo-wordmark.png" alt="Gomzo" width={240} height={43}/></div></header><main><p role="status" style={{padding:'32px 5.5%',color:'var(--muted)'}}>Loading your host workspace…</p></main></div>
});

export function AdminApp(){return <HostWorkspace initialPage="admin"/>}
