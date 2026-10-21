import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Power,
  Volume2,
  Sun,
  Thermometer,
  Tv,
  Speaker,
  Monitor,
  Zap,
  BellRing,
  Wifi,
  Sparkles,
  Plus,
  Check,
  RefreshCw,
} from 'lucide-react';
import { api, SmartDevice, SuggestedDevice } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DevicesHubView: React.FC = () => {
  const { token } = useAuth();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingDeviceName, setConnectingDeviceName] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchDeviceData = async () => {
    setIsLoading(true);
    try {
      const [devRes, sugRes] = await Promise.all([
        api.getDevices(token),
        api.getSuggestedDevices(token),
      ]);
      setDevices(devRes.devices);
      setSuggestions(sugRes.suggestedDevices);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceData();
  }, [token]);

  const handleTogglePower = async (device: SmartDevice) => {
    const newPower = !device.settings.power;
    try {
      const res = await api.controlDevice(device.name, { power: newPower }, token);
      setDevices(prev => prev.map(d => (d.id === device.id ? res.device : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnect = async (deviceName: string) => {
    setConnectingDeviceName(deviceName);
    try {
      await api.connectDevice(deviceName, token);
      setFeedbackMessage(`Successfully paired and connected ${deviceName}!`);
      setTimeout(() => setFeedbackMessage(null), 3500);
      await fetchDeviceData();
    } catch (err) {
      console.error(err);
    } finally {
      setConnectingDeviceName(null);
    }
  };

  const handleBrightnessChange = async (device: SmartDevice, val: number) => {
    try {
      const res = await api.controlDevice(device.name, { brightness: val }, token);
      setDevices(prev => prev.map(d => (d.id === device.id ? res.device : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTempChange = async (device: SmartDevice, val: number) => {
    try {
      const res = await api.controlDevice(device.name, { temperature: val }, token);
      setDevices(prev => prev.map(d => (d.id === device.id ? res.device : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'echo_speaker':
        return <Speaker className="w-5 h-5 text-cyan-400" />;
      case 'echo_show':
        return <Monitor className="w-5 h-5 text-cyan-400" />;
      case 'smart_light':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'thermostat':
        return <Thermometer className="w-5 h-5 text-red-400" />;
      case 'tv':
        return <Tv className="w-5 h-5 text-purple-400" />;
      case 'smart_plug':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'doorbell':
        return <BellRing className="w-5 h-5 text-blue-400" />;
      default:
        return <Cpu className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Alexa<span className="text-cyan-400">+</span> Smart Home & Device Hub
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Control your connected ecosystem with Amazon Alexa Cast, Matter, Zigbee, and real-time device synchronization.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDeviceData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-cyan-300 text-xs font-semibold border border-gray-700 shrink-0 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Scan Network</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* SECTION 1: Connected Devices Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span>Active Connected Devices ({devices.filter(d => d.is_connected).length})</span>
          </h2>
          <span className="text-xs text-gray-400">PostgreSQL Isolated State</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map(device => {
            const isPowerOn = device.settings?.power ?? true;
            return (
              <div
                key={device.id}
                className={`bg-[#111827] border rounded-3xl p-5 shadow-xl transition-all space-y-4 ${
                  isPowerOn
                    ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,202,255,0.06)]'
                    : 'border-gray-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-gray-700 flex items-center justify-center">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white truncate">{device.name}</h3>
                      <p className="text-[11px] text-cyan-400">{device.room}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePower(device)}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isPowerOn
                        ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-black shadow-md'
                        : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                    }`}
                    title={isPowerOn ? 'Turn Off' : 'Turn On'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {/* Device Interactive Controls */}
                <div className="space-y-2 pt-2 border-t border-gray-800/80 text-xs text-gray-400">
                  {device.type === 'smart_light' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Brightness</span>
                        <span className="text-cyan-300 font-mono">{device.settings.brightness || 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={device.settings.brightness || 80}
                        onChange={e => handleBrightnessChange(device, Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  )}

                  {device.type === 'thermostat' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span>Target Climate</span>
                        <span className="text-red-300 font-mono font-bold">{device.settings.temperature || 71}°F</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="85"
                        value={device.settings.temperature || 71}
                        onChange={e => handleTempChange(device, Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-400"
                      />
                    </div>
                  )}

                  {(device.type === 'echo_speaker' || device.type === 'echo_show') && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Speaker Volume</span>
                      </span>
                      <span className="text-cyan-300 font-mono">{device.settings.volume || 65}%</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                    <span>Status: <strong className="text-emerald-400">Online</strong></span>
                    <span>Matter Certified</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Suggested Nearby Devices to Connect */}
      <div className="space-y-4 pt-4 border-t border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Suggested Compatible Devices Nearby</span>
            </h2>
            <p className="text-xs text-gray-400">
              Alexa automatically discovers compatible smart hardware in your home ready to link.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold self-start sm:self-auto">
            {suggestions.length} Discoverable Devices
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((sug, idx) => (
            <div
              key={idx}
              className="bg-[#111827]/70 border border-gray-800 hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#0B0F19] border border-cyan-500/30 flex items-center justify-center shrink-0">
                    {getDeviceIcon(sug.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{sug.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {sug.room}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{sug.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500">
                      <span>Signal: <strong className="text-cyan-400">{sug.signalStrength}</strong></span>
                      <span>•</span>
                      <span>Protocol: <strong className="text-gray-300">{sug.protocol}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between">
                <span className="text-[11px] text-cyan-300 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Recommended by Alexa+
                </span>
                <button
                  type="button"
                  onClick={() => handleConnect(sug.name)}
                  disabled={connectingDeviceName === sug.name}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {connectingDeviceName === sug.name ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pairing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Pair & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
