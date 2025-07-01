
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClaimsProcessor from './components/ClaimsProcessor';
import { AnalyzedClaim } from './types';
import { BRANDING } from './constants';

type View = 'dashboard' | 'processor';

const App: React.FC = () => {
  const [view, setView] = useState<View>('processor');
  const [claims, setClaims] = useState<AnalyzedClaim[]>([]);

  const handleClaimsProcessed = (processedClaims: AnalyzedClaim[]) => {
    setClaims(processedClaims);
    setView('dashboard');
  };

  return (
    <div className="flex h-screen bg-secondary-dark text-gray-200 font-sans">
      <Sidebar view={view} setView={setView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-secondary-dark shadow-md p-4 flex justify-between items-center border-b border-secondary-light">
          <img src={BRANDING.brand.logo.title} alt="HERE AND NOW AI Logo" className="h-10"/>
          <div className="text-right">
             <h1 className="text-xl font-bold text-primary">Medical Claims RPA</h1>
             <p className="text-xs text-gray-400 italic">{BRANDING.brand.slogan}</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-secondary">
          {view === 'dashboard' && <Dashboard claims={claims} />}
          {view === 'processor' && <ClaimsProcessor onProcessComplete={handleClaimsProcessed} />}
        </div>
      </main>
    </div>
  );
};

export default App;
