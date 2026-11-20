// Location helpers shared by search, URLs (/s/<place>/homes) and property pages (/rooms/<id>).
// A location "key" is what the search filter holds:
//   'All neighbourhoods'               → every home
//   'city|Pune|Maharashtra'            → a city
//   'area|Baner|Pune|Maharashtra'      → a neighbourhood in a city
//   'text|<words>'                     → free text typed by the guest
export const DEFAULT_CITY = 'Pune';
export const DEFAULT_STATE = 'Maharashtra';
export const ALL_PLACES = 'All neighbourhoods';

export const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];

export type Locatable = {area: string; city?: string; state?: string; name?: string};
export type Suggestion = {key: string; title: string; subtitle: string; kind: 'city' | 'area'};

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

/** Cities first, then neighbourhoods, matching what the guest typed (empty query lists everything). */
export function locationSuggestions(homes: Locatable[], query = '', limit = 8): Suggestion[] {
  const q = tidy(query).toLowerCase();
  const cities = new Map<string, Suggestion>(), areas = new Map<string, Suggestion>();
  for (const h of homes) {
    const city = cityOf(h), state = stateOf(h), area = titleCase(h.area);
    const ck = `${city}|${state}`.toLowerCase();
    if (!cities.has(ck)) cities.set(ck, {key: cityKey(city, state), title: `${city}, ${state}`, subtitle: 'City', kind: 'city'});
    const ak = `${area}|${city}`.toLowerCase();
    if (area && !areas.has(ak)) areas.set(ak, {key: areaKey(area, city, state), title: area, subtitle: `Neighbourhood · ${city}, ${state}`, kind: 'area'});
  }
  const score = (s: Suggestion) => {
    if (!q) return 1;
    const t = s.title.toLowerCase(), full = (s.title + ' ' + s.subtitle).toLowerCase();
    if (t.startsWith(q)) return 3;
    if (t.split(/[\s,]+/).some(w => w.startsWith(q))) return 2;
    return full.includes(q) ? 1 : 0;
  };
  return [...cities.values(), ...areas.values()]
    .map((s, i) => ({s, i, score: score(s)}))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map(x => x.s);
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
    return cityKey(home ? cityOf(home) : titleCase(parts[0]), home ? stateOf(home) : titleCase(parts[1]));
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
  return textKey(text);
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
