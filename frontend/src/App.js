import React, { useState } from 'react';
import Roadmap from './components/Roadmap';
import SavedRoadmaps from './components/SavedRoadmaps';
import InteractiveBackground from './components/InteractiveBackground';
import RoadmapStorage from './utils/RoadmapStorage';
import AiTutor from './components/AiTutor';
import { Sparkles, Map, ArrowRight, Loader2, AlertCircle, Compass, BookMarked, Save, Info } from 'lucide-react';

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedCount, setSavedCount] = useState(RoadmapStorage.getCount());
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!goal) return;
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/generate-roadmap`, {
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

  const handleSaveRoadmap = () => {
    if (!data || !goal) return;

    const saved = RoadmapStorage.saveRoadmap(goal, level, data);
    if (saved) {
      setSavedCount(RoadmapStorage.getCount());
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  const handleLoadRoadmap = (roadmap) => {
    setGoal(roadmap.goal);
    setLevel(roadmap.level);
    setData(roadmap.steps);
    setError('');
    setShowLibrary(false);
  };

  const handleOpenLibrary = () => {
    setSavedCount(RoadmapStorage.getCount());
    setShowLibrary(true);
  };

  return (
    <div className="min-h-screen text-white relative selection:bg-purple-500 selection:text-white overflow-hidden">
      
      <InteractiveBackground />

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        
        <header className="text-center mb-16 animate-fade-in pt-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-300 mb-6 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>Powered by Gemini 3 Flash</span>
          </div>

          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="relative">
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

          <div className="mt-6">
            <button
              onClick={handleOpenLibrary}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-xl text-sm font-medium text-gray-300 transition-all flex items-center gap-2 mx-auto"
            >
              <BookMarked className="w-4 h-4" />
              Saved Roadmaps
              {savedCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto bg-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl mb-12 animate-slide-up hover:border-white/20 transition-colors duration-500">
          <div className="space-y-6">
            
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-400 mb-2">
                I want to become a...
              </label>
              <input 
                id="goal"
                type="text"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g. Full Stack Developer, Data Scientist..." 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-400">
                  My current experience level:
                </label>
                <div className="group relative">
                  <Info size={16} className="text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 border border-gray-600 rounded-lg text-xs text-gray-300 shadow-lg z-10">
                    💡 Select where you are <strong>NOW</strong>, not where you want to be. This helps us create the right roadmap for you!
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      level === lvl
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-800/50 border border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!goal.trim() || loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your path...
                </>
              ) : (
                <>
                  <Map className="w-5 h-5" />
                  Generate Roadmap
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {data && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <button
                onClick={handleSaveRoadmap}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
              >
                <Save className="w-5 h-5" />
                Save This Roadmap
              </button>
            </div>

            {showSaveSuccess && (
              <div className="max-w-2xl mx-auto p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-center animate-slide-up">
                ✅ Roadmap saved successfully! View it in your library.
              </div>
            )}

            <Roadmap data={data} goal={goal} />
            <AiTutor goal={goal} roadmapData={data} />
          </div>
        )}
      </div>

      {showLibrary && (
        <SavedRoadmaps
          onLoadRoadmap={handleLoadRoadmap}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

export default App;
