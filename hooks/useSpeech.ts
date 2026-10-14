import { useEffect, useRef, useState } from 'react';
import { generateSpeech, getAudioContext } from '../services/geminiService';
import { classifyError } from '../services/quota';

export const useSpeech = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);

  const stop = () => {
    try {
      source.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    source.current = null;
    setStatus('idle');
  };

  useEffect(() => stop, []);

  const toggle = async (text: string) => {
    if (status === 'playing') return stop();
    if (status === 'loading' || !text) return;
    setError(null);
    setStatus('loading');
    try {
      const buffer = await generateSpeech(text);
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(ctx.destination);
      node.onended = () => {
        if (source.current === node) setStatus('idle');
      };
      source.current = node;
      node.start(0);
      setStatus('playing');
    } catch (e) {
      const err = classifyError(e);
      setError(
        err.kind === 'rate_minute' || err.kind === 'rate_day'
          ? 'Quota de voix épuisé pour le moment.'
          : err.message
      );
      setStatus('idle');
    }
  };

  return { status, error, toggle, stop };
};
