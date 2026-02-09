// src/utils/RoadmapStorage.js
// Simple utility for saving and managing roadmaps

class RoadmapStorage {
  static STORAGE_KEY = 'pathfinder-saved-roadmaps';

  // Get all saved roadmaps
  static getAllRoadmaps() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading roadmaps:', error);
      return [];
    }
  }

  // Save a new roadmap
  static saveRoadmap(goal, level, steps) {
    try {
      const roadmaps = this.getAllRoadmaps();
      
      const newRoadmap = {
        id: Date.now().toString(),
        goal: goal,
        level: level,
        steps: steps,
        createdAt: new Date().toISOString(),
        lastViewed: new Date().toISOString()
      };

      roadmaps.unshift(newRoadmap); // Add to beginning
      
      // Keep only last 20 roadmaps
      if (roadmaps.length > 20) {
        roadmaps.splice(20);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roadmaps));
      return newRoadmap;
    } catch (error) {
      console.error('Error saving roadmap:', error);
      return null;
    }
  }

  // Delete a roadmap by ID
  static deleteRoadmap(id) {
    try {
      const roadmaps = this.getAllRoadmaps();
      const filtered = roadmaps.filter(r => r.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting roadmap:', error);
      return false;
    }
  }

  // Update last viewed time
  static updateLastViewed(id) {
    try {
      const roadmaps = this.getAllRoadmaps();
      const roadmap = roadmaps.find(r => r.id === id);
      if (roadmap) {
        roadmap.lastViewed = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roadmaps));
      }
    } catch (error) {
      console.error('Error updating roadmap:', error);
    }
  }

  // Export single roadmap as JSON file
  static exportRoadmap(roadmap) {
    try {
      const dataStr = JSON.stringify(roadmap, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roadmap-${roadmap.goal.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting roadmap:', error);
      return false;
    }
  }

  // Export roadmap as text file
  static exportAsText(roadmap) {
    try {
      let text = `CAREER ROADMAP: ${roadmap.goal} (${roadmap.level})\n`;
      text += `Generated: ${new Date(roadmap.createdAt).toLocaleDateString()}\n`;
      text += `\n${'='.repeat(60)}\n\n`;

      roadmap.steps.forEach((step, index) => {
        text += `STEP ${step.step_number || index + 1}: ${step.title}\n`;
        text += `Time: ${step.estimated_time}\n\n`;
        text += `${step.description}\n\n`;
        
        if (step.resources && step.resources.length > 0) {
          text += `Resources:\n`;
          step.resources.forEach(resource => {
            text += `  • ${resource}\n`;
          });
          text += '\n';
        }
        
        text += `${'-'.repeat(60)}\n\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roadmap-${roadmap.goal.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting as text:', error);
      return false;
    }
  }

  // Export all roadmaps as backup
  static exportAllRoadmaps() {
    try {
      const roadmaps = this.getAllRoadmaps();
      const dataStr = JSON.stringify(roadmaps, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pathfinder-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting all roadmaps:', error);
      return false;
    }
  }

  // Import roadmaps from backup file
  static importRoadmaps(file, callback) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          const current = this.getAllRoadmaps();
          
          // Merge imported with current (avoid duplicates by ID)
          const existingIds = new Set(current.map(r => r.id));
          const newRoadmaps = imported.filter(r => !existingIds.has(r.id));
          
          const merged = [...current, ...newRoadmaps];
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
          
          callback(true, newRoadmaps.length);
        } catch (error) {
          console.error('Error parsing import file:', error);
          callback(false, 0);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing roadmaps:', error);
      callback(false, 0);
    }
  }

  // Clear all roadmaps
  static clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing roadmaps:', error);
      return false;
    }
  }

  // Get roadmap count
  static getCount() {
    return this.getAllRoadmaps().length;
  }

  // Check if storage is available
  static isStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default RoadmapStorage;
