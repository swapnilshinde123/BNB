import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Aangan · A little Pune. A lot like home.',icons:{icon:[{url:'/brand/aangan-stay-icon.png',type:'image/png'}],apple:'/brand/aangan-stay-icon.png'},description:'Discover thoughtful homes across Pune. Find your neighbourhood, choose your dates, and request your stay.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
