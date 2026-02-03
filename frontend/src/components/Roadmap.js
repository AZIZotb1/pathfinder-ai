import React from 'react';

const Roadmap = ({ content }) => {
  return (
    <div className="mt-8 p-6 bg-gray-900 rounded-lg border-l-4 border-blue-500">
      <h2 className="text-xl font-bold mb-4">Your Custom Path:</h2>
      <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
        {content}
      </div>
    </div>
  );
};

export default Roadmap;