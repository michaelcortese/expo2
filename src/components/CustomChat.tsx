import React, { useState, useRef, useEffect } from 'react';

// Define the ElevenLabs API key - replace with your actual key
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

export const CustomChat: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Function to visualize audio
  const visualizeAudio = () => {
    if (!analyserRef.current || !audioDataRef.current) return;
    
    analyserRef.current.getByteFrequencyData(audioDataRef.current);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  };

  const startVoiceChat = async () => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up audio context and analyzer for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 32;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Create data array for visualization
      const bufferLength = analyser.frequencyBinCount;
      audioDataRef.current = new Uint8Array(bufferLength);
      
      // Start visualization
      visualizeAudio();
      
      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // Create audio blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            
            if (!base64Audio) {
              throw new Error('Failed to convert audio to base64');
            }

            // Send to ElevenLabs API
            const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
              method: 'POST',
              headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
              },
              body: JSON.stringify({
                text: "I'm processing your voice input. This is a test response.",
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.5
                }
              })
            });

            if (!response.ok) {
              throw new Error('Failed to get AI response');
            }

            // Get the audio blob from the response
            const audioBlob = await response.blob();
            
            // Create and play the audio
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              setStatus('active');
            };

            audio.play().catch(error => {
              console.error('Error playing audio:', error);
              setStatus('error');
              setErrorMessage('Failed to play AI response');
            });
          };
        } catch (error) {
          console.error('Error processing audio:', error);
          setStatus('error');
          setErrorMessage('Failed to process audio');
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsActive(true);
      
    } catch (error) {
      console.error('Error starting voice chat:', error);
      setStatus('error');
      setErrorMessage('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceChat = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsActive(false);
    setStatus('idle');
    setErrorMessage(null);
  };

  return (
    <div className="chat-interface">
      <div className="status-indicator">
        {status === 'connecting' && (
          <div className="processing-indicator">
            <div className="pulse"></div>
            <span>Connecting...</span>
          </div>
        )}
        
        {status === 'active' && (
          <div className="status-dot active"></div>
        )}
        
        {status === 'idle' && (
          <div className="status-dot"></div>
        )}
        
        {status === 'error' && (
          <div className="error-indicator">
            <span>⚠️</span>
          </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="controls">
        {!isActive ? (
          <button 
            onClick={startVoiceChat}
            className="start-button"
            disabled={status === 'connecting'}
          >
            Start Voice Chat
          </button>
        ) : (
          <button 
            onClick={stopVoiceChat}
            className="stop-button"
          >
            End Voice Chat
          </button>
        )}
      </div>
    </div>
  );
}; 