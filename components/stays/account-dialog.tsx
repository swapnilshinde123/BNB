'use client';
import {ProfileIdStatus} from "./guest-id";
import {Dialog} from 'radix-ui';
import {ArrowUpRight,CalendarDays,Heart,LogOut,Mail,ShieldCheck,X} from 'lucide-react';
import './account-dialog.css';

type Props={open:boolean;onClose:()=>void;user?:{name?:string;email?:string};savedCount:number;onBookings:()=>void;onSaved:()=>void};
export function AccountDialog({open,onClose,user,savedCount,onBookings,onSaved}:Props){
 const name=user?.name?.trim()||'Guest';
 const initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
 return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose()}}><Dialog.Portal><Dialog.Overlay className="account-overlay"/><Dialog.Content className="gomzo-account-dialog"><Dialog.Close className="account-close" aria-label="Close profile"><X size={20}/></Dialog.Close><div className="account-banner"><span>YOUR GOMZO ACCOUNT</span><div className="account-avatar" aria-hidden="true">{initials}<span><ShieldCheck size={14}/></span></div></div><div className="account-content"><Dialog.Title className="account-name">Hello, {name.split(/\s+/)[0]}.</Dialog.Title><Dialog.Description className="account-description">Your next stay starts here.</Dialog.Description><div className="account-email"><Mail size={16}/><span>{user?.email}</span></div><ProfileIdStatus/><div className="account-links"><button type="button" onClick={onBookings}><span className="account-link-icon"><CalendarDays size={22}/></span><span><strong>My bookings</strong><small>Requests, payments &amp; upcoming stays</small></span><ArrowUpRight size={19}/></button><button type="button" onClick={onSaved}><span className="account-link-icon"><Heart size={22}/></span><span><strong>Saved homes</strong><small>{savedCount?savedCount+' home'+(savedCount===1?'':'s')+' in your collection':'Keep your favourite places close'}</small></span><ArrowUpRight size={19}/></button></div><div className="account-footer"><span><ShieldCheck size={15}/> Signed in with Google</span><a href="/api/auth/google/logout?return_to=/"><LogOut size={17}/>Sign out</a></div></div></Dialog.Content></Dialog.Portal></Dialog.Root>
}
