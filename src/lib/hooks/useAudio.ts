'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ctxRef.current?.close();
    };
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }, [enabled, getCtx]);

  const playNumberDrawn = useCallback(() => {
    if (!enabled) return;
    // Ascending ping
    playTone(440, 0.12, 'sine', 0.2);
    setTimeout(() => playTone(660, 0.18, 'sine', 0.18), 100);
    setTimeout(() => playTone(880, 0.25, 'sine', 0.15), 200);
  }, [enabled, playTone]);

  const playMark = useCallback(() => {
    if (!enabled) return;
    playTone(523, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 80);
  }, [enabled, playTone]);

  const playBingo = useCallback(() => {
    if (!enabled) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 100);
    });
    // Fanfare chord
    setTimeout(() => {
      playTone(523, 0.8, 'sine', 0.15);
      playTone(659, 0.8, 'sine', 0.12);
      playTone(784, 0.8, 'sine', 0.10);
    }, 600);
  }, [enabled, playTone]);

  const playLose = useCallback(() => {
    if (!enabled) return;
    playTone(330, 0.3, 'sawtooth', 0.1);
    setTimeout(() => playTone(220, 0.5, 'sawtooth', 0.08), 250);
  }, [enabled, playTone]);

  const playShuffleBeep = useCallback(() => {
    if (!enabled) return;
    const freq = 200 + Math.random() * 400;
    playTone(freq, 0.05, 'square', 0.05);
  }, [enabled, playTone]);

  // Background music loop reference
  const musicRef = useRef<{ stop: () => void } | null>(null);

  const startMusic = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      let stopped = false;

      // Simple looping groove pattern
      const melody = [261, 293, 329, 349, 392, 349, 329, 293];
      const bass   = [130, 130, 146, 130, 164, 130, 146, 130];
      let step = 0;

      const tick = () => {
        if (stopped) return;
        const melFreq = melody[step % melody.length];
        const bassFreq = bass[step % bass.length];

        // Melody
        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        melOsc.connect(melGain);
        melGain.connect(ctx.destination);
        melOsc.type = 'triangle';
        melOsc.frequency.value = melFreq;
        melGain.gain.setValueAtTime(0.06, ctx.currentTime);
        melGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        melOsc.start(ctx.currentTime);
        melOsc.stop(ctx.currentTime + 0.35);

        // Bass
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.type = 'sine';
        bassOsc.frequency.value = bassFreq;
        bassGain.gain.setValueAtTime(0.04, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        bassOsc.start(ctx.currentTime);
        bassOsc.stop(ctx.currentTime + 0.4);

        step++;
        if (!stopped) setTimeout(tick, 400);
      };
      tick();

      musicRef.current = { stop: () => { stopped = true; } };
    } catch { /* ignore */ }
  }, [enabled, getCtx]);

  const stopMusic = useCallback(() => {
    musicRef.current?.stop();
    musicRef.current = null;
  }, []);

  // Voice announcement
  const announce = useCallback((text: string) => {
    if (!enabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    // Try to get a clearer English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  return { playNumberDrawn, playMark, playBingo, playLose, playShuffleBeep, startMusic, stopMusic, announce };
}
