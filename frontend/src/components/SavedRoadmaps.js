// src/components/SavedRoadmaps.js
import React, { useState, useEffect } from 'react';
import RoadmapStorage from '../utils/RoadmapStorage';
import { BookMarked, Trash2, Download, Upload, X, Calendar, TrendingUp } from 'lucide-react';

const SavedRoadmaps = ({ onLoadRoadmap, onClose }) => {
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = () => {
    const roadmaps = RoadmapStorage.getAllRoadmaps();
    setSavedRoadmaps(roadmaps);
  };

  const handleDelete = (id) => {
    RoadmapStorage.deleteRoadmap(id);
    loadRoadmaps();
    setShowDeleteConfirm(null);
  };

  const handleExportJSON = (roadmap) => {
    RoadmapStorage.exportRoadmap(roadmap);
  };

  const handleExportText = (roadmap) => {
    RoadmapStorage.exportAsText(roadmap);
  };

  const handleExportAll = () => {
    RoadmapStorage.exportAllRoadmaps();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      RoadmapStorage.importRoadmaps(file, (success, count) => {
        if (success) {

          loadRoadmaps();
          
        }
        // Remove everything else - no alerts needed here
      });
    
    // Clear input so same file can be selected again
    event.target.value = '';
  }
};  
  const handleLoadRoadmap = (roadmap) => {
    RoadmapStorage.updateLastViewed(roadmap.id);
    onLoadRoadmap(roadmap);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookMarked className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">Saved Roadmaps</h2>
              <p className="text-gray-400 text-sm mt-1">
                {savedRoadmaps.length} roadmap{savedRoadmaps.length !== 1 ? 's' : ''} saved locally
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-gray-700 flex gap-2 flex-wrap">
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
          
          <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {savedRoadmaps.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Delete all saved roadmaps? This cannot be undone.')) {
                  RoadmapStorage.clearAll();
                  loadRoadmaps();
                }
              }}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Roadmaps List */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedRoadmaps.length === 0 ? (
            <div className="text-center py-12">
              <BookMarked className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No saved roadmaps yet</p>
              <p className="text-gray-500 text-sm">
                Generate a roadmap and save it for later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {savedRoadmaps.map((roadmap) => (
                <div
                  key={roadmap.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">
                        {roadmap.goal}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {roadmap.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(roadmap.createdAt)}
                        </span>
                        <span className="text-gray-500">
                          {roadmap.steps?.length || 0} steps
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleLoadRoadmap(roadmap)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          View Roadmap
                        </button>
                        
                        <button
                          onClick={() => handleExportText(roadmap)}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Text
                        </button>
                        
                        <button
                          onClick={() => handleExportJSON(roadmap)}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          JSON
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(roadmap.id)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === roadmap.id && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm mb-2">
                        Delete this roadmap? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(roadmap.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {savedRoadmaps.length > 0 && (
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <p className="text-gray-400 text-xs text-center">
              💡 Tip: Export your roadmaps regularly to prevent data loss if you clear browser data
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRoadmaps;
