import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export function useSpeechRecognition(onResult?: (finalText: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const hasSubmittedRef = useRef(false);
  const accumulatedFinalRef = useRef('');

  // Keep latest onResult callback without restarting recognition instance
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setIsRequestingPermission(false);
      setError(null);
      hasSubmittedRef.current = false;
      accumulatedFinalRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          currentFinal += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }

      if (currentFinal) {
        accumulatedFinalRef.current += (accumulatedFinalRef.current ? ' ' : '') + currentFinal.trim();
        setTranscript(accumulatedFinalRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setIsRequestingPermission(false);

      if (event.error === 'no-speech') {
        setError('No speech was detected. Please click the microphone and try speaking again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone was found or microphone is busy. Please ensure your device is connected.');
      } else if (event.error === 'network') {
        setError('Network error occurred during speech recognition. Please check your connection.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsRequestingPermission(false);
      setInterimTranscript('');

      // Submit final recognized transcript exactly once if not yet submitted
      const finalText = accumulatedFinalRef.current.trim();
      if (finalText && !hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        if (onResultRef.current) {
          onResultRef.current(finalText);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Reset transcription buffers
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    hasSubmittedRef.current = false;
    accumulatedFinalRef.current = '';

    // Request microphone permission if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setIsRequestingPermission(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Clean up stream tracks immediately so speech recognition can access the audio device
        stream.getTracks().forEach(track => track.stop());
        setIsRequestingPermission(false);
      } catch (permErr: any) {
        setIsRequestingPermission(false);
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
        } else {
          setError(`Microphone access error: ${permErr.message || 'Permission denied'}`);
        }
        return;
      }
    }

    try {
      recognitionRef.current.start();
    } catch (startErr: any) {
      // In case start was called while already running
      if (startErr.name !== 'InvalidStateError') {
        console.warn('Speech recognition start error:', startErr);
        setError('Could not start microphone. Please try again.');
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.warn('Speech recognition stop warning:', err);
    }
  }, []);

  const cancelListening = useCallback(() => {
    if (!recognitionRef.current) return;
    hasSubmittedRef.current = true; // Prevent submission on abort
    accumulatedFinalRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    try {
      recognitionRef.current.abort();
    } catch {
      // ignore
    }
    setIsListening(false);
    setIsRequestingPermission(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening || isRequestingPermission) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isRequestingPermission, startListening, stopListening]);

  return {
    isListening,
    isRequestingPermission,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    toggleListening,
    clearError: () => setError(null),
  };
}
