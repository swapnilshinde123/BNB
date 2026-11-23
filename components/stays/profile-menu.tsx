'use client';
import {DropdownMenu} from 'radix-ui';
import {CalendarCheck,Heart,Menu,Search,UserRound,LogIn} from 'lucide-react';
import './profile-menu.css';
type Props={user?:{name:string;email:string;picture?:string|null}|null;saved:number;current:string;onNavigate:(page:'explore'|'bookings'|'saved')=>void;onAccount:()=>void;onLogin:()=>void};
export function ProfileMenu({user,saved,current,onNavigate,onAccount,onLogin}:Props){
 const item=(page:'explore'|'bookings'|'saved',icon:React.ReactNode,label:string,extra?:React.ReactNode)=><DropdownMenu.Item className={'pm-item'+(current===page?' on':'')} onSelect={()=>onNavigate(page)}>{icon}<span>{label}</span>{extra}</DropdownMenu.Item>;
 return <DropdownMenu.Root modal={false}><DropdownMenu.Trigger className="pm-trigger" aria-label={user?'Open your menu':'Open menu'}><Menu size={18}/>{user?<span className="pm-avatar">{user.picture?<img src={user.picture} alt="" referrerPolicy="no-referrer"/>:user.name.charAt(0).toUpperCase()}</span>:<span className="pm-avatar ghost"><UserRound size={16}/></span>}{saved>0&&<i className="pm-dot" aria-hidden="true"/>}</DropdownMenu.Trigger>
 <DropdownMenu.Portal><DropdownMenu.Content className="pm-menu" align="end" sideOffset={10} collisionPadding={12}>
  {user&&<div className="pm-head"><span className="pm-avatar big">{user.picture?<img src={user.picture} alt="" referrerPolicy="no-referrer"/>:user.name.charAt(0).toUpperCase()}</span><span><b>{user.name}</b><small>{user.email}</small></span></div>}
  {item('explore',<Search size={17}/>,'Find a stay')}
  {item('bookings',<CalendarCheck size={17}/>,'My bookings')}
  {item('saved',<Heart size={17}/>,'Saved homes',saved>0?<em>{saved}</em>:null)}
  <DropdownMenu.Separator className="pm-sep"/>
  {user?<DropdownMenu.Item className="pm-item" onSelect={onAccount}><UserRound size={17}/><span>Account</span></DropdownMenu.Item>:<DropdownMenu.Item className="pm-item strong" onSelect={onLogin}><LogIn size={17}/><span>Log in</span></DropdownMenu.Item>}
 </DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>}
