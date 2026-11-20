import {SeoPage,Answer} from '@/components/stays/seo-page';
import {HostEnquiry} from '@/components/stays/host-enquiry';
import {pageMetadata,jsonLd,origin} from '@/lib/seo';
export const metadata=pageMetadata('List Your Property in Pune as a Homestay or Short Stay | Gomzo','Own a flat, villa or second home in Pune? List it on Gomzo as a homestay or short-stay apartment. You set the price and dates, review every booking request and confirm guests yourself.','/list-your-property');
const faqs:[string,string][]=[
 ['Who can list a property on Gomzo?','Owners and property managers of furnished homes in Pune: studios, 1 to 4 BHK apartments, villas and second homes. Send a request below with your details and the number of properties, and the Gomzo team will get in touch to help you set up your listings.'],
 ['How do bookings work for hosts?','Guests send a booking request for their dates. Nothing is confirmed automatically: you review each request, accept or decline it, and the stay is confirmed only after you verify the guest’s payment. Requested dates are held while you decide, so the same nights cannot be double-booked.'],
 ['Do I control my prices and availability?','Yes. You set the nightly rate for each home, and you can raise rates for weekends, festivals and long weekends or set prices for specific dates. You can block dates when the home is not available and pause a listing at any time from the host dashboard.'],
 ['What do I need to get started?','A few good photos of each room, the home’s area, city and full address, the number of guests, bedrooms and bathrooms, the amenities you offer and a short description of what guests will love. The full address stays private and is not shown on the public listing.'],
 ['Which areas of Pune do guests look for?','Guests most often search for stays near the airport (Viman Nagar, Kalyani Nagar, Koregaon Park) and near the west-side IT corridor (Baner, Wakad, Hinjewadi, Pashan). Homes with a workspace, reliable Wi-Fi, a kitchen and parking suit both business travellers and families on longer stays.'],
];
export default function ListYourProperty(){return <SeoPage title="List your property in Pune on Gomzo" description="Turn your flat, villa or second home in Pune into a homestay or short-stay apartment. You stay in control: you set the rates and dates, review every request and confirm guests yourself." path="/list-your-property">
 <HostEnquiry/>
 {faqs.map(([q,a])=><Answer key={q} question={q}>{a}</Answer>)}
 <Answer question="Ready to welcome guests?">Use the <b>List your property</b> button above to send your details. Prefer to talk first? Visit the <a href="/contact">contact page</a>.</Answer>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'FAQPage',url:origin+'/list-your-property',mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))})}}/>
</SeoPage>}
