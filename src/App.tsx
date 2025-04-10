import React, { useState, useEffect } from 'react';
import { CustomChat } from './components/CustomChat';
import { StarField } from './components/StarField';
import './App.css';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalPages = 3;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isTransitioning) return; // Prevent rapid transitions
      
      if (event.key.toLowerCase() === 'a') {
        setIsTransitioning(true);
        setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
      } else if (event.key.toLowerCase() === 'c') {
        setIsTransitioning(true);
        setCurrentPage(prev => (prev + 1) % totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isTransitioning]);

  const pages = [
    {
      title: "KappaTron",
      description: "Chat with AI and learn about space.",
      showChat: true
    },
    {
      title: "How KappaTron was made",
      description: `1. Voice Synthesis
We recorded high-quality voice samples and trained a neural network to replicate our brother's vocal patterns.

2. AI Integration
Implemented ElevenLabs' voice cloning API with custom parameters for optimal voice matching and natural speech synthesis.

3. Web Development
Built a React.js application with TypeScript, implementing real-time audio streaming and WebSocket connections for seamless voice interaction.

4. Testing & Launch
Conducted extensive testing with brothers, fine-tuning the voice parameters and conversation flow for a natural experience.`,
      image: "/logo.png",
      isLongText: true,
      isSquareImage: true
    },
    {
      title: "About Kappa Eta Kappa",
      description: `Delta chapter of Kappa Eta Kappa (KHK) was founded at the University of Wisconsin as an electrical engineering fraternity on February 9th, 1924. Many years have gone by and the chapter is still going strong. Today many of our members also study computer engineering, computer science and other technical programs.

Our location has changed a few times over the many years. Today we're located right on campus at 114 N. Orchard St. in Madison Wisconsin. This house has been great for us. It's a block away from CS, two blocks from Engineering Dr. and a block away from Camp Randall.

Our Members have a high reputation for starting successful careers right out of school. Many of them immediately start work in industry. Others go on to graduate programs at the UW and elsewhere. Some recent talent has gone off to big companies such as Google, Qualcomm, and Northrop Grumman. Some have been fortunate to stay local at places like Epic, X-ES Engineering, and Hardin Design and Development.

Here at KHK, we build life-long relationships. Through tradition and legacy, we're close enough to call ourselves a family. We support each other academically and personally. As part of our mission, we know that social growth is just as important as professional growth. We are always engaging with the community. Our house has an open door for Badger gamedays and other socials.`,
      image: "/khk.jpeg",
      isLongText: true
    }
  ];

  return (
    <div className="app">
      <StarField />
      <div className="page-container">
        {pages.map((page, index) => (
          <div 
            key={index} 
            className={`page ${currentPage === index ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
            onTransitionEnd={() => setIsTransitioning(false)}
          >
            <div className="page-content">
              {page.image && (
                <div className={`page-image ${page.isSquareImage ? 'square' : ''}`}>
                  <img src={page.image} alt={page.title} />
                </div>
              )}
              <h1>{page.title}</h1>
              <p className={page.isLongText ? 'long-text' : ''}>
                {page.description}
              </p>
              {page.showChat && <CustomChat />}
            </div>
          </div>
        ))}
      </div>
      <div className="footer-text">
        Made by the brothers of the Kappa Eta Kappa engineering fraternity at UW-Madison for the 2025 Engineering Expo
      </div>
    </div>
  );
};

export default App;
