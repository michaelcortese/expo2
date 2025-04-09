import React, { useState } from 'react';
import { useConversation } from '@11labs/react';

export const ElevenLabsChat: React.FC = () => {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (message: string) => {
      console.error('Error:', message);
      setError(message);
    }
  });

  const { status, isSpeaking } = conversation;

  const startChat = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicEnabled(true);
      
      // Start the conversation
      await conversation.startSession({
        agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopChat = async () => {
    try {
      await conversation.endSession();
      setIsMicEnabled(false);
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