import { query } from '../db/supabase.js';
import { addCalendarEvent } from './calendarService.js';

export interface HotelListing {
  id: string;
  name: string;
  destination: string;
  city: string;
  country: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  starRating: number;
  userRating: number;
  reviewsCount: number;
  pricePerNight: number;
  currencySymbol: string;
  currencyCode: string;
  formattedPrice: string;
  imageUrl: string;
  gallery: string[];
  roomTypes: Array<{
    type: string;
    price: number;
    formattedPrice: string;
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

// Curated Global Hotel Catalog with Exact Country Currencies & Pricing
export const HOTEL_CATALOG: HotelListing[] = [
  // --- INDIA (Prices in Indian Rupees ₹ INR) ---
  {
    id: 'hotel-taj-mahal-mumbai',
    name: 'The Taj Heritage Seafront Palace',
    destination: 'Mumbai, India',
    city: 'Mumbai',
    country: 'India',
    continent: 'Asia',
    latitude: 18.9217,
    longitude: 72.8332,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 4200,
    pricePerNight: 24500,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹24,500',
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Gateway View Palace King', price: 24500, formattedPrice: '₹24,500', bed: '1 King Bed', view: 'Gateway of India & Arabian Sea' },
      { type: 'Grand Luxury Rajput Suite', price: 42000, formattedPrice: '₹42,000', bed: '1 Heritage Four-Poster King', view: 'Harbour Sunset' },
    ],
    amenities: ['Jiva Ayurvedic Spa', 'Harbour Yacht Concierge', '10 Award-Winning Restaurants', 'Olympic Swimming Pool'],
    description: 'An architectural marvel standing gracefully opposite the Gateway of India since 1903, blending Moorish, Oriental, and Florentine styles.',
    locationDetails: 'Apollo Bunder, Colaba, Mumbai 400001',
  },
  {
    id: 'hotel-goa-taj-beachfront',
    name: 'The Oceanfront Palms Resort & Spa',
    destination: 'Goa, India',
    city: 'North Goa',
    country: 'India',
    continent: 'Asia',
    latitude: 15.5186,
    longitude: 73.7661,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1440,
    pricePerNight: 16500,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹16,500',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Arabian Sea Beach Cottage', price: 16500, formattedPrice: '₹16,500', bed: '1 King Bed', view: 'Direct Beachfront Sand' },
      { type: 'Heritage Portuguese Pool Villa', price: 28500, formattedPrice: '₹28,500', bed: '1 Four-Poster King', view: 'Tropical Garden & Private Pool' },
    ],
    amenities: ['Private Beach Access', 'Ayurvedic Wellness Spa', 'Lagoon Swimming Pool', 'Sunset Seafood Shack', 'Yoga Shala'],
    description: 'Nestled between swaying coconut groves and the warm Arabian Sea, featuring authentic Portuguese architecture and soothing spa therapies.',
    locationDetails: 'Sinquerim Beach Road, Candolim, North Goa 403515',
  },
  {
    id: 'hotel-leela-bangalore',
    name: 'The Leela Royal Palace Bengaluru',
    destination: 'Bangalore, India',
    city: 'Bengaluru',
    country: 'India',
    continent: 'Asia',
    latitude: 12.9606,
    longitude: 77.6484,
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 2100,
    pricePerNight: 18900,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹18,900',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Royal Premier Garden Room', price: 18900, formattedPrice: '₹18,900', bed: '1 King Bed', view: 'Lush 9-Acre Botanical Garden' },
      { type: 'Maharaja Royal Suite', price: 38000, formattedPrice: '₹38,000', bed: '1 Emperor Bed', view: 'Palatial Courtyard Waterfall' },
    ],
    amenities: ['Grand Vijayanagara Architecture', 'Spa by ESPA', 'Citrus All-Day Dining', 'Helipad Access'],
    description: 'Inspired by the Royal Palace of Mysore, set amidst nine acres of cascading waterfalls, sparkling lagoons, and lush gardens.',
    locationDetails: '23 HAL Old Airport Rd, Kodihalli, Bengaluru 560008',
  },
  {
    id: 'hotel-imperial-delhi',
    name: 'The Imperial Heritage Palace New Delhi',
    destination: 'New Delhi, India',
    city: 'New Delhi',
    country: 'India',
    continent: 'Asia',
    latitude: 28.6219,
    longitude: 77.2181,
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 1980,
    pricePerNight: 19500,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹19,500',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Art Deco Heritage Room', price: 19500, formattedPrice: '₹19,500', bed: '1 King Bed', view: 'Royal Palm Gardens' },
      { type: 'Viceroy Grand Suite', price: 39000, formattedPrice: '₹39,000', bed: '1 King Bed', view: 'Historic Janpath Boulevard' },
    ],
    amenities: ['Museum Art Collection', 'The Imperial Spa', 'San Gimignano Italian Fine Dining', 'Outdoor Pool'],
    description: 'A legendary grand hotel blending Victorian, colonial, and art deco heritage in the center of India’s capital.',
    locationDetails: 'Janpath, Connaught Place, New Delhi 110001',
  },
  {
    id: 'hotel-rambagh-palace-jaipur',
    name: 'Rambagh Palace Royal Heritage',
    destination: 'Jaipur, India',
    city: 'Jaipur',
    country: 'India',
    continent: 'Asia',
    latitude: 26.8979,
    longitude: 75.8074,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 3100,
    pricePerNight: 32000,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹32,000',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Palace Historical Room', price: 32000, formattedPrice: '₹32,000', bed: '1 Royal King Bed', view: 'Mughal Gardens & Peacocks' },
      { type: 'Grand Royal Maharani Suite', price: 65000, formattedPrice: '₹65,000', bed: '1 Emperor Four-Poster', view: 'Palace Courtyard' },
    ],
    amenities: ['Former Residence of Maharaja', 'Polo Bar & Fine Dining', 'Royal Jiva Grande Spa', 'Peacock Garden Strolls'],
    description: 'Known as the "Jewel of Jaipur", this authentic royal palace features marble corridors, sprawling gardens, and opulent royal suites.',
    locationDetails: 'Bhawani Singh Rd, Rambagh, Jaipur 302005',
  },
  {
    id: 'hotel-taj-lake-palace-udaipur',
    name: 'Taj Lake Palace Floating Sanctuary',
    destination: 'Udaipur, India',
    city: 'Udaipur',
    country: 'India',
    continent: 'Asia',
    latitude: 24.5756,
    longitude: 73.6797,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 2800,
    pricePerNight: 36000,
    currencySymbol: '₹',
    currencyCode: 'INR',
    formattedPrice: '₹36,000',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Luxury Lake View Room', price: 36000, formattedPrice: '₹36,000', bed: '1 King Bed', view: 'Lake Pichola & City Palace' },
      { type: 'Grand Royal Lake Suite', price: 72000, formattedPrice: '₹72,000', bed: '1 Royal Canopy King', view: '360° Lake Water Horizon' },
    ],
    amenities: ['Private Boat Arrival', 'Jharokha Lake Dining', 'Floating Royal Spa Boat', 'Heritage Astrological Sessions'],
    description: 'An iconic white marble marvel floating peacefully in the middle of Lake Pichola, built in 1746 as a prince’s summer getaway.',
    locationDetails: 'Pichola, Udaipur, Rajasthan 313001',
  },

  // --- UNITED STATES (Prices in US Dollars $ USD) ---
  {
    id: 'hotel-the-manhattan-skyline',
    name: 'The Central Park Penthouse Hotel',
    destination: 'New York, USA',
    city: 'New York City',
    country: 'United States',
    continent: 'Americas',
    latitude: 40.7651,
    longitude: -73.9763,
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 3100,
    pricePerNight: 360,
    currencySymbol: '$',
    currencyCode: 'USD',
    formattedPrice: '$360',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Skyline King Room', price: 360, formattedPrice: '$360', bed: '1 King Bed', view: 'Central Park Treetops' },
      { type: 'Penthouse Balcony Suite', price: 590, formattedPrice: '$590', bed: '1 California King', view: '360° Manhattan Skyline' },
    ],
    amenities: ['Rooftop Cocktail Lounge', 'Central Park Bicycle Concierge', 'Technogym Fitness Studio', 'Complimentary Espresso Bar'],
    description: 'Directly overlooking Central Park South, providing effortless access to Fifth Avenue luxury shopping, Broadway, and MoMA.',
    locationDetails: '110 Central Park South, New York, NY 10019',
  },
  {
    id: 'hotel-beverly-hills',
    name: 'The Beverly Hills Palm Court Hotel',
    destination: 'Los Angeles, USA',
    city: 'Los Angeles',
    country: 'United States',
    continent: 'Americas',
    latitude: 34.0815,
    longitude: -118.4145,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 2280,
    pricePerNight: 490,
    currencySymbol: '$',
    currencyCode: 'USD',
    formattedPrice: '$490',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Sunset Boulevard King Room', price: 490, formattedPrice: '$490', bed: '1 King Bed', view: 'Beverly Hills Palms & Gardens' },
      { type: 'Historic Hollywood Bungalow', price: 820, formattedPrice: '$820', bed: '1 King Bed + Private Patio', view: 'Tropical Garden' },
    ],
    amenities: ['Iconic Palm-Fringed Pool', 'Polo Lounge Dining', 'La Prairie Spa', 'Chauffeured House Car'],
    description: 'The "Pink Palace" has hosted cinema legends for over a century amidst 12 acres of lush tropical gardens on Sunset Boulevard.',
    locationDetails: '9641 Sunset Blvd, Beverly Hills, CA 90210',
  },

  // --- UNITED KINGDOM (Prices in British Pounds £ GBP) ---
  {
    id: 'hotel-ritz-london',
    name: 'The Royal Mayfair Grand Hotel London',
    destination: 'London, United Kingdom',
    city: 'London',
    country: 'United Kingdom',
    continent: 'Europe',
    latitude: 51.5071,
    longitude: -0.1416,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 3200,
    pricePerNight: 420,
    currencySymbol: '£',
    currencyCode: 'GBP',
    formattedPrice: '£420',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Piccadilly Deluxe King', price: 420, formattedPrice: '£420', bed: '1 King Bed', view: 'Green Park & Royal Buckingham' },
      { type: 'Royal Heritage Penthouse', price: 750, formattedPrice: '£750', bed: '1 Super King', view: 'Big Ben & London Skyline' },
    ],
    amenities: ['Traditional British High Tea', 'Rolls-Royce Chauffeur', 'Private Cigar Lounge', '24-Hour Concierge'],
    description: 'An iconic symbol of high British society and neoclassical elegance overlooking Green Park and Piccadilly.',
    locationDetails: '150 Piccadilly, St. James’s, London',
  },

  // --- FRANCE & EUROPE (Prices in Euros € EUR) ---
  {
    id: 'hotel-le-ritz-paris',
    name: 'Hôtel Palais Vendôme Paris',
    destination: 'Paris, France',
    city: 'Paris',
    country: 'France',
    continent: 'Europe',
    latitude: 48.8674,
    longitude: 2.3294,
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 2450,
    pricePerNight: 410,
    currencySymbol: '€',
    currencyCode: 'EUR',
    formattedPrice: '€410',
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Eiffel View Prestige Room', price: 410, formattedPrice: '€410', bed: '1 King Bed', view: 'Eiffel Tower & Tuileries Garden' },
      { type: 'Imperial Haussmann Suite', price: 650, formattedPrice: '€650', bed: '1 King + Salon', view: 'Place Vendôme' },
    ],
    amenities: ['Michelin Dining', 'Subterranean Heated Spa Pool', 'Butler Service', 'Complimentary Macarons', 'Designer Bathrobes'],
    description: 'Timeless Parisian glamour featuring gilded neoclassical molding, private garden courtyards, and Michelin-starred dining in the heart of Paris.',
    locationDetails: '15 Place Vendôme, 1st Arrondissement, Paris',
  },
  {
    id: 'hotel-azure-horizon-santorini',
    name: 'The Grand Azure Horizon Cliffside Resort',
    destination: 'Santorini, Greece',
    city: 'Oia',
    country: 'Greece',
    continent: 'Europe',
    latitude: 36.4618,
    longitude: 25.3753,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1890,
    pricePerNight: 320,
    currencySymbol: '€',
    currencyCode: 'EUR',
    formattedPrice: '€320',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Caldera Sunset Suite', price: 320, formattedPrice: '€320', bed: '1 King Bed', view: 'Panoramic Aegean Caldera' },
      { type: 'Private Plunge Pool Villa', price: 490, formattedPrice: '€490', bed: '1 Emperor Bed', view: 'Cliffside Infinity Edge' },
    ],
    amenities: ['Private Infinity Pool', 'Aegean Spa', 'Complimentary Champagne Breakfast', 'Free High-Speed Wi-Fi', 'Helipad Access'],
    description: 'Carved directly into the volcanic cliffs of Oia, offering private heated infinity pools, marble bathrooms, and legendary sunset views.',
    locationDetails: 'Cliff Path 4, Oia Village, Cyclades Islands',
  },

  // --- SWITZERLAND (Prices in Swiss Francs CHF) ---
  {
    id: 'hotel-omnia-swiss-alps',
    name: 'The Omnia Alpine Sanctuary Zermatt',
    destination: 'Zermatt, Switzerland',
    city: 'Zermatt',
    country: 'Switzerland',
    continent: 'Europe',
    latitude: 45.9765,
    longitude: 7.7491,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1120,
    pricePerNight: 480,
    currencySymbol: 'CHF',
    currencyCode: 'CHF',
    formattedPrice: 'CHF 480',
    imageUrl: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Matterhorn Panorama Suite', price: 480, formattedPrice: 'CHF 480', bed: '1 King Bed', view: 'Direct Unobstructed Matterhorn' },
      { type: 'Alpine Spa Chalet', price: 750, formattedPrice: 'CHF 750', bed: '1 Emperor Bed', view: 'Snowy Peak & Pine Forest' },
    ],
    amenities: ['Indoor/Outdoor Heated Pool with Matterhorn View', 'Finnish Pine Sauna', 'Ski-in Ski-out Access', 'Swiss Chocolate Bar'],
    description: 'Perched on a rock 45 meters above Zermatt, offering modern alpine design, open fireplaces, and unmatched Matterhorn vistas.',
    locationDetails: 'Auf dem Fels, 3920 Zermatt, Switzerland',
  },

  // --- JAPAN (Prices in Japanese Yen ¥ JPY) ---
  {
    id: 'hotel-tokyo-aman-zen',
    name: 'Aman Sky Sanctuary Tokyo',
    destination: 'Tokyo, Japan',
    city: 'Tokyo',
    country: 'Japan',
    continent: 'Asia',
    latitude: 35.6881,
    longitude: 139.7645,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 1620,
    pricePerNight: 52000,
    currencySymbol: '¥',
    currencyCode: 'JPY',
    formattedPrice: '¥52,000',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Premier Mount Fuji View Suite', price: 52000, formattedPrice: '¥52,000', bed: '1 King Futon Hybrid', view: 'Imperial Palace & Mt. Fuji' },
      { type: 'Dine-In Hinoki Onsen Suite', price: 85000, formattedPrice: '¥85,000', bed: '2 Queen Beds', view: 'Tokyo Skyline' },
    ],
    amenities: ['Traditional Hinoki Wood Tub', '30m Sky Pool', 'Japanese Onsen Spa', 'Tea Ceremony Pavilion'],
    description: 'An urban sanctuary occupying the top six floors of Otemachi Tower, crafted from washi paper, granite, and fragrant camphor wood.',
    locationDetails: 'The Otemachi Tower, 1-5-6 Otemachi, Chiyoda-ku, Tokyo',
  },

  // --- UAE (Prices in UAE Dirham AED) ---
  {
    id: 'hotel-burj-al-arab-dubai',
    name: 'Burj Al Arab Ocean Royal Suites',
    destination: 'Dubai, UAE',
    city: 'Dubai',
    country: 'United Arab Emirates',
    continent: 'Asia',
    latitude: 25.1412,
    longitude: 55.1852,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 3800,
    pricePerNight: 2400,
    currencySymbol: 'AED',
    currencyCode: 'AED',
    formattedPrice: 'AED 2,400',
    imageUrl: 'https://images.unsplash.com/photo-1512958789358-4dacacbe09c0?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Duplex Marina King Suite', price: 2400, formattedPrice: 'AED 2,400', bed: '1 King Bed', view: 'Arabian Gulf Horizon' },
      { type: 'Royal Two-Bedroom Penthouse', price: 4600, formattedPrice: 'AED 4,600', bed: '2 King Beds', view: '360° Dubai Skyline & Sea' },
    ],
    amenities: ['24-Karat Gold Plated Finishes', 'Private Beach Club', 'Rolls-Royce Phantom Fleet', 'Talise Spa'],
    description: 'The world-famous sail-shaped beacon of Arabian luxury standing on its own artificial island.',
    locationDetails: 'Jumeirah Beach Road, Umm Suqeim 3, Dubai',
  },

  // --- SINGAPORE (Prices in Singapore Dollars S$ SGD) ---
  {
    id: 'hotel-marina-bay-singapore',
    name: 'Marina Bay Sands SkyPark Resort',
    destination: 'Singapore',
    city: 'Singapore',
    country: 'Singapore',
    continent: 'Asia',
    latitude: 1.2847,
    longitude: 103.8610,
    starRating: 5,
    userRating: 4.8,
    reviewsCount: 4900,
    pricePerNight: 480,
    currencySymbol: 'S$',
    currencyCode: 'SGD',
    formattedPrice: 'S$480',
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Harbour View Deluxe King', price: 480, formattedPrice: 'S$480', bed: '1 King Bed', view: 'Gardens by the Bay' },
      { type: 'Skyline Orchid Suite', price: 750, formattedPrice: 'S$750', bed: '1 King Bed', view: 'Marina Bay & SkyCity' },
    ],
    amenities: ['57th Floor World’s Largest Rooftop Infinity Pool', 'Banyan Tree Spa', 'ArtScience Museum Entry', '20+ Celebrity Chef Dining'],
    description: 'Singapore’s most iconic landmark featuring the world-renowned 150m rooftop infinity pool overlooking Singapore skyline.',
    locationDetails: '10 Bayfront Avenue, Singapore 018956',
  },

  // --- AUSTRALIA (Prices in Australian Dollars A$ AUD) ---
  {
    id: 'hotel-park-hyatt-sydney',
    name: 'Park Hyatt Sydney Harbour',
    destination: 'Sydney, Australia',
    city: 'Sydney',
    country: 'Australia',
    continent: 'Oceania',
    latitude: -33.8550,
    longitude: 151.2100,
    starRating: 5,
    userRating: 4.9,
    reviewsCount: 2310,
    pricePerNight: 510,
    currencySymbol: 'A$',
    currencyCode: 'AUD',
    formattedPrice: 'A$510',
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    ],
    roomTypes: [
      { type: 'Opera House View Suite', price: 510, formattedPrice: 'A$510', bed: '1 King Bed', view: 'Direct Sydney Opera House' },
      { type: 'Harbour Balcony King', price: 760, formattedPrice: 'A$760', bed: '1 King Bed', view: 'Sydney Harbour Bridge' },
    ],
    amenities: ['Rooftop Pool & Private Sun Deck', 'Dedicated 24hr Butler Service', 'The Dining Room Restaurant', 'The Spa'],
    description: 'Coveted water’s edge location between Sydney Harbour Bridge and the world-famous Sydney Opera House in the historic Rocks district.',
    locationDetails: '7 Hickson Rd, The Rocks, Sydney NSW 2000, Australia',
  },
];

// Helper to determine country and currency for any city or query
export function getCountryAndCurrencyForPlace(placeName: string): {
  country: string;
  currencySymbol: string;
  currencyCode: string;
  priceRange: [number, number];
} {
  const p = placeName.toLowerCase();

  // India
  if (
    p.includes('india') ||
    p.includes('mumbai') ||
    p.includes('delhi') ||
    p.includes('bangalore') ||
    p.includes('bengaluru') ||
    p.includes('goa') ||
    p.includes('jaipur') ||
    p.includes('udaipur') ||
    p.includes('pune') ||
    p.includes('hyderabad') ||
    p.includes('chennai') ||
    p.includes('kolkata') ||
    p.includes('kerala') ||
    p.includes('kochi') ||
    p.includes('ahmedabad') ||
    p.includes('agra') ||
    p.includes('shimla') ||
    p.includes('manali')
  ) {
    return { country: 'India', currencySymbol: '₹', currencyCode: 'INR', priceRange: [7500, 26000] };
  }

  // United Kingdom
  if (p.includes('london') || p.includes('uk') || p.includes('united kingdom') || p.includes('england') || p.includes('edinburgh') || p.includes('manchester')) {
    return { country: 'United Kingdom', currencySymbol: '£', currencyCode: 'GBP', priceRange: [180, 480] };
  }

  // France / Eurozone
  if (p.includes('paris') || p.includes('france') || p.includes('nice') || p.includes('cannes') || p.includes('lyon')) {
    return { country: 'France', currencySymbol: '€', currencyCode: 'EUR', priceRange: [220, 520] };
  }
  if (p.includes('greece') || p.includes('santorini') || p.includes('athens') || p.includes('mykonos')) {
    return { country: 'Greece', currencySymbol: '€', currencyCode: 'EUR', priceRange: [190, 440] };
  }
  if (p.includes('italy') || p.includes('rome') || p.includes('milan') || p.includes('venice') || p.includes('florence')) {
    return { country: 'Italy', currencySymbol: '€', currencyCode: 'EUR', priceRange: [210, 490] };
  }
  if (p.includes('spain') || p.includes('barcelona') || p.includes('madrid') || p.includes('ibiza')) {
    return { country: 'Spain', currencySymbol: '€', currencyCode: 'EUR', priceRange: [170, 420] };
  }
  if (p.includes('germany') || p.includes('berlin') || p.includes('munich') || p.includes('frankfurt')) {
    return { country: 'Germany', currencySymbol: '€', currencyCode: 'EUR', priceRange: [160, 390] };
  }

  // Switzerland
  if (p.includes('switzerland') || p.includes('swiss') || p.includes('zermatt') || p.includes('zurich') || p.includes('geneva')) {
    return { country: 'Switzerland', currencySymbol: 'CHF', currencyCode: 'CHF', priceRange: [320, 680] };
  }

  // Japan
  if (p.includes('japan') || p.includes('tokyo') || p.includes('kyoto') || p.includes('osaka')) {
    return { country: 'Japan', currencySymbol: '¥', currencyCode: 'JPY', priceRange: [28000, 72000] };
  }

  // UAE
  if (p.includes('dubai') || p.includes('uae') || p.includes('emirates') || p.includes('abu dhabi')) {
    return { country: 'United Arab Emirates', currencySymbol: 'AED', currencyCode: 'AED', priceRange: [850, 2400] };
  }

  // Singapore
  if (p.includes('singapore')) {
    return { country: 'Singapore', currencySymbol: 'S$', currencyCode: 'SGD', priceRange: [280, 590] };
  }

  // Australia
  if (p.includes('australia') || p.includes('sydney') || p.includes('melbourne') || p.includes('brisbane')) {
    return { country: 'Australia', currencySymbol: 'A$', currencyCode: 'AUD', priceRange: [260, 580] };
  }

  // Canada
  if (p.includes('canada') || p.includes('toronto') || p.includes('vancouver') || p.includes('montreal')) {
    return { country: 'Canada', currencySymbol: 'C$', currencyCode: 'CAD', priceRange: [240, 520] };
  }

  // Default: United States
  return { country: 'United States', currencySymbol: '$', currencyCode: 'USD', priceRange: [210, 540] };
}

// Dynamic generator for ANY world city requested by the user
export function generateHotelsForRequestedCity(cityName: string): HotelListing[] {
  const cleanCity = cityName.charAt(0).toUpperCase() + cityName.slice(1).trim();
  const info = getCountryAndCurrencyForPlace(cleanCity);

  const images = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
  ];

  const p1 = Math.round(info.priceRange[0] * 1.05);
  const p2 = Math.round(info.priceRange[0] * 1.35);
  const p3 = Math.round(info.priceRange[1] * 0.95);

  const fmt = (val: number) => {
    return info.currencyCode === 'INR' || info.currencyCode === 'JPY'
      ? `${info.currencySymbol}${val.toLocaleString()}`
      : `${info.currencySymbol}${val}`;
  };

  return [
    {
      id: `hotel-dyn-${cleanCity.toLowerCase()}-1`,
      name: `The Grand Royal ${cleanCity} Palace & Spa`,
      destination: `${cleanCity}, ${info.country}`,
      city: cleanCity,
      country: info.country,
      continent: 'Global',
      starRating: 5,
      userRating: 4.9,
      reviewsCount: 1840,
      pricePerNight: p1,
      currencySymbol: info.currencySymbol,
      currencyCode: info.currencyCode,
      formattedPrice: fmt(p1),
      imageUrl: images[0],
      gallery: [images[1], images[2]],
      roomTypes: [
        { type: 'Palace Deluxe King', price: p1, formattedPrice: fmt(p1), bed: '1 King Bed', view: `${cleanCity} Historic City View` },
        { type: 'Imperial Panoramic Suite', price: Math.round(p1 * 1.6), formattedPrice: fmt(Math.round(p1 * 1.6)), bed: '1 Emperor Bed', view: 'Panoramic Horizon & Sunset' },
      ],
      amenities: ['Heated Infinity Pool', 'Michelin Star Dining', 'Full Holistic Spa', '24hr Concierge', 'Complimentary High Tea'],
      description: `Premier 5-star luxury haven in the center of ${cleanCity}, ${info.country}, offering bespoke butler service, panoramic views, and fine dining.`,
      locationDetails: `Grand Boulevard 1, ${cleanCity}, ${info.country}`,
    },
    {
      id: `hotel-dyn-${cleanCity.toLowerCase()}-2`,
      name: `${cleanCity} Horizon Bay Boutique Resort`,
      destination: `${cleanCity}, ${info.country}`,
      city: cleanCity,
      country: info.country,
      continent: 'Global',
      starRating: 5,
      userRating: 4.8,
      reviewsCount: 1220,
      pricePerNight: p2,
      currencySymbol: info.currencySymbol,
      currencyCode: info.currencyCode,
      formattedPrice: fmt(p2),
      imageUrl: images[1],
      gallery: [images[0], images[3]],
      roomTypes: [
        { type: 'Executive Sky View', price: p2, formattedPrice: fmt(p2), bed: '1 King Bed', view: `${cleanCity} Skyline` },
        { type: 'Presidential Penthouse', price: Math.round(p2 * 1.7), formattedPrice: fmt(Math.round(p2 * 1.7)), bed: '2 King Beds', view: '360° Cityscape' },
      ],
      amenities: ['Rooftop Sky Lounge', 'Private Jacuzzi Suite', 'Chauffeured Limousine', 'Fitness Club'],
      description: `Contemporary architectural luxury with sweeping floor-to-ceiling windows and designer furnishings in ${cleanCity}.`,
      locationDetails: `Waterfront Promenade, ${cleanCity}, ${info.country}`,
    },
    {
      id: `hotel-dyn-${cleanCity.toLowerCase()}-3`,
      name: `The Heritage Oasis ${cleanCity}`,
      destination: `${cleanCity}, ${info.country}`,
      city: cleanCity,
      country: info.country,
      continent: 'Global',
      starRating: 5,
      userRating: 4.8,
      reviewsCount: 960,
      pricePerNight: p3,
      currencySymbol: info.currencySymbol,
      currencyCode: info.currencyCode,
      formattedPrice: fmt(p3),
      imageUrl: images[2],
      gallery: [images[3], images[1]],
      roomTypes: [
        { type: 'Heritage Garden Suite', price: p3, formattedPrice: fmt(p3), bed: '1 Four-Poster King', view: 'Lush Botanical Courtyard' },
        { type: 'Royal Villa', price: Math.round(p3 * 1.5), formattedPrice: fmt(Math.round(p3 * 1.5)), bed: '1 King + Private Plunge Pool', view: 'Private Pool Garden' },
      ],
      amenities: ['Botanical Courtyard Gardens', 'Ayurvedic Wellness Sanctuary', 'Artisan Breakfast', 'Valet Parking'],
      description: `A tranquil sanctuary steeped in local culture and refined elegance in ${cleanCity}, ${info.country}.`,
      locationDetails: `Royal Crescent, ${cleanCity}, ${info.country}`,
    },
  ];
}

// Haversine formula to compute distance in km between two lat/lng coordinates
export function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function searchNearestHotels(
  lat?: number,
  lng?: number,
  userPlace?: string,
  limit: number = 6
): Array<HotelListing & { distanceKm?: number; distanceMiles?: number }> {
  // If user coordinates provided, compute exact distance
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    const list = HOTEL_CATALOG.map(h => {
      if (h.latitude && h.longitude) {
        const dKm = computeHaversineKm(lat, lng, h.latitude, h.longitude);
        const dMiles = Math.round(dKm * 0.621371 * 10) / 10;
        return {
          ...h,
          distanceKm: Math.round(dKm),
          distanceMiles: dMiles,
        };
      }
      return { ...h, distanceKm: 99999, distanceMiles: 99999 };
    });

    list.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

    // If nearest is within 400 miles, return matched
    if (list[0] && (list[0].distanceMiles ?? 99999) < 1500) {
      return list.slice(0, limit);
    }
  }

  // If city/place detected (e.g. user place or requested city)
  if (userPlace) {
    const p = userPlace.toLowerCase().trim();
    const matched = HOTEL_CATALOG.filter(
      h =>
        h.city.toLowerCase().includes(p) ||
        h.country.toLowerCase().includes(p) ||
        h.destination.toLowerCase().includes(p) ||
        h.name.toLowerCase().includes(p)
    );

    if (matched.length > 0) {
      return matched.slice(0, limit).map((h, i) => ({
        ...h,
        distanceMiles: Math.round((i * 2.3 + 1.2) * 10) / 10,
        distanceKm: Math.round((i * 3.7 + 1.9) * 10) / 10,
      }));
    }

    // Dynamic hotel generation for this place with correct country currency!
    const generated = generateHotelsForRequestedCity(userPlace);
    return generated.map((h, i) => ({
      ...h,
      distanceMiles: Math.round((i * 2.1 + 1.4) * 10) / 10,
      distanceKm: Math.round((i * 3.4 + 2.2) * 10) / 10,
    }));
  }

  // Default nearest list
  return HOTEL_CATALOG.slice(0, limit).map((h, i) => ({
    ...h,
    distanceMiles: Math.round((i * 4.2 + 2.1) * 10) / 10,
    distanceKm: Math.round((i * 6.8 + 3.4) * 10) / 10,
  }));
}

export function searchHotels(
  destination?: string,
  minRating?: number,
  maxPrice?: number,
  continent?: string
): HotelListing[] {
  let list = [...HOTEL_CATALOG];

  if (destination) {
    const dest = destination.toLowerCase().trim();
    const matched = list.filter(
      h =>
        h.destination.toLowerCase().includes(dest) ||
        h.city.toLowerCase().includes(dest) ||
        h.country.toLowerCase().includes(dest) ||
        h.name.toLowerCase().includes(dest)
    );

    if (matched.length > 0) {
      list = matched;
    } else {
      // Generate dynamic hotels for this requested destination with proper country pricing
      list = generateHotelsForRequestedCity(destination);
    }
  }

  if (continent && continent !== 'All') {
    const filtered = list.filter(h => h.continent?.toLowerCase() === continent.toLowerCase());
    if (filtered.length > 0) list = filtered;
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
  // Find matching hotel in catalog or generate for destination
  let match = HOTEL_CATALOG.find(
    h =>
      h.name.toLowerCase().includes(params.hotelName.toLowerCase()) ||
      params.hotelName.toLowerCase().includes(h.name.toLowerCase()) ||
      (params.destination && h.destination.toLowerCase().includes(params.destination.toLowerCase()))
  );

  if (!match) {
    const dest = params.destination || params.hotelName;
    const generated = generateHotelsForRequestedCity(dest);
    match = generated[0];
  }

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

  // Automatically add to Calendar
  const startDateTime = `${params.checkIn}T15:00:00Z`; // 3 PM Check-in
  const endDateTime = `${params.checkOut}T11:00:00Z`; // 11 AM Check-out

  const formattedTotal = `${match.currencySymbol}${totalPrice.toLocaleString()}`;

  await addCalendarEvent(userId, {
    title: `Hotel Stay: ${match.name}`,
    event_type: 'hotel',
    start_time: startDateTime,
    end_time: endDateTime,
    location: `${match.locationDetails}, ${match.destination}`,
    description: `${roomObj.type} for ${guests} guests (${nights} nights). Confirmation: ${confirmationCode}. Amenities: ${match.amenities.slice(0, 3).join(', ')}. Total: ${formattedTotal}.`,
    image_url: match.imageUrl,
    reference_id: confirmationCode,
    metadata: {
      destination: match.destination,
      nights,
      guests,
      roomType: roomObj.type,
      totalPrice,
      currencySymbol: match.currencySymbol,
      currencyCode: match.currencyCode,
      rating: match.userRating,
    },
  });

  const vocalConfirmation = `I have booked your stay at ${match.name} in ${match.destination} (${match.country}) from ${params.checkIn} to ${params.checkOut} for ${formattedTotal}. Your confirmation code is ${confirmationCode}, and I have added this reservation directly to your Alexa+ calendar.`;

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