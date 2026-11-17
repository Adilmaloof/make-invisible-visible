import type { ProductId } from './types';

export interface Stage {
  role: string;
  place: string;
  lat: number;
  lng: number;
  /** Approximate number of people whose labour touches one unit */
  people: number;
  /** Approximate labour-minutes embodied in one unit at this stage */
  minutes: number;
  detail: string;
}

export interface Product {
  id: ProductId;
  name: string;
  tagline: string;
  glyph: string;
  color: string;
  stages: Stage[];
}

/** Illustrative, research-informed estimates — designed to reveal scale, not to audit. */
export const PRODUCTS: Product[] = [
  {
    id: 'phone',
    name: 'Smartphone',
    tagline: 'One tap to order. Seven countries to build.',
    glyph: '◱',
    color: '#22f2ff',
    stages: [
      { role: 'Cobalt miner', place: 'Kolwezi, DR Congo', lat: -10.71, lng: 25.47, people: 42, minutes: 192, detail: 'Artisanal miners dig cobalt for the battery — often by hand, often unseen.' },
      { role: 'Lithium brine worker', place: 'Salar de Atacama, Chile', lat: -23.5, lng: -68.25, people: 18, minutes: 66, detail: 'Evaporation ponds in the driest desert on Earth yield battery lithium.' },
      { role: 'Rare-earth refiner', place: 'Baotou, China', lat: 40.66, lng: 109.84, people: 26, minutes: 84, detail: 'Neodymium for speakers and haptics is separated through dozens of chemical stages.' },
      { role: 'Chip-fab technician', place: 'Hsinchu, Taiwan', lat: 24.8, lng: 120.97, people: 60, minutes: 156, detail: 'Hundreds of process steps in clean rooms cleaner than operating theatres.' },
      { role: 'Assembly-line worker', place: 'Sriperumbudur, India', lat: 12.97, lng: 79.94, people: 180, minutes: 288, detail: 'Roughly 400 hand-operated steps bring the device together.' },
      { role: 'Port & customs crew', place: 'Nhava Sheva, India', lat: 18.95, lng: 72.95, people: 35, minutes: 54, detail: 'Crane operators, inspectors and truckers move it through the port.' },
      { role: 'Last-mile rider', place: 'Bengaluru, India', lat: 12.97, lng: 77.59, people: 4, minutes: 36, detail: 'A rider navigates traffic and weather to hand it to you.' },
    ],
  },
  {
    id: 'coffee',
    name: 'Cup of Coffee',
    tagline: 'Three minutes to drink. Nine months to grow.',
    glyph: '◒',
    color: '#ff7a1a',
    stages: [
      { role: 'Coffee farmer', place: 'Sidama, Ethiopia', lat: 6.75, lng: 38.4, people: 6, minutes: 9, detail: 'Smallholder farmers tend shade-grown coffee for most of the year.' },
      { role: 'Cherry pickers', place: 'Sidama, Ethiopia', lat: 6.2, lng: 38.9, people: 14, minutes: 12, detail: 'Ripe cherries are hand-picked, one by one, across multiple passes.' },
      { role: 'Export dock workers', place: 'Djibouti port', lat: 11.6, lng: 43.15, people: 9, minutes: 3, detail: 'Jute sacks are loaded by hand into shipping containers.' },
      { role: 'Sugar-cane cutter', place: 'Kolhapur, India', lat: 16.7, lng: 74.24, people: 5, minutes: 4, detail: 'Cane is cut by migrant labourers before dawn to beat the heat.' },
      { role: 'Paper-cup mill worker', place: 'Bhadrachalam, India', lat: 17.67, lng: 80.89, people: 4, minutes: 2, detail: 'Pulp becomes paperboard, then the cup in your hand.' },
      { role: 'Dairy farmer', place: 'Anand, India', lat: 22.56, lng: 72.93, people: 5, minutes: 6, detail: 'Milked at dawn, chilled and pooled through a cooperative.' },
      { role: 'Roaster & barista', place: 'Bengaluru, India', lat: 12.97, lng: 77.59, people: 4, minutes: 6, detail: 'Roasted, ground, pulled and poured — by people on their feet all day.' },
    ],
  },
  {
    id: 'tshirt',
    name: 'Cotton T-shirt',
    tagline: '₹499 on sale. 2,700 litres of water and 48 hands.',
    glyph: '◩',
    color: '#a855f7',
    stages: [
      { role: 'Cotton farmer', place: 'Vidarbha, India', lat: 20.7, lng: 77.0, people: 3, minutes: 22, detail: 'Rain-fed cotton, grown and picked by family farms under heavy debt.' },
      { role: 'Ginning worker', place: 'Rajkot, India', lat: 22.3, lng: 70.8, people: 4, minutes: 6, detail: 'Seeds are stripped from fibre in hot, loud ginning mills.' },
      { role: 'Spinning mill operator', place: 'Coimbatore, India', lat: 11.0, lng: 76.96, people: 6, minutes: 10, detail: 'Fibre is spun into yarn on machines that never stop.' },
      { role: 'Dyeing unit worker', place: 'Tiruppur, India', lat: 11.1, lng: 77.34, people: 5, minutes: 8, detail: 'Fabric is knitted and dyed — hands stained in every colour of the season.' },
      { role: 'Garment stitcher', place: 'Dhaka, Bangladesh', lat: 23.81, lng: 90.41, people: 9, minutes: 18, detail: 'A line of stitchers sews one shirt every few minutes, all day.' },
      { role: 'Port crew', place: 'Chattogram, Bangladesh', lat: 22.33, lng: 91.83, people: 12, minutes: 3, detail: 'Containers are stacked and shipped across the Bay of Bengal.' },
      { role: 'Warehouse picker', place: 'Bhiwandi, India', lat: 19.3, lng: 73.06, people: 7, minutes: 2, detail: 'Pickers walk 15+ km a shift finding your size.' },
      { role: 'Last-mile rider', place: 'Bengaluru, India', lat: 12.97, lng: 77.59, people: 2, minutes: 1, detail: 'Delivered to your door — often in under a day.' },
    ],
  },
  {
    id: 'package',
    name: 'Wireless Earbuds',
    tagline: 'Arrived in 24 hours. Travelled 22,000 km.',
    glyph: '◎',
    color: '#ff3d81',
    stages: [
      { role: 'Copper miner', place: 'Escondida, Chile', lat: -24.27, lng: -69.07, people: 20, minutes: 14, detail: 'Copper for the coils, mined from one of the largest pits on Earth.' },
      { role: 'Petrochemical worker', place: 'Jamnagar, India', lat: 22.47, lng: 70.06, people: 15, minutes: 5, detail: 'Crude oil becomes the plastic shell and the bubble wrap.' },
      { role: 'Component assembler', place: 'Shenzhen, China', lat: 22.54, lng: 114.06, people: 90, minutes: 35, detail: 'Microscopic drivers, batteries and chips assembled under magnification.' },
      { role: 'Port crane operator', place: 'Singapore', lat: 1.26, lng: 103.82, people: 14, minutes: 2, detail: 'Transhipped through the busiest port in the world.' },
      { role: 'Customs & freight', place: 'Chennai port, India', lat: 13.08, lng: 80.29, people: 10, minutes: 2, detail: 'Cleared, inspected and trucked inland overnight.' },
      { role: 'Sorting-hub staff', place: 'Hyderabad, India', lat: 17.39, lng: 78.49, people: 12, minutes: 3, detail: 'Night shifts sort millions of parcels by pin code.' },
      { role: 'Last-mile rider', place: 'Bengaluru, India', lat: 12.97, lng: 77.59, people: 3, minutes: 2, detail: 'The final 5 km — the only hands you actually see.' },
    ],
  },
];

export const productById = (id: ProductId) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

export const productTotals = (p: Product) => ({
  people: p.stages.reduce((s, x) => s + x.people, 0),
  minutes: p.stages.reduce((s, x) => s + x.minutes, 0),
  countries: new Set(p.stages.map((s) => s.place.split(',').pop()!.trim())).size,
});
