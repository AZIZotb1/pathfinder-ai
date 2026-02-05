import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import InteractiveBackground from './components/InteractiveBackground';
// Added 'Compass' to the imports for the logo
import { Sparkles, Map, ArrowRight, Loader2, AlertCircle, Compass } from 'lucide-react';

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!goal) return;
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('http://localhost:8000/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level }),
      });

      if (!response.ok) throw new Error('Failed to fetch plan');

      const result = await response.json();
      setData(result); 
      
    } catch (err) {
      setError("Failed to connect to AI. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative selection:bg-purple-500 selection:text-white overflow-hidden">
      
      {/* 1. The Living Background */}
      <InteractiveBackground />

      {/* 2. The Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        
        {/* === NEW HEADER SECTION (With Modern Logo) === */}
        <header className="text-center mb-16 animate-fade-in pt-10">
          
          {/* Optional: 'Powered By' Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>Powered by Gemini 3 Flash</span>
          </div>

          {/* The Logo Container */}
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="relative">
              {/* Glowing Blur Effect behind the icon */}
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 animate-pulse" />
              <Compass size={48} className="relative text-white fill-blue-500/20" />
              <Sparkles size={20} className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" />
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter">
              Pathfinder
            </h1>
          </div>
          
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
            Your AI Career Architect. Stop searching, start learning.
          </p>
        </header>
        {/* ============================================= */}

        {/* Input Section - Glass Card */}
        <div className="max-w-2xl mx-auto bg-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl mb-12 animate-slide-up hover:border-white/20 transition-colors duration-500">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">I want to become a...</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Map className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input 
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-gray-800 transition-all outline-none text-white placeholder-gray-600 font-medium"
                  placeholder="e.g. Full Stack Developer, Data Scientist..." 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Current Level</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white appearance-none cursor-pointer hover:bg-gray-800 transition-colors"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="group relative w-full p-4 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Crafting Plan...
                      </>
                    ) : (
                      <>
                        Generate Roadmap <ArrowRight size={20} />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-6 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {data && <Roadmap data={data} />}
      </div>
    </div>
  );
}

export default App;