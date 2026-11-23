import { SeoPage, Answer } from '@/components/stays/seo-page';
import { pageMetadata, jsonLd } from '@/lib/seo';

export const metadata = pageMetadata(
  'GOMZO Booking FAQs | Stays, payments and host support',
  'Answers to common GOMZO questions about stay requests, host review, payment status, check-in and cancellation support.',
  '/faq',
);

const answers = [
  {
    question: 'Where does GOMZO offer accommodation?',
    answer: 'GOMZO serves guests looking for stays across cities. Check the live collection for currently published homes and locations; listings and available dates can change.',
  },
  {
    question: 'Can I request a stay for one night?',
    answer: 'The booking form supports requests from one to 90 nights, subject to the home’s available dates, guest capacity and host approval. Confirm longer-stay requirements directly with the host.',
  },
  {
    question: 'Can I book for my family?',
    answer: 'Check each home’s maximum guest count, bedrooms and listed amenities before requesting. A family-friendly category is useful for browsing, but specific accessibility, child-safety or other needs should be confirmed with the host.',
  },
  {
    question: 'Is payment needed to send a request?',
    answer: 'No upfront payment is needed to submit a booking request. After the host accepts, the request becomes payment pending. Confirmation follows host verification of payment.',
  },
  {
    question: 'How do I pay, and is GST extra?',
    answer: 'You pay by UPI, and only after the host accepts your request. My bookings then shows the exact amount and a UPI QR code; after paying, you enter the UTR (transaction reference) so the host can verify it. Prices are shown as a nightly base rate, and 5% GST is added in the quote you see before sending the request.',
  },
  {
    question: 'How is GOMZO different from Airbnb or OYO?',
    answer: 'GOMZO is a small, curated collection of homestays and short-stay apartments in Pune. Every booking is a request first: sending it costs ₹0, a real host reviews it, and you pay by UPI only after the host says yes. Once you have booked, you can message your host on WhatsApp, and the GOMZO team is reachable any time through Contact us.',
  },
  {
    question: 'What happens if the host declines my request?',
    answer: 'No money is taken, because nothing is paid until a host accepts. The held dates are released, the status in My bookings changes, and you can request another home or other dates.',
  },
  {
    question: 'Which ID do I need to book?',
    answer: 'Each adult guest uploads one government photo ID before the booking is confirmed: Aadhaar (masked, showing only the last four digits), passport, driving licence or voter ID. Foreign guests need a passport and visa. An approved ID can be kept on your account so you do not need to upload it again next time.',
  },
  {
    question: 'Can I bring extra guests or visitors?',
    answer: 'Book for everyone who will stay overnight; each home shows its maximum number of guests and the booking form will not go above it. Ask the host before inviting day visitors.',
  },
  {
    question: 'Are couples, pets or parties allowed?',
    answer: 'House rules are set by each host and differ from home to home. Message the host before you request if you are travelling as a couple, with a pet, or planning a gathering, and get their answer in writing.',
  },
  {
    question: 'Can I check in early or check out late?',
    answer: 'Standard times are check-in at 12 noon and check-out at 10 am. Early check-in or late check-out depends on whether the home is free before or after your stay, so ask the host; some hosts may charge for it.',
  },
  {
    question: 'Are prices fixed for every date?',
    answer: 'Nightly rates can vary for weekends, festivals or dates set by the host. Review the quote for your exact dates and guest count; the booking form shows 5% GST before submission.',
  },
  {
    question: 'What does payment pending mean?',
    answer: 'The host has accepted your request and is waiting for payment verification. This status does not mean your stay is confirmed.',
  },
  {
    question: 'How do cancellations and refunds work?',
    answer: 'An unreviewed pending request can be cancelled through My bookings. For an accepted or confirmed booking, contact the host. Refund eligibility and conditions need to be confirmed with the host; GOMZO does not publish a universal refund promise.',
  },
  {
    question: 'What time are check-in and check-out?',
    answer: 'The standard times shown on the website are check-in at 12 noon and check-out at 10 am. Ask the host before arranging an exception.',
  },
];

export default function FAQ() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://www.gomzo.co/faq#faq',
    mainEntity: answers.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <SeoPage title="GOMZO booking FAQs" description="Straight answers about using GOMZO and understanding your booking status." path="/faq">
        {answers.map(({ question, answer }, index) => (
          <Answer key={question} question={question}>{answer}</Answer>
        ))}
        <Answer question="How can I contact the host?">Use the contact or Message host link shown with your booking, or visit <a href="/contact">Contact GOMZO</a>.</Answer>
      </SeoPage>
    </>
  );
}
