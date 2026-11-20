import {origin,publicPages} from '@/lib/seo';
import {seoHomes,propertySlug,areaPages,matchingHomes} from '@/lib/seo-inventory';
import {homepageReviewedDate} from '@/lib/homepage-content';
import {photoList,absolutePhotoUrl} from '@/lib/photo-url';
import type {Property} from '@/lib/properties';
// Date the static guide pages were last reviewed. Update it when their content changes.
const PAGES_REVIEWED='2026-11-20';
const esc=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const day=(v?:string)=>v&&/^\d{4}-\d{2}-\d{2}/.test(v)?v.slice(0,10):'';
const latest=(...dates:string[])=>dates.filter(Boolean).sort().pop()||PAGES_REVIEWED;
type Entry={path:string;lastmod:string;images?:string[]};
export async function GET(){try{
 const homes=await seoHomes(),homeDate=(p:Property)=>day(p.version)||PAGES_REVIEWED,newest=(list:Property[])=>latest(...list.map(homeDate));
 const entries:Entry[]=[
  {path:'/',lastmod:latest(homepageReviewedDate,newest(homes))},
  {path:'/stays/pune',lastmod:latest(PAGES_REVIEWED,newest(homes))},
  ...publicPages.filter(p=>p!=='/'&&p!=='/stays/pune').map(path=>({path,lastmod:PAGES_REVIEWED})),
  ...Object.keys(areaPages).map(slug=>({slug,list:matchingHomes(homes,slug)})).filter(x=>x.list.length).map(({slug,list})=>({path:'/stays/'+slug,lastmod:latest(PAGES_REVIEWED,newest(list))})),
  ...homes.map(p=>({path:'/stays/pune/'+propertySlug(p),lastmod:homeDate(p),images:photoList(p).map((_,i)=>absolutePhotoUrl(p,i,1200,origin))})),
 ];
 const seen=new Set<string>();
 const urls=entries.filter(e=>!seen.has(e.path)&&seen.add(e.path)).map(e=>`  <url>\n    <loc>${esc(origin+e.path)}</loc>\n    <lastmod>${e.lastmod}</lastmod>${(e.images||[]).map(src=>`\n    <image:image><image:loc>${esc(src)}</image:loc></image:image>`).join('')}\n  </url>`);
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
}catch{return new Response('Sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}})}}
