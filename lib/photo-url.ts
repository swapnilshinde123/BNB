import {photo,type Property} from './properties';
// Uploaded photos are stored as data: URLs. Public pages and structured data link to them through
// /photos/<id>/<n>.<ext> so search engines can crawl and cache real image URLs.
export function photoList(p:Property){return p.photos?.length?p.photos:[p.image]}
const ext=(src:string)=>src.match(/^data:image\/(webp|jpeg|png);/)?.[1]?.replace('jpeg','jpg')||'webp';
export function photoUrl(p:Property,index=0,width=1200){const src=photoList(p)[index]||p.image;return src.startsWith('data:image/')?`/photos/${encodeURIComponent(p.id)}/${index+1}.${ext(src)}`:photo(src,width)}
export function absolutePhotoUrl(p:Property,index=0,width=1200,origin='https://gomzo.co'){const url=photoUrl(p,index,width);return url.startsWith('/')?origin+url:url}
export function photoAlt(p:Property&{city?:string},index=0){return `${p.type} ${p.name} in ${p.area}, ${p.city||'Pune'}${index?` · photo ${index+1}`:' · homestay'}`}
