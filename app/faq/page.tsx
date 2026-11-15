/Users/swapnilshinde/.rvm/scripts/rvm:29: operation not permitted: ps
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
    '@id': 'https://gomzo.co/faq#faq',
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
