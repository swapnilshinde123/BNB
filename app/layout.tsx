import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Gomzo · A little Pune. A lot like home.',icons:{icon:[{url:'/brand/gomzo-icon.svg',type:'image/svg+xml'}],apple:'/brand/gomzo-icon.svg'},description:'Discover thoughtful homes across Pune. Find your neighbourhood, choose your dates, and request your stay.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
