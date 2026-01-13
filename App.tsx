import React from 'react';
import { GameCanvas } from './components/GameCanvas';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center">
      <GameCanvas />
    </div>
  );
};

export default App;