import {photo,type Property} from './properties';
// Uploaded photos are stored as data: URLs. Public pages and structured data link to them through
// /photos/<id>/<n>.<ext> so search engines can crawl and cache real image URLs.
export function photoList(p:Property){return p.photos?.length?p.photos:[p.image]}
const ext=(src:string)=>src.match(/^data:image\/(webp|jpeg|png);/)?.[1]?.replace('jpeg','jpg')||'webp';
const versionTag=(v?:string)=>v?'?v='+encodeURIComponent(v.replace(/[^0-9TZ]/g,'')):'';
export function photoUrl(p:Property,index=0,width=1200){const src=photoList(p)[index]||p.image;return src.startsWith('data:image/')?`/photos/${encodeURIComponent(p.id)}/${index+1}.${ext(src)}${versionTag(p.version)}`:photo(src,width)}
/** Guest-facing copy of a home with photo links instead of embedded image data. */
export function withPhotoLinks<T extends Property>(p:T):T{const list=photoList(p);if(!list.some(src=>src.startsWith('data:image/')))return p;const urls=list.map((_,i)=>photoUrl(p,i));return {...p,image:urls[0],photos:urls}}
export function absolutePhotoUrl(p:Property,index=0,width=1200,origin='https://gomzo.co'){const url=photoUrl(p,index,width);return url.startsWith('/')?origin+url:url}
export function photoAlt(p:Property&{city?:string},index=0){return `${p.type} ${p.name} in ${p.area}, ${p.city||'Pune'}${index?` · photo ${index+1}`:' · homestay'}`}
