'use client';
import {ArrowRight,MessageSquareText} from 'lucide-react';
import {homepageFaqs} from '@/lib/homepage-content';
import './homepage-help.css';
export function HomepageHelp(){return <section id="faq" className="homepage-help" aria-labelledby="homepage-help-title">
 <div className="qa-side">
  <span className="qa-eyebrow">GOOD TO KNOW</span>
  <h2 id="homepage-help-title">Questions,<br/><em>answered.</em></h2>
  <p className="qa-lead">Everything you need to know before you book your little escape.</p>
  <div className="qa-chat"><span className="qa-chat-icon"><MessageSquareText size={18}/></span><h3>Still have a question?</h3><p>Message us on WhatsApp — a real person replies, not a bot.</p><a href="https://wa.me/917083834078" target="_blank" rel="noopener noreferrer">Chat with us <ArrowRight size={15}/></a></div>
 </div>
 <div className="qa-list">
  {homepageFaqs.map((item,i)=><details key={item.question} name="gomzo-faq" open={i===0} onToggle={e=>{const d=e.currentTarget;if(d.open)d.parentElement?.querySelectorAll('details[open]').forEach(o=>{if(o!==d)(o as HTMLDetailsElement).open=false})}}><summary><h3>{item.question}</h3><span className="qa-toggle" aria-hidden="true"/></summary><p>{item.answer} <a href={item.href}>{item.label}</a>.</p></details>)}
  <a className="qa-all" href="/faq">See all FAQs</a>
 </div>
</section>}
