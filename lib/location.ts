// Location helpers shared by search, URLs (/s/<place>/homes) and property pages (/rooms/<id>).
// A location "key" is what the search filter holds:
//   'All neighbourhoods'               → every home
//   'city|Pune|Maharashtra'            → a city
//   'area|Baner|Pune|Maharashtra'      → a neighbourhood in a city
//   'text|<words>'                     → free text typed by the guest
import {INDIA_CITIES, PUNE_AREAS} from './india-places';
export const DEFAULT_CITY = 'Pune';
export const DEFAULT_STATE = 'Maharashtra';
export const ALL_PLACES = 'All neighbourhoods';

export const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

export type Locatable = {area: string; city?: string; state?: string; name?: string};
export type Suggestion = {key: string; title: string; subtitle: string; kind: 'city' | 'area'; homes?: number};

const tidy = (v: string) => v.trim().replace(/\s+/g, ' ');
const same = (a: string, b: string) => tidy(a).toLowerCase() === tidy(b).toLowerCase();
const titleCase = (v: string) => tidy(v).replace(/\b\w/g, c => c.toUpperCase());
export const cityOf = (p: Locatable) => tidy(p.city || '') || DEFAULT_CITY;
export const stateOf = (p: Locatable) => tidy(p.state || '') || DEFAULT_STATE;

export function cityKey(city: string, state: string) { return `city|${tidy(city)}|${tidy(state)}`; }
export function areaKey(area: string, city: string, state: string) { return `area|${tidy(area)}|${tidy(city)}|${tidy(state)}`; }
export function textKey(text: string) { return `text|${tidy(text)}`; }

export function parseKey(key: string) {
  const [kind, ...parts] = key.split('|');
  if (kind === 'city' && parts.length === 2) return {kind: 'city' as const, city: parts[0], state: parts[1]};
  if (kind === 'area' && parts.length === 3) return {kind: 'area' as const, area: parts[0], city: parts[1], state: parts[2]};
  if (kind === 'text' && parts.length >= 1) return {kind: 'text' as const, text: parts.join('|')};
  if (key && key !== ALL_PLACES) return {kind: 'area' as const, area: key, city: '', state: ''}; // legacy: a bare neighbourhood name
  return {kind: 'all' as const};
}

/** Short label for the search bar: "Pune, Maharashtra", "Baner, Pune" or the typed words. */
export function locationLabel(key: string) {
  const k = parseKey(key);
  if (k.kind === 'city') return `${k.city}, ${k.state}`;
  if (k.kind === 'area') return k.city ? `${k.area}, ${k.city}` : k.area;
  if (k.kind === 'text') return k.text;
  return '';
}

export function matchesLocation(home: Locatable, key: string) {
  const k = parseKey(key);
  if (k.kind === 'all') return true;
  if (k.kind === 'city') return same(cityOf(home), k.city) && same(stateOf(home), k.state);
  if (k.kind === 'area') return same(home.area, k.area) && (!k.city || same(cityOf(home), k.city));
  const words = tidy(k.text).toLowerCase().split(' ').filter(Boolean);
  const hay = [home.name || '', home.area, cityOf(home), stateOf(home)].join(' ').toLowerCase();
  return words.every(w => hay.includes(w));
}

/** Edit distance, used so small typos ("ahmedngar") still find the place. */
function distance(a: string, b: string) {
  const row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) { const tmp = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; }
  }
  return row[b.length];
}
function nameScore(q: string, names: string[]) {
  let best = 0;
  for (const raw of names) {
    const n = raw.toLowerCase();
    if (n.startsWith(q)) best = Math.max(best, 4);
    else if (n.split(/[\s,()-]+/).some(w => w.startsWith(q))) best = Math.max(best, 3);
    else if (q.length >= 4) {
      const allowed = q.length >= 7 ? 2 : 1;
      const d = Math.min(distance(q, n), distance(q, n.slice(0, q.length)), distance(q, n.slice(0, q.length + 1)));
      if (d <= allowed) best = Math.max(best, 2);
    }
  }
  return best;
}

/**
 * Places with Gomzo homes first (cities, then neighbourhoods), then any other Indian city or
 * Pune neighbourhood so guests can search anywhere; those show "coming soon".
 * An empty query lists only places that have homes.
 */
export function locationSuggestions(homes: Locatable[], query = '', limit = 8): Suggestion[] {
  const q = tidy(query).toLowerCase();
  type Entry = Suggestion & {names: string[]};
  const entries = new Map<string, Entry>();
  const add = (e: Entry) => { const id = e.key.toLowerCase(); const old = entries.get(id); if (old) { old.homes = (old.homes || 0) + (e.homes || 0); old.names.push(...e.names); } else entries.set(id, e); };
  for (const h of homes) {
    const city = cityOf(h), state = stateOf(h), area = titleCase(h.area);
    add({key: cityKey(city, state), title: `${city}, ${state}`, subtitle: 'City', kind: 'city', homes: 1, names: [city]});
    if (area) add({key: areaKey(area, city, state), title: area, subtitle: `Neighbourhood · ${city}, ${state}`, kind: 'area', homes: 1, names: [area]});
  }
  if (q) {
    for (const [name, state, aliases = []] of INDIA_CITIES) add({key: cityKey(name, state), title: `${name}, ${state}`, subtitle: 'City', kind: 'city', homes: 0, names: [name, ...aliases]});
    for (const area of PUNE_AREAS) add({key: areaKey(area, DEFAULT_CITY, DEFAULT_STATE), title: area, subtitle: `Neighbourhood · ${DEFAULT_CITY}, ${DEFAULT_STATE}`, kind: 'area', homes: 0, names: [area]});
  }
  const list = [...entries.values()].map((e, i) => ({e, i, score: q ? nameScore(q, e.names) : 1})).filter(x => x.score > 0);
  return list
    .sort((a, b) => b.score - a.score || Number(!!b.e.homes) - Number(!!a.e.homes) || Number(b.e.kind === 'city') - Number(a.e.kind === 'city') || a.i - b.i)
    .slice(0, limit)
    .map(({e}) => ({key: e.key, title: e.title, kind: e.kind, homes: e.homes || 0,
      subtitle: e.homes ? `${e.subtitle} · ${e.homes} ${e.homes === 1 ? 'home' : 'homes'}` : e.subtitle}));
}

/** Matches a typed place against the cities Gomzo knows, tolerating small typos. */
export function knownPlace(text: string): string | null {
  const q = tidy(text).toLowerCase();
  if (q.length < 3) return null;
  let best: {key: string; score: number} | null = null;
  for (const [name, state, aliases = []] of INDIA_CITIES) {
    const score = [name, ...aliases].some(n => n.toLowerCase() === q) ? 5 : nameScore(q, [name, ...aliases]);
    if (score >= 2 && (!best || score > best.score)) best = {key: cityKey(name, state), score};
  }
  return best?.key || null;
}

const slugPart = (v: string) => tidy(v).replace(/-/g, '~').replace(/ /g, '-');
const unslugPart = (v: string) => v.replace(/-/g, ' ').replace(/~/g, '-');

/** URL segment like Airbnb: "Pune--Maharashtra", "Baner--Pune--Maharashtra". */
export function locationSlug(key: string) {
  const k = parseKey(key);
  if (k.kind === 'city') return [k.city, k.state].map(slugPart).join('--');
  if (k.kind === 'area') return [k.area, k.city, k.state].filter(Boolean).map(slugPart).join('--');
  if (k.kind === 'text') return slugPart(k.text);
  return '';
}

/** Turns a URL segment back into a key, matching the casing used by live homes when possible. */
export function keyFromSlug(slug: string, homes: Locatable[] = []) {
  let raw = slug;
  try { raw = decodeURIComponent(slug); } catch {}
  const parts = raw.split('--').map(unslugPart).map(tidy).filter(Boolean);
  if (!parts.length) return ALL_PLACES;
  if (parts.length === 2) {
    const home = homes.find(h => same(cityOf(h), parts[0]) && same(stateOf(h), parts[1]));
    if (home) return cityKey(cityOf(home), stateOf(home));
    const known = INDIA_CITIES.find(([n, st]) => same(n, parts[0]) && same(st, parts[1]));
    return cityKey(known ? known[0] : titleCase(parts[0]), known ? known[1] : titleCase(parts[1]));
  }
  if (parts.length === 3) {
    const home = homes.find(h => same(h.area, parts[0]) && same(cityOf(h), parts[1]));
    return areaKey(home ? titleCase(home.area) : titleCase(parts[0]), home ? cityOf(home) : titleCase(parts[1]), home ? stateOf(home) : titleCase(parts[2]));
  }
  const text = parts.join(' ');
  const city = homes.find(h => same(cityOf(h), text));
  if (city) return cityKey(cityOf(city), stateOf(city));
  const area = homes.find(h => same(h.area, text));
  if (area) return areaKey(titleCase(area.area), cityOf(area), stateOf(area));
  return knownPlace(text) || textKey(text);
}

export type StayQuery = {checkIn?: string; checkOut?: string; guests?: number};
const isDate = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export function stayQueryString(q: StayQuery) {
  const p = new URLSearchParams();
  if (q.checkIn && isDate(q.checkIn)) p.set('check_in', q.checkIn);
  if (q.checkOut && isDate(q.checkOut)) p.set('check_out', q.checkOut);
  if (q.guests && q.guests > 0) p.set('adults', String(q.guests));
  const s = p.toString();
  return s ? '?' + s : '';
}

export function readStayQuery(search: string): StayQuery {
  const p = new URLSearchParams(search);
  const guests = Number(p.get('adults') || p.get('guests'));
  return {
    checkIn: isDate(p.get('check_in')) ? p.get('check_in')! : undefined,
    checkOut: isDate(p.get('check_out')) ? p.get('check_out')! : undefined,
    guests: Number.isInteger(guests) && guests > 0 && guests <= 20 ? guests : undefined,
  };
}

export function searchPath(key: string, q: StayQuery = {}) {
  const slug = locationSlug(key);
  return (slug ? `/s/${encodeURIComponent(slug).replace(/%2C/g, ',')}/homes` : '/') + stayQueryString(q);
}

export function roomPath(id: string, q: StayQuery = {}) {
  return `/rooms/${encodeURIComponent(id)}` + stayQueryString(q);
}

export function roomIdFromPath(pathname: string) {
  const m = pathname.match(/^\/rooms\/([A-Za-z0-9_-]{1,120})\/?$/);
  return m ? m[1] : null;
}

export function searchSlugFromPath(pathname: string) {
  const m = pathname.match(/^\/s\/([^/]{1,200})(?:\/homes)?\/?$/);
  return m ? m[1] : null;
}
