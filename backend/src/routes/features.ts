import { Router, Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as deviceService from '../services/deviceService.js';
import * as musicService from '../services/musicService.js';
import * as recipeService from '../services/recipeService.js';
import * as openTableService from '../services/openTableService.js';
import * as hotelService from '../services/hotelService.js';
import * as calendarService from '../services/calendarService.js';

export const featuresRouter = Router();

// Protect all feature endpoints
featuresRouter.use(authenticateUser);

// --- 📱 DEVICES ENDPOINTS ---
featuresRouter.get('/devices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = await deviceService.getDevices(req.user!.id);
    res.json({ devices });
  } catch (err) {
    next(err);
  }
});

featuresRouter.get('/devices/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suggestions = await deviceService.getSuggestedDevices(req.user!.id);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/devices/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { device_name } = req.body;
    if (!device_name) return res.status(400).json({ error: 'device_name is required' });
    const device = await deviceService.connectDevice(req.user!.id, device_name);
    res.json({ success: true, device });
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/devices/control', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { device_name, ...settings } = req.body;
    if (!device_name) return res.status(400).json({ error: 'device_name is required' });
    const device = await deviceService.controlDevice(req.user!.id, device_name, settings);
    res.json({ success: true, device });
  } catch (err) {
    next(err);
  }
});

// --- 🎵 MUSIC PLAYBACK ENDPOINTS ---
featuresRouter.get('/music/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json({ tracks: [] });
    const tracks = await musicService.searchSpotifyTracks(q);
    res.json({ tracks });
  } catch (err) {
    next(err);
  }
});

featuresRouter.get('/music/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await musicService.getPlaybackStatus(req.user!.id);
    res.json(state);
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/music/play', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await musicService.playMusic(req.user!.id, req.body);
    res.json(state);
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/music/control', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, volume } = req.body;
    let state;
    if (action === 'pause') {
      state = await musicService.pauseMusic(req.user!.id);
    } else if (action === 'resume') {
      state = await musicService.resumeMusic(req.user!.id);
    } else if (action === 'next') {
      state = await musicService.nextTrack(req.user!.id);
    } else if (action === 'volume' && typeof volume === 'number') {
      state = await musicService.setVolume(req.user!.id, volume);
    } else {
      state = await musicService.getPlaybackStatus(req.user!.id);
    }
    res.json(state);
  } catch (err) {
    next(err);
  }
});

// --- 🍳 KITCHEN RECIPES ENDPOINTS ---
featuresRouter.get('/recipes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, cuisine, dietary } = req.query;
    const recipes = await recipeService.searchRecipes(
      query as string,
      cuisine as string,
      dietary as string
    );
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
});

featuresRouter.get('/recipes/:id', (req: Request, res: Response) => {
  const recipe = recipeService.getRecipeDetails(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  res.json({ recipe });
});

// --- 🍽️ OPENTABLE DINING ENDPOINTS ---
featuresRouter.get('/opentable/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await openTableService.getOpenTableAccount(req.user!.id);
    res.json({ isLinked: !!account?.is_linked, account });
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/opentable/link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, full_name } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    const account = await openTableService.linkOpenTableAccount(req.user!.id, {
      email,
      phone,
      full_name,
    });
    res.json({ success: true, account });
  } catch (err) {
    next(err);
  }
});

featuresRouter.get('/opentable/restaurants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cuisine, location } = req.query;
    const restaurants = await openTableService.searchRestaurants(
      cuisine as string,
      location as string
    );
    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/opentable/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurant_name, party_size, date, time, special_requests } = req.body;
    if (!restaurant_name || !date || !time) {
      return res.status(400).json({ error: 'restaurant_name, date, and time are required' });
    }
    const result = await openTableService.bookRestaurant(req.user!.id, {
      restaurantName: restaurant_name,
      partySize: party_size ? parseInt(party_size, 10) : 2,
      date,
      time,
      specialRequests: special_requests,
    });
    res.json(result);
  } catch (err: any) {
    if (err.message.includes('OpenTable account required')) {
      return res.status(403).json({ error: err.message, requiresOpenTable: true });
    }
    next(err);
  }
});

featuresRouter.get('/opentable/reservations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await openTableService.getUserReservations(req.user!.id);
    res.json({ reservations });
  } catch (err) {
    next(err);
  }
});

// --- 🏨 HOTEL & TRAVEL ENDPOINTS ---
featuresRouter.get('/hotels', (req: Request, res: Response) => {
  const { destination, min_rating, max_price, continent, nearest, lat, lng, place } = req.query;
  if (nearest === 'true' || (lat && lng) || place) {
    const parsedLat = lat ? parseFloat(lat as string) : undefined;
    const parsedLng = lng ? parseFloat(lng as string) : undefined;
    const hotels = hotelService.searchNearestHotels(parsedLat, parsedLng, (place || destination) as string);
    return res.json({ hotels });
  }

  const hotels = hotelService.searchHotels(
    destination as string,
    min_rating ? parseFloat(min_rating as string) : undefined,
    max_price ? parseFloat(max_price as string) : undefined,
    continent as string
  );
  res.json({ hotels });
});

featuresRouter.get('/hotels/nearest', (req: Request, res: Response) => {
  const { lat, lng, place } = req.query;
  const parsedLat = lat ? parseFloat(lat as string) : undefined;
  const parsedLng = lng ? parseFloat(lng as string) : undefined;
  const hotels = hotelService.searchNearestHotels(parsedLat, parsedLng, place as string);
  res.json({ hotels });
});

featuresRouter.post('/hotels/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotel_name, destination, check_in, check_out, guests, room_type } = req.body;
    if (!hotel_name || !check_in || !check_out) {
      return res.status(400).json({ error: 'hotel_name, check_in, and check_out are required' });
    }
    const result = await hotelService.bookHotel(req.user!.id, {
      hotelName: hotel_name,
      destination,
      checkIn: check_in,
      checkOut: check_out,
      guests: guests ? parseInt(guests, 10) : 2,
      roomType: room_type,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

featuresRouter.get('/hotels/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await hotelService.getUserHotelBookings(req.user!.id);
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// --- 📅 CALENDAR ENDPOINTS ---
featuresRouter.get('/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date } = req.query;
    const events = await calendarService.getCalendarEvents(
      req.user!.id,
      start_date as string,
      end_date as string
    );
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

featuresRouter.post('/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, event_type, start_time, end_time, location, description, image_url } = req.body;
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: 'title, start_time, and end_time are required' });
    }
    const event = await calendarService.addCalendarEvent(req.user!.id, {
      title,
      event_type: event_type || 'personal',
      start_time,
      end_time,
      location,
      description,
      image_url,
    });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
});
