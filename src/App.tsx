import React from 'react';
import { CustomChat } from './components/CustomChat';
import { StarField } from './components/StarField';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <StarField />
      <div className="content">
        <h1>KappaTron</h1>
        <CustomChat />
      </div>
    </div>
  );
};

export default App;
