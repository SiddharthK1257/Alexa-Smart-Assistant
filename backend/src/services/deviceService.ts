import { query } from '../db/supabase.js';

export interface DeviceSettings {
  power?: boolean;
  volume?: number;
  brightness?: number;
  temperature?: number;
  mode?: string;
  color?: string;
  [key: string]: any;
}

export interface SmartDevice {
  id: string;
  user_id: string;
  name: string;
  type: 'echo_speaker' | 'echo_show' | 'smart_light' | 'thermostat' | 'smart_plug' | 'tv' | 'soundbar' | 'doorbell';
  room: string;
  is_connected: boolean;
  status: 'connected' | 'standby' | 'disconnected' | 'pairing';
  settings: DeviceSettings;
  created_at: string;
  updated_at: string;
}

// Nearby discoverable devices catalog that Alexa can proactively suggest
export const SUGGESTED_COMPATIBLE_DEVICES = [
  {
    name: 'Echo Show 10 (3rd Gen)',
    type: 'echo_show',
    room: 'Kitchen',
    description: 'Smart display with motion screen for following kitchen recipes hands-free',
    icon: 'Monitor',
    signalStrength: '98%',
    protocol: 'Matter / Thread & Wi-Fi 6',
  },
  {
    name: 'Echo Studio High-Fidelity',
    type: 'echo_speaker',
    room: 'Living Room',
    description: 'Immersive 3D audio speaker with Dolby Atmos and built-in Zigbee hub',
    icon: 'Speaker',
    signalStrength: '94%',
    protocol: 'Amazon Alexa Cast & Wi-Fi',
  },
  {
    name: 'Philips Hue Gradient Lightstrip',
    type: 'smart_light',
    room: 'Living Room',
    description: 'Dynamic reactive ambient lighting syncing with your music and entertainment',
    icon: 'Sun',
    signalStrength: '91%',
    protocol: 'Zigbee 3.0 / Bluetooth',
  },
  {
    name: 'Nest Learning Thermostat',
    type: 'thermostat',
    room: 'Hallway',
    description: 'Smart climate controller with eco-temperature scheduling',
    icon: 'Thermometer',
    signalStrength: '89%',
    protocol: 'Matter over Wi-Fi',
  },
  {
    name: 'Fire TV Stick 4K Max',
    type: 'tv',
    room: 'Bedroom',
    description: 'Streaming media player with hands-free Alexa voice control',
    icon: 'Tv',
    signalStrength: '85%',
    protocol: 'Wi-Fi 6E',
  },
  {
    name: 'Amazon Smart Plug',
    type: 'smart_plug',
    room: 'Kitchen Counter',
    description: 'Voice control for coffee makers, blenders, and countertop appliances',
    icon: 'Zap',
    signalStrength: '96%',
    protocol: 'Wi-Fi 2.4GHz',
  },
  {
    name: 'Ring Battery Video Doorbell Plus',
    type: 'doorbell',
    room: 'Front Porch',
    description: 'Head-to-toe HD video doorbell with package detection and two-way talk',
    icon: 'BellRing',
    signalStrength: '88%',
    protocol: 'Amazon Sidewalk & Wi-Fi',
  },
];

export async function getDevices(userId: string): Promise<SmartDevice[]> {
  const res = await query<SmartDevice>(
    `SELECT * FROM public.devices WHERE user_id = $1 ORDER BY is_connected DESC, room ASC, name ASC`,
    [userId]
  );

  // If user has no devices yet, automatically seed the initial set
  if (res.rows.length === 0) {
    const seedDevices = [
      {
        name: 'Echo Studio',
        type: 'echo_speaker',
        room: 'Living Room',
        is_connected: true,
        status: 'connected',
        settings: { power: true, volume: 65, audio_mode: 'spatial' },
      },
      {
        name: 'Echo Show 10',
        type: 'echo_show',
        room: 'Kitchen',
        is_connected: true,
        status: 'connected',
        settings: { power: true, volume: 70, screen_on: true },
      },
      {
        name: 'Philips Hue Ceiling Aura',
        type: 'smart_light',
        room: 'Living Room',
        is_connected: true,
        status: 'connected',
        settings: { power: true, brightness: 85, color: '#00CAFF' },
      },
      {
        name: 'Nest Smart Thermostat',
        type: 'thermostat',
        room: 'Hallway',
        is_connected: true,
        status: 'connected',
        settings: { power: true, temperature: 71, mode: 'eco' },
      },
    ];

    for (const d of seedDevices) {
      await query(
        `INSERT INTO public.devices (user_id, name, type, room, is_connected, status, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [userId, d.name, d.type, d.room, d.is_connected, d.status, JSON.stringify(d.settings)]
      );
    }

    const reFetch = await query<SmartDevice>(
      `SELECT * FROM public.devices WHERE user_id = $1 ORDER BY is_connected DESC, room ASC`,
      [userId]
    );
    return reFetch.rows;
  }

  return res.rows;
}

export async function getSuggestedDevices(userId: string) {
  const current = await getDevices(userId);
  const connectedNames = new Set(current.map(d => d.name.toLowerCase()));

  // Filter out any devices that are already registered
  const unlinked = SUGGESTED_COMPATIBLE_DEVICES.filter(
    s => !connectedNames.has(s.name.toLowerCase())
  );

  return {
    connectedCount: current.filter(d => d.is_connected).length,
    totalRegistered: current.length,
    suggestedDevices: unlinked,
  };
}

export async function connectDevice(userId: string, deviceNameOrId: string): Promise<SmartDevice> {
  // First check if device already exists in DB
  const existing = await query<SmartDevice>(
    `SELECT * FROM public.devices WHERE user_id = $1 AND (id::text = $2 OR LOWER(name) LIKE LOWER($3)) LIMIT 1`,
    [userId, deviceNameOrId, `%${deviceNameOrId}%`]
  );

  if (existing.rows.length > 0) {
    const updated = await query<SmartDevice>(
      `UPDATE public.devices 
       SET is_connected = true, status = 'connected', updated_at = NOW() 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [existing.rows[0].id, userId]
    );
    return updated.rows[0];
  }

  // Check if it's in the catalog of suggested devices
  const catalogMatch = SUGGESTED_COMPATIBLE_DEVICES.find(
    s => s.name.toLowerCase().includes(deviceNameOrId.toLowerCase()) || deviceNameOrId.toLowerCase().includes(s.type)
  ) || SUGGESTED_COMPATIBLE_DEVICES[0];

  const inserted = await query<SmartDevice>(
    `INSERT INTO public.devices (user_id, name, type, room, is_connected, status, settings)
     VALUES ($1, $2, $3, $4, true, 'connected', $5)
     RETURNING *`,
    [
      userId,
      catalogMatch.name,
      catalogMatch.type,
      catalogMatch.room,
      JSON.stringify({ power: true, volume: 70, brightness: 80, temperature: 72 }),
    ]
  );

  return inserted.rows[0];
}

export async function disconnectDevice(userId: string, deviceId: string): Promise<SmartDevice> {
  const res = await query<SmartDevice>(
    `UPDATE public.devices 
     SET is_connected = false, status = 'standby', updated_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [deviceId, userId]
  );
  if (res.rows.length === 0) throw new Error('Device not found');
  return res.rows[0];
}

export async function controlDevice(
  userId: string,
  deviceNameOrId: string,
  updates: DeviceSettings
): Promise<SmartDevice> {
  // Find device by UUID or by fuzzy name
  const existing = await query<SmartDevice>(
    `SELECT * FROM public.devices WHERE user_id = $1 AND (id::text = $2 OR LOWER(name) LIKE LOWER($3)) LIMIT 1`,
    [userId, deviceNameOrId, `%${deviceNameOrId}%`]
  );

  if (existing.rows.length === 0) {
    // If not found, connect it first
    const newDevice = await connectDevice(userId, deviceNameOrId);
    return await controlDevice(userId, newDevice.id, updates);
  }

  const device = existing.rows[0];
  const mergedSettings = { ...device.settings, ...updates };

  const res = await query<SmartDevice>(
    `UPDATE public.devices 
     SET settings = $1, is_connected = true, status = 'connected', updated_at = NOW() 
     WHERE id = $2 AND user_id = $3 
     RETURNING *`,
    [JSON.stringify(mergedSettings), device.id, userId]
  );

  return res.rows[0];
}
