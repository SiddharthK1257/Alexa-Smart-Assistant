import { query } from '../db/supabase.js';
import { addCalendarEvent } from './calendarService.js';

export interface OpenTableAccount {
  id: string;
  user_id: string;
  email: string;
  phone?: string;
  full_name: string;
  is_linked: boolean;
  vip_status: boolean;
  dining_points: number;
  linked_at: string;
}

export interface RestaurantItem {
  id: string;
  name: string;
  cuisine: string;
  priceRange: '$$' | '$$$' | '$$$$';
  rating: number;
  reviewsCount: number;
  location: string;
  neighborhood: string;
  imageUrl: string;
  availableTimes: string[];
  description: string;
}

export interface RestaurantReservation {
  id: string;
  user_id: string;
  restaurant_name: string;
  cuisine: string;
  location: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  image_url: string;
  confirmation_code: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  special_requests?: string;
  created_at: string;
}

export const RESTAURANT_CATALOG: RestaurantItem[] = [
  {
    id: 'rest-osteria-del-mare',
    name: 'Osteria del Mare',
    cuisine: 'Contemporary Italian & Seafood',
    priceRange: '$$$',
    rating: 4.9,
    reviewsCount: 1420,
    location: 'Pier 7, Waterfront Promenade',
    neighborhood: 'Downtown Harbor',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    availableTimes: ['18:00', '18:30', '19:00', '19:30', '20:15', '21:00'],
    description: 'Michelin-recommended oceanfront dining featuring handmade pastas, crudo, and panoramic sunset views.',
  },
  {
    id: 'rest-nobu-lounge',
    name: 'Nobu Kaiseki & Sushi Lounge',
    cuisine: 'Modern Japanese & Omakase',
    priceRange: '$$$$',
    rating: 4.8,
    reviewsCount: 2310,
    location: '540 Grand Avenue, Sky Tower 32nd Fl',
    neighborhood: 'Financial District',
    imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&auto=format&fit=crop&q=80',
    availableTimes: ['17:30', '19:00', '20:30', '21:30'],
    description: 'Iconic yellowtail jalapeño, miso black cod, and curated craft cocktails in an architectural sanctuary.',
  },
  {
    id: 'rest-le-petit-bistro',
    name: 'Le Petit Zinc French Bistro',
    cuisine: 'Classic French Brasserie',
    priceRange: '$$',
    rating: 4.7,
    reviewsCount: 880,
    location: '124 Rue Lafayette Garden',
    neighborhood: 'Arts Quarter',
    imageUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop&q=80',
    availableTimes: ['18:15', '19:00', '19:45', '20:30'],
    description: 'Warm candlelight, duck confit, beef bourguignon, and an extensive cellar of natural French wines.',
  },
  {
    id: 'rest-el-fuego-moderno',
    name: 'El Fuego Asador & Tapas',
    cuisine: 'Modern Spanish & Basque Woodfire',
    priceRange: '$$$',
    rating: 4.8,
    reviewsCount: 1150,
    location: '88 Market Plaza',
    neighborhood: 'Mission Arts District',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    availableTimes: ['18:00', '18:45', '19:30', '20:45'],
    description: 'Live embers, Jamón Ibérico de Bellota, wood-charred octopus, and signature red sangria.',
  },
  {
    id: 'rest-greenhouse-botanical',
    name: 'The Botanical Glasshouse',
    cuisine: 'Farm-to-Table & Organic Californian',
    priceRange: '$$',
    rating: 4.9,
    reviewsCount: 760,
    location: '312 Conservatory Park Way',
    neighborhood: 'Garden Hills',
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&auto=format&fit=crop&q=80',
    availableTimes: ['17:45', '18:30', '19:15', '20:00', '20:45'],
    description: 'Dine under towering indoor ferns with organic seasonal produce sourced from local regenerative farms.',
  },
];

export async function getOpenTableAccount(userId: string): Promise<OpenTableAccount | null> {
  const res = await query<OpenTableAccount>(
    `SELECT * FROM public.opentable_accounts WHERE user_id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function linkOpenTableAccount(
  userId: string,
  data: { email: string; phone?: string; full_name?: string }
): Promise<OpenTableAccount> {
  const fullName = data.full_name || 'Alexa Diner';
  const phone = data.phone || '+1 (555) 789-0123';

  const res = await query<OpenTableAccount>(
    `INSERT INTO public.opentable_accounts (user_id, email, phone, full_name, is_linked, vip_status, dining_points, linked_at, updated_at)
     VALUES ($1, $2, $3, $4, true, true, 500, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE
     SET email = $2, phone = $3, full_name = $4, is_linked = true, updated_at = NOW()
     RETURNING *`,
    [userId, data.email, phone, fullName]
  );

  return res.rows[0];
}

export async function searchRestaurants(
  cuisineOrName?: string,
  location?: string
): Promise<RestaurantItem[]> {
  let list = [...RESTAURANT_CATALOG];

  if (cuisineOrName) {
    const q = cuisineOrName.toLowerCase();
    list = list.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }

  if (location) {
    const loc = location.toLowerCase();
    list = list.filter(
      r =>
        r.location.toLowerCase().includes(loc) ||
        r.neighborhood.toLowerCase().includes(loc)
    );
  }

  return list.length > 0 ? list : RESTAURANT_CATALOG;
}

export async function bookRestaurant(
  userId: string,
  params: {
    restaurantName: string;
    partySize?: number;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    specialRequests?: string;
  }
): Promise<{
  reservation: RestaurantReservation;
  restaurant: RestaurantItem;
  vocalConfirmation: string;
}> {
  // 1. Verify OpenTable Account is linked!
  const account = await getOpenTableAccount(userId);
  if (!account || !account.is_linked) {
    throw new Error(
      'OpenTable account required: You must link your OpenTable account before Alexa can make restaurant reservations on your behalf. Please connect OpenTable to proceed.'
    );
  }

  // 2. Find matching restaurant
  const match = RESTAURANT_CATALOG.find(
    r =>
      r.name.toLowerCase().includes(params.restaurantName.toLowerCase()) ||
      params.restaurantName.toLowerCase().includes(r.name.toLowerCase())
  ) || RESTAURANT_CATALOG[0];

  const partySize = params.partySize || 2;
  const confirmationCode = `OT-${Math.floor(10000 + Math.random() * 90000)}`;

  // 3. Save reservation in database
  const res = await query<RestaurantReservation>(
    `INSERT INTO public.restaurant_reservations (
       user_id, restaurant_name, cuisine, location, party_size, reservation_date, reservation_time, image_url, confirmation_code, status, special_requests
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed', $10)
     RETURNING *`,
    [
      userId,
      match.name,
      match.cuisine,
      match.location,
      partySize,
      params.date,
      params.time,
      match.imageUrl,
      confirmationCode,
      params.specialRequests || null,
    ]
  );

  const reservation = res.rows[0];

  // 4. Automatically add to Calendar!
  const startDateTime = `${params.date}T${params.time}:00Z`;
  // Default dining duration 2 hours
  const endDateTime = new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString();

  await addCalendarEvent(userId, {
    title: `Dinner at ${match.name} (OpenTable)`,
    event_type: 'restaurant',
    start_time: startDateTime,
    end_time: endDateTime,
    location: `${match.location}, ${match.neighborhood}`,
    description: `Confirmed reservation for ${partySize} guests. OpenTable confirmation: ${confirmationCode}. Special requests: ${params.specialRequests || 'None'}.`,
    image_url: match.imageUrl,
    reference_id: confirmationCode,
    metadata: {
      openTableAccount: account.email,
      partySize,
      cuisine: match.cuisine,
      priceTier: match.priceRange,
    },
  });

  const vocalConfirmation = `I have booked your table for ${partySize} at ${match.name} on ${params.date} at ${params.time}. Your OpenTable confirmation number is ${confirmationCode}, and I have added this reservation to your Alexa+ calendar.`;

  return {
    reservation,
    restaurant: match,
    vocalConfirmation,
  };
}

export async function getUserReservations(userId: string): Promise<RestaurantReservation[]> {
  const res = await query<RestaurantReservation>(
    `SELECT * FROM public.restaurant_reservations WHERE user_id = $1 ORDER BY reservation_date DESC, reservation_time DESC`,
    [userId]
  );
  return res.rows;
}
