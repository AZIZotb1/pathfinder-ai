import React, { useState } from 'react';
import Roadmap from './components/Roadmap';

// Use environment variable for API URL with fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    // Client-side validation
    if (!goal.trim()) {
      setError("Please enter a career goal");
      return;
    }
    
    if (goal.trim().length < 3) {
      setError("Career goal is too short (minimum 3 characters)");
      return;
    }
    
    if (goal.trim().length > 200) {
      setError("Career goal is too long (maximum 200 characters)");
      return;
    }
    
    setLoading(true);
    setError('');
    setData(null);

    try {
      // ✅ FIXED: Removed malformed markdown-style URL formatting
      const response = await fetch(`${API_URL}/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), level }),
      });

      // Enhanced error handling
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("API Result:", result);
      
      // Validate response
      if (!Array.isArray(result)) {
        throw new Error("Invalid response format from server");
      }
      
      if (result.length === 0) {
        throw new Error("No roadmap steps were generated");
      }
      
      setData(result);
      
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(err.message || "Failed to connect to AI. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            Pathfinder AI
          </h1>
          <p className="text-gray-400 text-lg">Your personalized career architect.</p>
        </header>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-800 shadow-2xl mb-12 animate-slide-up">
          <div className="space-y-6">
            <div>
              <label 
                htmlFor="career-goal" 
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                I want to become a...
              </label>
              <input 
                id="career-goal"
                type="text"
                className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white placeholder-gray-500"
                placeholder="e.g. Full Stack Developer, Data Scientist..." 
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  setError(''); // Clear error when user types
                }}
                onKeyPress={handleKeyPress}
                aria-label="Career goal input"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="skill-level" 
                  className="block text-sm font-medium text-gray-400 mb-2"
                >
                  Current Level
                </label>
                <select 
                  id="skill-level"
                  className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none cursor-pointer"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={loading}
                  aria-label="Skill level selection"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={handleGenerate}
                  disabled={loading || !goal.trim()}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg shadow-blue-500/20"
                  aria-label="Generate roadmap button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      Generating Plan...
                    </span>
                  ) : "Generate Roadmap 🚀"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div 
              className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-slide-up"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl animate-pulse"
              >
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        )}

        {/* Results Section */}
        {data && !loading && <Roadmap data={data} />}

        {/* Success Message */}
        {data && !loading && (
          <div className="mt-8 text-center text-gray-400 text-sm animate-fade-in">
            ✨ Generated {data.length} steps for your learning journey
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
