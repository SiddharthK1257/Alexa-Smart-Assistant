import { query } from '../db/supabase.js';
import { addCalendarEvent } from './calendarService.js';

export interface HotelListing {
  id: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  starRating: number;
  userRating: number;
  reviewsCount: number;
  pricePerNight: number;
  imageUrl: string;
  gallery: string[];
  roomTypes: Array<{
    type: string;
    price: number;
    bed: string;
    view: string;
  }>;
  amenities: string[];
  description: string;
  locationDetails: string;
}

export interface HotelBooking {
  id: string;
  user_id: string;
  hotel_name: string;
  destination: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  room_type: string;
  total_price: number;
  image_url: string;
  confirmation_code: string;
  rating: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  amenities: string[];
  created_at: string;
}

export const HOTEL_CATALOG: HotelListing[] = [
  {
    id: 'hotel-azure-horizon-santorini',
    name: 'The Grand Azure Horizon Cliffside Resort',
    destination: 'Santorini, Greece',
    city: 'Oia',
    country: 'Greece',
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1890,
    pricePerNight: 320,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Caldera Sunset Suite', price: 320, bed: '1 King Bed', view: 'Panoramic Aegean Caldera' },
      { type: 'Private Plunge Pool Villa', price: 490, bed: '1 Emperor Bed', view: 'Cliffside Infinity Edge' },
    ],
    amenities: ['Private Infinity Pool', 'Aegean Spa', 'Complimentary Champagne Breakfast', 'Free High-Speed Wi-Fi', 'Helipad Access'],
    description: 'Carved directly into the volcanic cliffs of Oia, offering private heated infinity pools, marble bathrooms, and legendary sunset views.',
    locationDetails: 'Cliff Path 4, Oia Village, Cyclades Islands',
  },
  {
    id: 'hotel-le-ritz-paris',
    name: 'Hôtel Palais Vendôme Paris',
    destination: 'Paris, France',
    city: 'Paris',
    country: 'France',
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 2450,
    pricePerNight: 410,
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Eiffel View Prestige Room', price: 410, bed: '1 King Bed', view: 'Eiffel Tower & Tuileries Garden' },
      { type: 'Imperial Haussmann Suite', price: 650, bed: '1 King + Salon', view: 'Place Vendôme' },
    ],
    amenities: ['Michelin Dining', 'Subterranean Heated Spa Pool', 'Butler Service', 'Complimentary Macarons', 'Designer Bathrobes'],
    description: 'Timeless Parisian glamour featuring gilded neoclassical molding, private garden courtyards, and Michelin-starred dining in the heart of Paris.',
    locationDetails: '15 Place Vendôme, 1st Arrondissement, Paris',
  },
  {
    id: 'hotel-tokyo-aman-zen',
    name: 'Aman Sky Sanctuary Tokyo',
    destination: 'Tokyo, Japan',
    city: 'Tokyo',
    country: 'Japan',
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1620,
    pricePerNight: 390,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Premier Mount Fuji View Suite', price: 390, bed: '1 King Futon Hybrid', view: 'Imperial Palace & Mt. Fuji' },
      { type: 'Dine-In Hinoki Onsen Suite', price: 580, bed: '2 Queen Beds', view: 'Tokyo Skyline' },
    ],
    amenities: ['Traditional Hinoki Wood Tub', '30m Sky Pool', 'Japanese Onsen Spa', 'Tea Ceremony Pavilion', 'High-Speed Wi-Fi'],
    description: 'An urban sanctuary occupying the top six floors of Otemachi Tower, crafted from washi paper, granite, and fragrant camphor wood.',
    locationDetails: 'The Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo',
  },
  {
    id: 'hotel-the-manhattan-skyline',
    name: 'The Central Park Penthouse Hotel',
    destination: 'New York, USA',
    city: 'New York City',
    country: 'United States',
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 3100,
    pricePerNight: 360,
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Skyline King Room', price: 360, bed: '1 King Bed', view: 'Central Park Treetops' },
      { type: 'Penthouse Balcony Suite', price: 590, bed: '1 California King', view: '360° Manhattan Skyline' },
    ],
    amenities: ['Rooftop Cocktail Lounge', 'Central Park Bicycle Concierge', 'Technogym Fitness Studio', 'Complimentary Espresso Bar'],
    description: 'Directly overlooking Central Park South, providing effortless access to Fifth Avenue luxury shopping, Broadway, and MoMA.',
    locationDetails: '110 Central Park South, New York, NY 10019',
  },
  {
    id: 'hotel-goa-taj-beachfront',
    name: 'The Oceanfront Palms Resort & Spa',
    destination: 'Goa, India',
    city: 'North Goa',
    country: 'India',
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1440,
    pricePerNight: 195,
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Arabian Sea Beach Cottage', price: 195, bed: '1 King Bed', view: 'Direct Beachfront Sand' },
      { type: 'Heritage Portuguese Pool Villa', price: 285, bed: '1 Four-Poster King', view: 'Tropical Garden & Private Pool' },
    ],
    amenities: ['Private Beach Access', 'Ayurvedic Wellness Spa', 'Lagoon Swimming Pool', 'Sunset Seafood Shack', 'Yoga Shala'],
    description: 'Nestled between swaying coconut groves and the warm Arabian Sea, featuring authentic Portuguese architecture and soothing spa therapies.',
    locationDetails: 'Sinquerim Beach Road, Candolim, North Goa 403515',
  },
];

export function searchHotels(
  destination?: string,
  minRating?: number,
  maxPrice?: number
): HotelListing[] {
  let list = [...HOTEL_CATALOG];

  if (destination) {
    const dest = destination.toLowerCase();
    list = list.filter(
      h =>
        h.destination.toLowerCase().includes(dest) ||
        h.city.toLowerCase().includes(dest) ||
        h.country.toLowerCase().includes(dest) ||
        h.name.toLowerCase().includes(dest)
    );
  }

  if (minRating) {
    list = list.filter(h => h.userRating >= minRating);
  }

  if (maxPrice) {
    list = list.filter(h => h.pricePerNight <= maxPrice);
  }

  return list.length > 0 ? list : HOTEL_CATALOG;
}

export async function bookHotel(
  userId: string,
  params: {
    hotelName: string;
    destination?: string;
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    guests?: number;
    roomType?: string;
  }
): Promise<{
  booking: HotelBooking;
  hotel: HotelListing;
  vocalConfirmation: string;
}> {
  // Find matching hotel
  const match = HOTEL_CATALOG.find(
    h =>
      h.name.toLowerCase().includes(params.hotelName.toLowerCase()) ||
      params.hotelName.toLowerCase().includes(h.name.toLowerCase()) ||
      (params.destination && h.destination.toLowerCase().includes(params.destination.toLowerCase()))
  ) || HOTEL_CATALOG[0];

  const guests = params.guests || 2;
  const room = params.roomType || match.roomTypes[0].type;
  const roomObj = match.roomTypes.find(r => r.type.toLowerCase().includes(room.toLowerCase())) || match.roomTypes[0];

  // Calculate nights
  const checkInDate = new Date(params.checkIn);
  const checkOutDate = new Date(params.checkOut);
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) || 3;
  const totalPrice = roomObj.price * nights;

  const confirmationCode = `HTL-${Math.floor(10000 + Math.random() * 90000)}`;

  // Save in database
  const res = await query<HotelBooking>(
    `INSERT INTO public.hotel_bookings (
       user_id, hotel_name, destination, check_in_date, check_out_date, guests, room_type, total_price, image_url, confirmation_code, rating, status, amenities
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed', $12)
     RETURNING *`,
    [
      userId,
      match.name,
      match.destination,
      params.checkIn,
      params.checkOut,
      guests,
      roomObj.type,
      totalPrice,
      match.imageUrl,
      confirmationCode,
      match.userRating,
      match.amenities,
    ]
  );

  const booking = res.rows[0];

  // Automatically add to Calendar!
  const startDateTime = `${params.checkIn}T15:00:00Z`; // 3 PM Check-in
  const endDateTime = `${params.checkOut}T11:00:00Z`; // 11 AM Check-out

  await addCalendarEvent(userId, {
    title: `Hotel Stay: ${match.name}`,
    event_type: 'hotel',
    start_time: startDateTime,
    end_time: endDateTime,
    location: `${match.locationDetails}, ${match.destination}`,
    description: `${roomObj.type} for ${guests} guests (${nights} nights). Confirmation: ${confirmationCode}. Amenities: ${match.amenities.slice(0, 3).join(', ')}. Total: $${totalPrice.toFixed(2)}.`,
    image_url: match.imageUrl,
    reference_id: confirmationCode,
    metadata: {
      destination: match.destination,
      nights,
      guests,
      roomType: roomObj.type,
      totalPrice,
      rating: match.userRating,
    },
  });

  const vocalConfirmation = `I have booked your stay at ${match.name} in ${match.destination} from ${params.checkIn} to ${params.checkOut}. Your confirmation code is ${confirmationCode}, and I have added this reservation directly to your Alexa+ calendar.`;

  return {
    booking,
    hotel: match,
    vocalConfirmation,
  };
}

export async function getUserHotelBookings(userId: string): Promise<HotelBooking[]> {
  const res = await query<HotelBooking>(
    `SELECT * FROM public.hotel_bookings WHERE user_id = $1 ORDER BY check_in_date DESC`,
    [userId]
  );
  return res.rows;
}
