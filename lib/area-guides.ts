// Local context for the indexable /stays/<area> pages. Travel times are typical road times and
// change a lot with traffic, so they are written as ranges and labelled approximate on the page.
export type AreaGuide = {intro: string; gettingAround: string; goodFor: string; nearby: string[]};

export const puneGuide: AreaGuide = {
  intro: 'Pune is one of Maharashtra’s busiest cities for work trips, family visits, college admissions and weekend breaks. Most short-stay demand clusters in a few neighbourhoods: the east side around Koregaon Park, Kalyani Nagar and Viman Nagar sits close to the airport, while the west side around Baner, Pashan, Wakad and Hinjewadi sits close to the Hinjewadi IT park and the Mumbai–Pune Expressway. Picking the right side of the city matters more than almost anything else, because a cross-city drive at peak hours can easily take over an hour.',
  gettingAround: 'Pune International Airport is in Lohegaon, in the north-east of the city. Pune Junction is the main railway station, close to the old city centre. App cabs and autos are widely available across all the neighbourhoods on Gomzo, and parts of the city are served by the Pune Metro. Plan for heavier traffic on weekday mornings and evenings, especially on the roads to the IT parks.',
  goodFor: 'Business travellers usually choose a stay near their office (east side for Kharadi and Viman Nagar offices, west side for Hinjewadi and Baner). Families visiting relatives often prefer a 2 or 3 BHK apartment with a kitchen, and longer stays work well in a home with a workspace and washing machine.',
  nearby: ['Pune International Airport (Lohegaon)', 'Pune Junction railway station', 'Hinjewadi IT park', 'Mumbai–Pune Expressway'],
};

export const areaGuides: Record<string, AreaGuide> = {
  'koregaon-park': {
    intro: 'Koregaon Park is one of Pune’s greenest and best-known neighbourhoods, with tree-lined lanes, independent cafés, restaurants and boutiques around North Main Road and its numbered lanes. It is a popular choice for couples, solo travellers and anyone who wants to walk to places to eat in the evening rather than drive.',
    gettingAround: 'The airport in Lohegaon is roughly 6–8 km away (usually 20–40 minutes by road), and Pune Junction railway station is about 4 km away. Kalyani Nagar is just across the river, and Viman Nagar and the Kharadi offices are a short cab ride away.',
    goodFor: 'Leisure trips, short city breaks, couples and travellers who value cafés and greenery close to their door. Lanes can be quieter than the main roads, so ask the host about parking if you are driving.',
    nearby: ['North Main Road cafés and restaurants', 'Osho Teerth Park', 'Kalyani Nagar', 'Pune Junction railway station'],
  },
  'viman-nagar': {
    intro: 'Viman Nagar is a lively residential and commercial neighbourhood right next to the airport. It has large housing societies, plenty of restaurants and a big shopping mall nearby, and it is close to the offices in Kharadi and along Nagar Road.',
    gettingAround: 'Pune International Airport is roughly 2–4 km away, often a 10–20 minute drive, which makes Viman Nagar one of the easiest bases for early flights. Kharadi’s IT offices are about 5–7 km away, and Koregaon Park and Kalyani Nagar are a short cab ride.',
    goodFor: 'Business travellers, airport stopovers, people working in Kharadi or Nagar Road offices and families who want malls and restaurants close by.',
    nearby: ['Pune International Airport', 'Phoenix Marketcity mall', 'Kharadi IT offices', 'Symbiosis campus'],
  },
  'kalyani-nagar': {
    intro: 'Kalyani Nagar is an upscale, mostly residential neighbourhood on the east bank of the Mula-Mutha river, between Koregaon Park and Viman Nagar. It is known for its wide roads, popular restaurants and a calmer feel than the busier commercial streets around it.',
    gettingAround: 'The airport is about 5–7 km away (usually 15–30 minutes by road), and Koregaon Park is just across the river. Pune Junction railway station is roughly 6 km away, and the offices in Viman Nagar and Kharadi are within a short drive.',
    goodFor: 'Families and groups who want a spacious apartment in a quieter area, longer stays and travellers splitting time between the airport side of the city and Koregaon Park.',
    nearby: ['Koregaon Park', 'Aga Khan Palace', 'Viman Nagar', 'Nagar Road'],
  },
  baner: {
    intro: 'Baner is one of west Pune’s fastest-growing neighbourhoods, with modern apartment towers, offices, cafés and restaurants, including the Balewadi High Street dining area nearby. It sits along the Mumbai–Bengaluru highway, which makes it a practical base for the west-side IT corridor.',
    gettingAround: 'The Hinjewadi IT park is roughly 8–12 km away (often 25–45 minutes at peak hours), and the Mumbai–Pune Expressway is easy to reach. The airport is on the other side of the city, about 20 km away, so allow 45–75 minutes for airport transfers.',
    goodFor: 'Business travellers working in Hinjewadi, Baner or Balewadi, people driving in from Mumbai, and longer stays that need a workspace and modern apartment amenities.',
    nearby: ['Balewadi High Street', 'Hinjewadi IT park', 'Mumbai–Bengaluru highway', 'Pashan'],
  },
  wakad: {
    intro: 'Wakad is a busy residential suburb in north-west Pune, right next to Hinjewadi. It has large gated communities, schools, supermarkets and malls, and it is one of the most practical places to stay for people working in the IT park.',
    gettingAround: 'The Hinjewadi IT park is roughly 4–7 km away, and Wakad has quick access to the Mumbai–Pune Expressway and the Mumbai–Bengaluru highway. The airport is about 25 km away, so allow an hour or more for airport transfers at busy times.',
    goodFor: 'Working professionals in Hinjewadi, families relocating to west Pune who need a temporary home, and travellers arriving by road from Mumbai.',
    nearby: ['Hinjewadi IT park', 'Mumbai–Pune Expressway', 'Phoenix Mall of the Millennium', 'Pimpri-Chinchwad'],
  },
  hinjewadi: {
    intro: 'Hinjewadi is home to the Rajiv Gandhi Infotech Park, Pune’s largest IT hub, with campuses for many technology and services companies. Stays here are mostly modern apartments in the residential phases and surrounding areas.',
    gettingAround: 'Staying in Hinjewadi keeps your commute to the IT park short, which matters because the roads into the park are often congested at peak hours. Wakad and Baner are nearby, and the airport is about 25–30 km away, usually an hour or more by road.',
    goodFor: 'Project visits, training programmes, interns and new joiners who need a furnished home close to the office for a few weeks or months.',
    nearby: ['Rajiv Gandhi Infotech Park', 'Wakad', 'Baner', 'Mumbai–Pune Expressway'],
  },
  pashan: {
    intro: 'Pashan is a leafy, quieter neighbourhood in west Pune, close to Baner and the Sus–Pashan road. It is known for Pashan Lake and for its research and education institutions, and it feels calmer than the busier commercial corridors nearby.',
    gettingAround: 'Baner and Balewadi are a short drive away, and the Hinjewadi IT park is roughly 10–14 km away. The airport is on the other side of the city, about 20–22 km away, so allow 45–75 minutes for airport transfers.',
    goodFor: 'Travellers who want greenery and a quieter base in west Pune, academic visits to nearby institutes, and longer stays for families.',
    nearby: ['Pashan Lake', 'Baner', 'NCL and IISER Pune campuses', 'Sus Road'],
  },
};
