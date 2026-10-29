'use client';

import {QRCodeSVG} from 'qrcode.react';
import {LockKeyhole,ScanLine} from 'lucide-react';

const UPI_ID='swapnil69011@ybl';

export function UpiPayment({amount,bookingId}:{amount:number;bookingId:string}){
 const value=new URLSearchParams({pa:UPI_ID,pn:'Aangan Stays',am:amount.toFixed(2),cu:'INR',tn:`Aangan ${bookingId}`});
 const uri=`upi://pay?${value.toString()}`;
 return <aside className="upi-payment" aria-label="UPI payment details">
  <div className="upi-payment-heading"><span><ScanLine size={16}/></span><div><b>Payment pending</b><small>Scan to pay securely</small></div></div>
  <div className="upi-qr-frame"><QRCodeSVG value={uri} size={176} level="M" marginSize={2} title={`Pay ₹${amount.toLocaleString('en-IN')} for booking ${bookingId}`}/></div>
  <p className="upi-amount">₹{amount.toLocaleString('en-IN')}</p>
  <p className="upi-fixed"><LockKeyhole size={13}/>Exact booking amount</p>
  <p className="upi-id">UPI ID <b>{UPI_ID}</b></p>
 </aside>
}
