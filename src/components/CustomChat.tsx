import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@11labs/react';

const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

export const CustomChat: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for audio visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize the conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      setIsActive(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      setIsActive(false);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setErrorMessage('Connection error occurred');
      setIsActive(false);
    }
  });

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only respond to 'b' key press
      if (event.key.toLowerCase() === 'b') {
        // Prevent default behavior (like scrolling)
        event.preventDefault();
        
        // Toggle voice chat
        if (isActive) {
          stopVoiceChat();
        } else {
          startVoiceChat();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isActive]); // Re-run when isActive changes

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
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
      
      // Start the conversation session
      await conversation.startSession({ agentId: ELEVENLABS_AGENT_ID });
      
    } catch (error) {
      console.error('Error starting voice chat:', error);
      setErrorMessage('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceChat = async () => {
    try {
      await conversation.endSession();
      
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
      setErrorMessage(null);
    } catch (error) {
      console.error('Error stopping voice chat:', error);
      setErrorMessage('Error stopping voice chat');
    }
  };

  return (
    <div className="chat-interface">
      <div className="status-indicator">
        {conversation.status === 'connecting' && (
          <div className="processing-indicator">
            <div className="pulse"></div>
            <span>Connecting...</span>
          </div>
        )}
        
        {conversation.status === 'connected' && (
          <div className="status-dot active"></div>
        )}
        
        {conversation.status === 'disconnected' && (
          <div className="status-dot"></div>
        )}
        
        {errorMessage && (
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
            disabled={conversation.status === 'connecting'}
          >
            Start Chat
          </button>
        ) : (
          <button 
            onClick={stopVoiceChat}
            className="stop-button"
          >
            Stop Chat
          </button>
        )}
      </div>
    </div>
  );
}; 