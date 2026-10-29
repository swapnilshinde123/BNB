// Shared by booking previews and server-side totals; money is rounded in paise.
export function bookingPrice(nightlyRate:number,nights:number){
 const subtotalPaise=Math.round(nightlyRate*100)*nights;
 const gstPaise=Math.round(subtotalPaise*5/100);
 return {subtotal:subtotalPaise/100,gst:gstPaise/100,total:(subtotalPaise+gstPaise)/100};
}
