import React, { useEffect, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';

interface ElevenLabsWidgetProps {
  agentId: string;
}

export const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ agentId }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initWidget = () => {
      // Create the widget element
      const widget = document.createElement('elevenlabs-convai');
      widget.setAttribute('agent-id', agentId);
      
      // Add it to our container
      const container = document.getElementById('elevenlabs-widget-container');
      if (container) {
        container.appendChild(widget);
        setIsLoading(false);
      }
    };

    // Wait for the script to load
    if (document.readyState === 'complete') {
      initWidget();
    } else {
      window.addEventListener('load', initWidget);
    }

    // Cleanup on unmount
    return () => {
      const container = document.getElementById('elevenlabs-widget-container');
      if (container) {
        container.innerHTML = '';
      }
      window.removeEventListener('load', initWidget);
    };
  }, [agentId]);

  return (
    <Box
      id="elevenlabs-widget-container"
      position="fixed"
      bottom="20px"
      right="20px"
      zIndex={1000}
      minHeight="100px"
      minWidth="100px"
    >
      {isLoading && (
        <Box textAlign="center" p={4}>
          <Spinner />
          <Text mt={2}>Loading chat widget...</Text>
        </Box>
      )}
    </Box>
  );
}; 