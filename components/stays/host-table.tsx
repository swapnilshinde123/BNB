'use client';
import {useEffect,useRef,type ComponentProps} from 'react';

// Retain one semantic table on desktop and expose each column label in mobile cards.
export function HostTable({children,className='',...props}:ComponentProps<'table'>){
 const ref=useRef<HTMLTableElement>(null);
 useEffect(()=>{const table=ref.current;if(!table)return;const labels=Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent?.trim()||'');for(const row of table.querySelectorAll('tbody tr'))Array.from(row.children).forEach((cell,i)=>{cell.setAttribute('data-label',labels[i]||'')})},[children]);
 return <table {...props} className={'host-data-table '+className} ref={ref}>{children}</table>;
}
