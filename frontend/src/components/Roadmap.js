import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Youtube, BookOpen, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

const Roadmap = ({ data, goal }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [stepDetails, setStepDetails] = useState({}); 
  const [loadingStep, setLoadingStep] = useState(false);

  const toggleStep = async (index, stepTitle) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }
    setExpandedIndex(index);

    // If cached, don't fetch
    if (stepDetails[index]) return;

    setLoadingStep(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get-step-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_title: stepTitle, goal: goal || "Coding" }),
      });

      if (!response.ok) {
        throw new Error("Backend connection failed");
      }

      const result = await response.json();
      setStepDetails(prev => ({ ...prev, [index]: result }));
    } catch (err) {
      console.error(err);
      // Save an error state so we show a message instead of crashing
      setStepDetails(prev => ({ ...prev, [index]: { error: true } }));
    } finally {
      setLoadingStep(false);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-4 animate-slide-up pb-20">
      {data.map((step, index) => {
        const isExpanded = expandedIndex === index;
        const details = stepDetails[index];

        return (
          <div 
            key={index} 
            className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
              isExpanded 
              ? 'bg-gray-800/90 border-blue-500/50 shadow-lg shadow-blue-500/10' 
              : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
            }`}
          >
            {/* Header */}
            <button 
              onClick={() => toggleStep(index, step.title)}
              className="w-full p-6 flex items-start gap-4 text-left"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                isExpanded ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold transition-colors ${isExpanded ? 'text-white' : 'text-gray-300'}`}>
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm mt-1">{step.description}</p>
              </div>
              {isExpanded ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-gray-600" />}
            </button>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-white/5 bg-black/20">
                {loadingStep ? (
                  <div className="py-8 flex justify-center text-blue-400 gap-2 items-center">
                    <Loader2 className="animate-spin" /> Analyzing step...
                  </div>
                ) : details && !details.error ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    
                    {/* 1. Sub-tasks (SAFE MAP) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 size={14} /> Action Plan
                      </h4>
                      <div className="bg-gray-900/50 rounded-xl p-4 space-y-2 border border-white/5">
                        {/* The ?. checks if breakdown exists before mapping */}
                        {details.breakdown?.map((task, i) => (
                          <div key={i} className="flex gap-3 text-sm text-gray-300">
                            <span className="text-gray-600 font-mono">0{i+1}</span>
                            <span>{task}</span>
                          </div>
                        )) || <div className="text-gray-500 text-sm">No steps available.</div>}
                      </div>
                    </div>

                    {/* 2. Common Mistakes (SAFE MAP) */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={14} /> Avoid These Mistakes
                      </h4>
                      <div className="bg-orange-500/5 rounded-xl p-4 space-y-2 border border-orange-500/10">
                        {details.mistakes?.map((mistake, i) => (
                          <div key={i} className="text-sm text-gray-300 flex gap-2">
                            <span className="text-orange-500/50">•</span> {mistake}
                          </div>
                        )) || <div className="text-gray-500 text-sm">No tips available.</div>}
                      </div>
                    </div>

                    {/* 3. Resources */}
                    <div className="col-span-1 md:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recommended Resources</h4>
                      {details.resources ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(details.resources.youtube || '')}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors group"
                          >
                            <div className="p-2 bg-red-500/10 text-red-500 rounded-md group-hover:bg-red-500 group-hover:text-white transition-colors">
                              <Youtube size={18} />
                            </div>
                            <span className="text-sm text-gray-300 truncate">{details.resources.youtube || 'Watch Tutorial'}</span>
                          </a>
                          <a 
                             href={`https://www.google.com/search?q=${encodeURIComponent(details.resources.article || '')}`}
                             target="_blank" rel="noreferrer"
                             className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors group"
                          >
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-md group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <BookOpen size={18} />
                            </div>
                            <span className="text-sm text-gray-300 truncate">{details.resources.article || 'Read Article'}</span>
                          </a>
                        </div>
                      ) : <div className="text-gray-500 text-sm">No resources found.</div>}
                    </div>

                  </div>
                ) : (
                  <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="font-bold">Could not load details</p>
                    <p className="text-xs mt-1 opacity-80">Please try again in a moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Roadmap;