import React, { useState } from 'react';
import Roadmap from './components/Roadmap';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

// Example careers for autocomplete suggestions
const EXAMPLE_CAREERS = [
  'Software Developer',
  'Data Scientist',
  'UX/UI Designer',
  'Product Manager',
  'Digital Marketer',
  'Cybersecurity Analyst',
  'Full Stack Developer',
  'Machine Learning Engineer',
  'Content Writer',
  'Mobile App Developer',
  'DevOps Engineer',
  'Business Analyst',
  'Cloud Architect',
  'Frontend Developer',
  'Backend Developer',
  'Graphic Designer',
  'Project Manager',
  'Data Analyst',
  'AI Engineer',
  'Web Developer'
];

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');

  // Enhanced validation that catches irrelevant sentences
  const validateCareerGoal = (goal) => {
    const trimmed = goal.trim();
    
    // 1. Check if empty
    if (!trimmed) {
      return { valid: false, error: "Please enter a career goal" };
    }
    
    // 2. Check minimum length
    if (trimmed.length < 3) {
      return { valid: false, error: "Career goal is too short (minimum 3 characters)" };
    }
    
    // 3. Check maximum length
    if (trimmed.length > 200) {
      return { valid: false, error: "Career goal is too long (maximum 200 characters)" };
    }
    
    // 4. Must contain at least some letters
    if (!/[a-zA-Z]/.test(trimmed)) {
      return { valid: false, error: "Please enter a valid career goal with letters" };
    }
    
    // 5. Check for gibberish (7+ consonants in a row)
    if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(trimmed)) {
      return { 
        valid: false, 
        error: "Please enter a real career goal (e.g., 'Software Developer', 'Data Scientist')" 
      };
    }
    
    // 6. Just numbers
    if (/^\d+$/.test(trimmed)) {
      return { valid: false, error: "Please enter a career name, not just numbers" };
    }
    
    // 7. Repeated characters (spam like "aaaaaaa")
    if (/(.)\1{5,}/.test(trimmed)) {
      return { valid: false, error: "Please enter a valid career goal" };
    }
    
    // 8. Common nonsense patterns
    const nonsensePatterns = [
      /^test$/i,
      /^asdf/i,
      /^qwerty/i,
      /^[xyz]+$/i,
      /^lol+$/i,
      /^haha+$/i,
      /^ok+$/i,
      /^blah/i,
      /^aaa+$/i,
    ];
    
    for (const pattern of nonsensePatterns) {
      if (pattern.test(trimmed)) {
        return { 
          valid: false, 
          error: "Please enter a real career goal (e.g., 'Web Developer', 'Marketing Manager')" 
        };
      }
    }
    
    // 9. NEW: Check for sentence indicators (not a job title)
    const sentenceIndicators = [
      /\bi am\b/i,
      /\bi'm\b/i,
      /\bi want\b/i,
      /\bthis is\b/i,
      /\bi think\b/i,
      /\bi don't\b/i,
      /\bi dont\b/i,
      /\bhow to\b/i,
      /\bwhat is\b/i,
      /\bcan you\b/i,
      /\bhelp me\b/i,
      /\bplease\b/i,
      /\btesting\b/i,
      /\bjust testing\b/i,
      /\btest test\b/i,
    ];
    
    for (const pattern of sentenceIndicators) {
      if (pattern.test(trimmed)) {
        return {
          valid: false,
          error: "Please enter just the career title (e.g., 'Data Scientist' not 'I want to be a Data Scientist')"
        };
      }
    }
    
    // 10. NEW: Check if it's a complete sentence (has verb patterns)
    const verbPatterns = [
      /\b(doing|trying|working|learning|studying|testing|checking)\b/i,
      /\b(know|understand|figure|wonder)\b/i,
    ];
    
    for (const pattern of verbPatterns) {
      if (pattern.test(trimmed)) {
        return {
          valid: false,
          error: "Please enter a career title, not a sentence (e.g., 'Software Engineer', 'Product Manager')"
        };
      }
    }
    
    // 11. Too many words (probably a sentence, not a title)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 10) {
      return { 
        valid: false, 
        error: "Please enter a career title, not a full sentence (e.g., 'Product Manager')" 
      };
    }
    
    // 12. NEW: Check if word count seems like a sentence (more than 6 words)
    if (wordCount > 6) {
      return {
        valid: false,
        error: "Career titles are usually 1-4 words (e.g., 'Machine Learning Engineer', 'UX Designer')"
      };
    }
    
    // 13. Invalid punctuation
    if (/[?!;]/.test(trimmed)) {
      return { valid: false, error: "Please enter a career title without question marks or semicolons" };
    }
    
    // 14. NEW: Common filler words that indicate it's not a job title
    const fillerWords = [
      /\ba\b/i,  // "a test"
      /\bthe\b/i, // "the thing"
      /\bmy\b/i,  // "my goal"
      /\byour\b/i, // "your app"
      /\bsome\b/i, // "some job"
      /\bthat\b/i, // "that thing"
      /\bwhat\b/i, // "what career"
    ];
    
    // Count filler words
    let fillerCount = 0;
    for (const pattern of fillerWords) {
      if (pattern.test(trimmed)) {
        fillerCount++;
      }
    }
    
    // If more than 2 filler words, it's probably a sentence
    if (fillerCount >= 2) {
      return {
        valid: false,
        error: "Please enter just the job title (e.g., 'Data Scientist', 'Web Developer')"
      };
    }
    
    // All checks passed!
    return { valid: true };
  };

  // Suggest better career names for common vague inputs
  const suggestCareerCorrection = (input) => {
    const lower = input.toLowerCase().trim();
    
    const suggestions = {
      'developer': 'Software Developer',
      'programmer': 'Software Developer',
      'coder': 'Software Developer',
      'hacker': 'Cybersecurity Specialist',
      'designer': 'UX/UI Designer',
      'artist': 'Graphic Designer',
      'writer': 'Content Writer',
      'doctor': 'Medical Doctor',
      'nurse': 'Registered Nurse',
      'teacher': 'Educator',
      'manager': 'Project Manager',
      'analyst': 'Data Analyst',
      'engineer': 'Software Engineer',
      'marketer': 'Digital Marketer',
    };
    
    for (const [vague, suggestion] of Object.entries(suggestions)) {
      if (lower === vague) {
        return {
          hasSuggestion: true,
          message: `💡 Did you mean "${suggestion}"? Try being more specific!`,
          suggestion: suggestion
        };
      }
    }
    
    return { hasSuggestion: false };
  };

  const handleGenerate = async () => {
    // Validate input before sending
    const validation = validateCareerGoal(goal);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuggestion('');
    setData(null);

    try {
      const response = await fetch(`${API_URL}/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), level }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Validate response format
      if (!Array.isArray(result)) {
        throw new Error("Invalid response format from server");
      }
      
      if (result.length === 0) {
        throw new Error("No roadmap steps were generated. Please try a different career goal.");
      }
      
      setData(result);
      
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(err.message || "Failed to generate roadmap. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && goal.trim()) {
      handleGenerate();
    }
  };

  const handleGoalChange = (e) => {
    const value = e.target.value;
    setGoal(value);
    setError('');
    
    // Show suggestions for common vague inputs
    if (value.trim().length >= 3) {
      const check = suggestCareerCorrection(value);
      if (check.hasSuggestion) {
        setSuggestion(check.message);
      } else {
        setSuggestion('');
      }
    } else {
      setSuggestion('');
    }
  };

  const applySuggestion = (suggestedCareer) => {
    setGoal(suggestedCareer);
    setSuggestion('');
    setError('');
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
                onChange={handleGoalChange}
                onKeyPress={handleKeyPress}
                list="career-suggestions"
                aria-label="Career goal input"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                disabled={loading}
              />
              
              {/* Autocomplete suggestions */}
              <datalist id="career-suggestions">
                {EXAMPLE_CAREERS.map((career, i) => (
                  <option key={i} value={career} />
                ))}
              </datalist>
              
              {/* Smart suggestion message */}
              {suggestion && !error && (
                <div className="mt-2 text-yellow-400 text-sm flex items-center gap-2">
                  <span>{suggestion}</span>
                  <button
                    onClick={() => {
                      const match = suggestion.match(/"([^"]+)"/);
                      if (match) applySuggestion(match[1]);
                    }}
                    className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 px-2 py-1 rounded transition-colors"
                  >
                    Use this
                  </button>
                </div>
              )}
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
