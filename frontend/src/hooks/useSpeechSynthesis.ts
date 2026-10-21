import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Prefer high-quality natural female or clear US English voices
      const preferred =
        availableVoices.find(
          v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Zira') ||
              v.name.includes('Samantha') ||
              v.name.includes('Aria') ||
              v.name.includes('Jenny'))
        ) ||
        availableVoices.find(v => v.lang.startsWith('en')) ||
        availableVoices[0];

      selectedVoiceRef.current = preferred || null;
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, ' Code snippet omitted for vocal output. ')
      // Convert markdown links [title](url) to title
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, ' ')
      // Remove raw JSON objects or arrays
      .replace(/\{[\s\S]*?\}/g, ' ')
      // Remove markdown header marks, bold, italics, strikethrough, backticks, bullet symbols
      .replace(/[#*_~`>]/g, '')
      .replace(/^[\s-–—*•]+/gm, '')
      // Collapse multiple whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (isMuted || !text.trim()) return;

      // Stop previous speech before speaking new answer
      window.speechSynthesis.cancel();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current;
      }
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        // Canceled errors are intentional when interrupted
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('SpeechSynthesis error:', e.error);
        }
        setIsSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Could not execute speech synthesis:', err);
        setIsSpeaking(false);
      }
    },
    [isMuted, rate]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  return {
    isSpeaking,
    isMuted,
    rate,
    voices,
    speak,
    stopSpeaking,
    toggleMute,
    setRate,
  };
}
