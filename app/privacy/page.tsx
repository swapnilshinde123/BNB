import type {Metadata} from 'next';

export const metadata:Metadata={title:'Privacy · Aangan Stays'};

export default function PrivacyPage(){
 return <main style={{maxWidth:780,margin:'0 auto',padding:'64px 24px 96px',lineHeight:1.8}}>
  <a href="/" style={{display:'inline-block',marginBottom:36,fontWeight:700}}>← Aangan Stays</a>
  <span className="eyebrow">YOUR INFORMATION, EXPLAINED</span>
  <h1 style={{fontSize:'clamp(32px,6vw,48px)',margin:'16px 0'}}>Privacy at Aangan.</h1>
  <p style={{marginBottom:32}}>Updated 27 October 2026. This notice explains how this Pune stay-booking website uses information when you browse, sign in or request a booking.</p>
  <section style={{display:'grid',gap:24}}>
   <div><h2>Sign-in and booking details</h2><p>Google sign-in provides your name, verified email address and Google account identifier. Aangan does not receive your Google password or request access to Gmail or Drive. A booking request also includes the guest name, WhatsApp number, selected property, dates, guest count and booking status.</p></div>
   <div><h2>How we use information</h2><p>We use these details to identify your account, show your booking history, hold requested dates, let the host review bookings and contact you about your stay. The host can manage property availability and booking records. This website does not collect card details or process payments.</p></div>
   <div><h2>Hosting and other services</h2><p>The website and booking database run on Cloudflare. Google handles account sign-in. When booking emails are enabled, Resend processes guest contact details, stay dates, booking amount and booking status to deliver request and decision emails to the guest and host. Customer booking updates may instead be sent through a Google Apps Script MailApp connection controlled by the host. It uses email sending permission and does not read the host’s inbox. Delivery records are kept so failed messages can be retried. Map tiles, fonts and property images may load from external providers, which receive normal web-request information such as your IP address. WhatsApp links open WhatsApp; automatic booking alerts require a separately configured WhatsApp Business connection.</p></div>
   <div><h2>Cookies and saved homes</h2><p>We use cookies for sign-in and sign-in protection. Saved-home choices are kept in your browser's local storage. You can sign out, clear browser data or remove saved homes at any time.</p></div>
   <div><h2>Booking records and requests</h2><p>Booking records remain in the host's database until they are removed. To ask about your information, request a correction or request deletion, contact <a href="mailto:swapnil690123@gmail.com" style={{textDecoration:'underline'}}>swapnil690123@gmail.com</a>. Include your booking reference if you have one. Please do not send passwords or sign-in codes.</p></div>
  </section>
 </main>;
}
