import React, { useState, useEffect } from 'react';
import Roadmap from './components/Roadmap';

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- LAYER 2: FRONTEND LOCAL STORAGE CACHE ---
  // We try to load the "roadmap_history" from the browser's local storage
  const getCachedData = (currentKey) => {
    const history = JSON.parse(localStorage.getItem('roadmap_history') || '{}');
    return history[currentKey];
  };

  const saveToCache = (currentKey, roadmapText) => {
    const history = JSON.parse(localStorage.getItem('roadmap_history') || '{}');
    history[currentKey] = roadmapText;
    localStorage.setItem('roadmap_history', JSON.stringify(history));
  };

  const handleGenerate = async () => {
    if (!goal) return alert("Please enter a goal!");

    // Create the unique key (must match backend logic)
    const cacheKey = `${goal.trim().toLowerCase()}-${level.toLowerCase()}`;

    // 1. Check Browser Cache First
    const cachedRoadmap = getCachedData(cacheKey);
    if (cachedRoadmap) {
      console.log("Serving from Browser Cache (Zero API Cost)");
      setData(cachedRoadmap);
      return;
    }

    setLoading(true);
    try {
      // 2. If not in browser, ask the Server
      const response = await fetch('http://localhost:8000/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level }),
      });
      
      const result = await response.json();
      
      if (result.roadmap) {
        setData(result.roadmap);
        // 3. Save new result to browser cache for next time
        saveToCache(cacheKey, result.roadmap);
      }
      
    } catch (err) {
      alert("Error connecting to server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-blue-400">Pathfinder AI</h1>
        <p className="text-gray-400 mt-2">Smart Caching Enabled ⚡</p>
      </header>

      <main className="max-w-xl mx-auto bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-700">
        <div className="space-y-4">
          <input 
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="What do you want to become?" 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <select 
            className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full p-3 rounded-lg font-bold transition ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {loading ? 'Generating Path...' : 'Generate Roadmap'}
          </button>
        </div>

        {data && <Roadmap content={data} />}
      </main>
    </div>
  );
}

export default App;