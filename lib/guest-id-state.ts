type Submission={ordinal:number;status:string;purged_at?:number|null;expires_at?:number;foreign_guest?:number;files?:{kind:string}[]};
export function guestIdUploaded(data:{enabled?:boolean;profile?:{status:string;foreign_guest:number}|null;items?:Submission[]}|null,adults=1){
 if(!data?.enabled)return false;
 return Array.from({length:adults},(_,i)=>i+1).every(ordinal=>{
  if(ordinal===1&&data.profile?.status==='approved'&&data.profile.foreign_guest===0)return true;
  const row=data.items?.find(item=>item.ordinal===ordinal);
  return !!row&&!row.purged_at&&(!row.expires_at||row.expires_at>Date.now())&&['pending','approved'].includes(row.status)&&['front','back',...(row.foreign_guest?['visa']:[])].every(kind=>row.files?.some(file=>file.kind===kind));
 });
}
