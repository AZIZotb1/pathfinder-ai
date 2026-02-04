import React from 'react';

const Roadmap = ({ data }) => {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
      {data.map((step, index) => (
        <div 
          key={index} 
          className="group relative bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl hover:bg-gray-800/60 transition-all hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Step Number Badge */}
          <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transform group-hover:scale-110 transition-transform">
            {step.step_number || index + 1}
          </div>

          <div className="mt-2">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                {step.title}
              </h3>
              <span className="text-xs font-mono bg-gray-700/50 px-2 py-1 rounded text-blue-300 border border-blue-500/20">
                {step.estimated_time}
              </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Resources Section */}
            {step.resources && step.resources.length > 0 && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Recommended Resources:</p>
                <ul className="space-y-1">
                  {step.resources.map((res, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-300">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                      {res}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Roadmap;