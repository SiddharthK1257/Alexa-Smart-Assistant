import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { query } from '../src/db/supabase.js';

describe('Alexa+ Extended Capabilities Test Suite', () => {
  let demoUserId: string;
  let testToken: string;

  beforeAll(async () => {
    // Find or seed demo user
    const userRes = await query(`SELECT id FROM auth.users WHERE email = 'alexa.demo@example.com' LIMIT 1`);
    if (userRes.rows.length > 0) {
      demoUserId = userRes.rows[0].id;
    } else {
      const inserted = await query(
        `INSERT INTO auth.users (email) VALUES ('alexa.demo@example.com') RETURNING id`
      );
      demoUserId = inserted.rows[0].id;
    }

    // Direct registration of an active token in accessTokenStore
    const { accessTokenStore } = await import('../src/oauth/alexaOAuth.js');
    testToken = `alexa_plus_test_token_${Date.now()}`;
    accessTokenStore.set(testToken, {
      userId: demoUserId,
      clientId: 'alexa-plus-client',
      scope: 'read write',
      expiresAt: Date.now() + 3600000,
    });
  });

  describe('1. 🎵 YouTube Music Playback & Audio Control', () => {
    it('GET /api/music/config returns YouTube API configuration metadata', async () => {
      const res = await request(app)
        .get('/api/music/config')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('configured');
      expect(res.body.source).toBe('YouTube');
      expect(res.body).toHaveProperty('message');
    });

    it('GET /api/music/status returns current YouTube playback track and state without Spotify fields', async () => {
      const res = await request(app)
        .get('/api/music/status')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('current_track');
      expect(res.body.current_track).toHaveProperty('title');
      expect(res.body.current_track).toHaveProperty('album_art');
      expect(res.body.current_track).toHaveProperty('videoId');
      expect(res.body.current_track).toHaveProperty('embed_url');
      expect(res.body.current_track).toHaveProperty('youtube_url');
      expect(res.body.current_track.source).toBe('YouTube');
      // Ensure obsolete Spotify keys are removed
      expect(res.body.current_track).not.toHaveProperty('spotify_id');
      expect(res.body.current_track).not.toHaveProperty('spotify_uri');
      expect(res.body.current_track).not.toHaveProperty('spotify_embed_url');
    });

    it('POST /api/music/play starts track or genre playback with YouTube video', async () => {
      const res = await request(app)
        .post('/api/music/play')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ query: 'jazz' });

      expect(res.status).toBe(200);
      expect(res.body.is_playing).toBe(true);
      expect(res.body.current_track.title.toLowerCase()).toContain('jazz');
      expect(res.body.current_track.source).toBe('YouTube');
      expect(res.body.current_track.youtube_url).toContain('youtube.com/watch');
      expect(res.body.current_track.embed_url).toContain('youtube.com/embed');
    });

    it('POST /api/music/control pauses, resumes, advances, and controls volume', async () => {
      const pauseRes = await request(app)
        .post('/api/music/control')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action: 'pause' });

      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.is_playing).toBe(false);

      const resumeRes = await request(app)
        .post('/api/music/control')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action: 'resume' });

      expect(resumeRes.status).toBe(200);
      expect(resumeRes.body.is_playing).toBe(true);

      const nextRes = await request(app)
        .post('/api/music/control')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action: 'next' });

      expect(nextRes.status).toBe(200);
      expect(nextRes.body.is_playing).toBe(true);
      expect(nextRes.body.current_track).toHaveProperty('videoId');

      const volRes = await request(app)
        .post('/api/music/control')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ action: 'volume', volume: 85 });

      expect(volRes.status).toBe(200);
      expect(volRes.body.volume).toBe(85);
    });

    it('GET /api/music/search handles query and missing API key gracefully', async () => {
      const res = await request(app)
        .get('/api/music/search?q=relaxing')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tracks');
      expect(Array.isArray(res.body.tracks)).toBe(true);
      expect(res.body).toHaveProperty('configured');
    });
  });

  describe('2. 🍳 Kitchen Recipes & Allergen Safety', () => {
    it('GET /api/recipes returns catalog with allergen and dietary safety profiles', async () => {
      const res = await request(app)
        .get('/api/recipes?query=salmon')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recipes).toBeInstanceOf(Array);
      expect(res.body.recipes.length).toBeGreaterThan(0);

      const recipe = res.body.recipes[0];
      expect(recipe).toHaveProperty('imageUrl');
      expect(recipe).toHaveProperty('allergenSafety');
      expect(recipe.allergenSafety).toHaveProperty('safetyRating');
      expect(recipe.allergenSafety).toHaveProperty('isSafeFor');
      expect(recipe.allergenSafety).toHaveProperty('cautionGroups');
      expect(recipe.allergenSafety).toHaveProperty('safetyNotice');
    });

    it('GET /api/recipes/:id returns detailed recipe steps and ingredients', async () => {
      const res = await request(app)
        .get('/api/recipes/recipe-thai-coconut-vegetable-curry')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recipe.title).toContain('Thai Coconut Curry');
      expect(res.body.recipe.ingredients.length).toBeGreaterThan(0);
      expect(res.body.recipe.instructions.length).toBeGreaterThan(0);
      expect(res.body.recipe.allergenSafety.safetyRating).toBe('Safe for All');
    });
  });

  describe('3. 📱 Connected Devices & Smart Home Discovery', () => {
    it('GET /api/devices returns user registered and connected devices', async () => {
      const res = await request(app)
        .get('/api/devices')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.devices).toBeInstanceOf(Array);
      expect(res.body.devices.length).toBeGreaterThan(0);
    });

    it('GET /api/devices/suggestions returns compatible nearby devices to connect', async () => {
      const res = await request(app)
        .get('/api/devices/suggestions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('suggestedDevices');
      expect(res.body.suggestedDevices).toBeInstanceOf(Array);
    });

    it('POST /api/devices/control adjusts power and brightness settings', async () => {
      const res = await request(app)
        .post('/api/devices/control')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ device_name: 'Philips Hue Ceiling Aura', power: true, brightness: 90 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.device.settings.brightness).toBe(90);
    });
  });

  describe('4. 🍽️ OpenTable Dining & Account Integration', () => {
    it('GET /api/opentable/account checks if OpenTable account is linked', async () => {
      const res = await request(app)
        .get('/api/opentable/account')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('isLinked');
    });

    it('GET /api/opentable/restaurants searches available dining venues', async () => {
      const res = await request(app)
        .get('/api/opentable/restaurants?cuisine=Italian')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.restaurants).toBeInstanceOf(Array);
      expect(res.body.restaurants[0]).toHaveProperty('imageUrl');
      expect(res.body.restaurants[0]).toHaveProperty('availableTimes');
    });

    it('POST /api/opentable/book reserves table and adds to calendar', async () => {
      const res = await request(app)
        .post('/api/opentable/book')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          restaurant_name: 'Osteria del Mare',
          party_size: 2,
          date: '2026-11-05',
          time: '19:30',
        });

      expect(res.status).toBe(200);
      expect(res.body.reservation).toHaveProperty('confirmation_code');
      expect(res.body).toHaveProperty('vocalConfirmation');
      expect(res.body.vocalConfirmation).toContain('calendar');

      // Check that it was saved to calendar
      const calRes = await request(app)
        .get('/api/calendar')
        .set('Authorization', `Bearer ${testToken}`);

      const matchingEvent = calRes.body.events.find(
        (e: any) => e.reference_id === res.body.reservation.confirmation_code
      );
      expect(matchingEvent).toBeDefined();
      expect(matchingEvent.event_type).toBe('restaurant');
    });
  });

  describe('5. 🏨 Hotel Bookings & Calendar Sync', () => {
    it('GET /api/hotels returns hotel listings with imagery and amenities', async () => {
      const res = await request(app)
        .get('/api/hotels?destination=Santorini')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.hotels).toBeInstanceOf(Array);
      expect(res.body.hotels[0]).toHaveProperty('imageUrl');
      expect(res.body.hotels[0].amenities).toBeInstanceOf(Array);
    });

    it('POST /api/hotels/book confirms stay, provides confirmation code, and adds to calendar', async () => {
      const res = await request(app)
        .post('/api/hotels/book')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          hotel_name: 'Hôtel Palais Vendôme Paris',
          destination: 'Paris, France',
          check_in: '2026-12-10',
          check_out: '2026-12-15',
          guests: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.booking).toHaveProperty('confirmation_code');
      expect(res.body.vocalConfirmation).toContain('calendar');

      // Verify presence in Calendar
      const calRes = await request(app)
        .get('/api/calendar')
        .set('Authorization', `Bearer ${testToken}`);

      const event = calRes.body.events.find(
        (e: any) => e.reference_id === res.body.booking.confirmation_code
      );
      expect(event).toBeDefined();
      expect(event.event_type).toBe('hotel');
      expect(event.title).toContain('Hôtel Palais Vendôme Paris');
    });
  });
});
