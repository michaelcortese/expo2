import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isAnimating: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isAnimating }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context');
      return;
    }

    // Set up audio context and analyzer
    const setupAudio = () => {
      try {
        console.log('Setting up audio context...');
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 32;
        analyserRef.current.smoothingTimeConstant = 0.8;

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLAudioElement) {
                console.log('Found audio element:', node);
                connectAudioElement(node);
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        // Check for existing audio elements
        const existingAudio = document.querySelectorAll('audio');
        console.log('Found existing audio elements:', existingAudio.length);
        existingAudio.forEach(connectAudioElement);

        return () => observer.disconnect();
      } catch (error) {
        console.error('Error setting up audio analysis:', error);
      }
    };

    const connectAudioElement = (audioElement: HTMLAudioElement) => {
      if (!audioContextRef.current || !analyserRef.current) {
        console.warn('Audio context or analyzer not initialized');
        return;
      }

      try {
        console.log('Connecting audio element...');
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        console.log('Audio element connected successfully');
      } catch (error) {
        console.error('Error connecting audio element:', error);
      }
    };

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      console.log('Canvas setup complete:', { width: canvas.width, height: canvas.height });
    };

    setupCanvas();
    const cleanup = setupAudio();

    const draw = () => {
      if (!ctx || !canvas || !analyserRef.current || !dataArrayRef.current) {
        console.warn('Missing required refs for drawing');
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;
      const normalizedVolume = Math.min(Math.max(average / 128, 0), 1);

      // Debug log for volume
      if (normalizedVolume > 0) {
        console.log('Current volume:', normalizedVolume);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const dotSpacing = canvas.width / 4;
      const maxDotSize = 12;
      const minDotSize = 6;
      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-color').trim() || '#00ffcc';
      
      [0.8, 1, 0.8].forEach((scale, i) => {
        const x = dotSpacing * (i + 1);
        const dotSize = Math.max(0, (minDotSize + (maxDotSize - minDotSize) * normalizedVolume * scale) * 
          (isAnimating ? 1 : 0.5));

        if (!isFinite(x) || !isFinite(centerY) || !isFinite(dotSize)) {
          console.warn('Non-finite values detected in waveform drawing');
          return;
        }

        try {
          // Draw glow
          const gradient = ctx.createRadialGradient(
            Math.round(x), 
            Math.round(centerY), 
            0, 
            Math.round(x), 
            Math.round(centerY), 
            Math.round(dotSize * 2)
          );
          
          gradient.addColorStop(0, accentColor);
          gradient.addColorStop(0.5, `${accentColor}40`);
          gradient.addColorStop(1, 'transparent');
          
          ctx.beginPath();
          ctx.arc(x, centerY, dotSize * 2, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Draw dot
          ctx.beginPath();
          ctx.arc(x, centerY, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.fill();
        } catch (error) {
          console.error('Error drawing waveform:', error);
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isAnimating) {
      console.log('Starting animation...');
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (cleanup) cleanup();
    };
  }, [isAnimating]);

  return (
    <div className="waveform">
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent'
        }}
      />
    </div>
  );
}; 