import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';

export const ElevenLabsChat: React.FC = () => {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setError(null);
      setReconnectAttempts(0);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      // Attempt to reconnect if we were previously connected
      if (isMicEnabled && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
        setReconnectAttempts(prev => prev + 1);
        startChat();
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        setError('Connection lost. Please try again.');
        setIsMicEnabled(false);
      }
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (message: string) => {
      console.error('Error:', message);
      setError(message);
      
      // If it's a connection error, attempt to reconnect
      if (message.includes('connection') || message.includes('websocket')) {
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting to reconnect after error (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
          setReconnectAttempts(prev => prev + 1);
          startChat();
        }
      }
    }
  });

  const { status, isSpeaking } = conversation;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMicEnabled) {
        stopChat();
      }
    };
  }, []);

  const startChat = async () => {
    try {
      setError(null);
      
      // Request microphone access with specific constraints
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Adjust these values to make the microphone less sensitive
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16
        }
      });
      
      setIsMicEnabled(true);
      
      // Start the conversation
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to access microphone. Please check permissions.');
      setIsMicEnabled(false);
    }
  };

  const stopChat = async () => {
    try {
      await conversation.endSession();
      setIsMicEnabled(false);
      setReconnectAttempts(0);
    } catch (error) {
      console.error('Error stopping chat:', error);
      setError('Failed to stop chat.');
    }
  };

  return (
    <div className="chat-interface">
      <div className="status-indicator">
        {status === 'connected' && (
          <div className={`status-dot ${isSpeaking ? 'speaking' : 'listening'}`} />
        )}
        
        {error && (
          <div className="error-message">
            {error}
            {reconnectAttempts > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && (
              <div className="reconnect-message">
                Attempting to reconnect... ({reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="controls">
        {!isMicEnabled ? (
          <button 
            onClick={startChat}
            className="start-button"
            disabled={status === 'connected'}
          >
            Start Voice Chat
          </button>
        ) : (
          <button 
            onClick={stopChat}
            className="stop-button"
          >
            End Voice Chat
          </button>
        )}
      </div>
    </div>
  );
}; 