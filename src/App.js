import React, { useState, useEffect } from 'react';
import './App.css';
import VideoComparisonContainer from './components/VideoComparisonContainer';

function App() {
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set environment variables for API access
  useEffect(() => {
    // Check if we have API_KEY in .env
    if (!process.env.REACT_APP_GOOGLE_API_KEY) {
      console.warn('No Google API key found in environment variables');
    }
  }, []);

  // Load video library from JSON file
  useEffect(() => {
    const loadVideoLibrary = async () => {
      try {
        setLoading(true);
        
        // Try to load the video library from the JSON file
        const data = await import('./data/video-library.json')
          .then(module => module.default)
          .catch(() => {
            throw new Error('Failed to load video library');
          });
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Successfully loaded ${data.length} videos from library`);
          setVideoLibrary(data);
        } else {
          throw new Error('Video library is empty or not properly formatted');
        }
      } catch (err) {
        console.error('Error loading video library:', err);
        setError('Failed to load videos. Please check the console for details.');
      } finally {
        setLoading(false);
      }
    };

    loadVideoLibrary();
  }, []);

  return (
    <div className="App min-h-screen bg-gray-50 overflow-y-auto" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">LCN Video Comparison Tool</h1>
          <p className="text-sm opacity-80">Heatmap comparison for Infant Event Representations study</p>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4 overflow-y-auto">
        {loading ? (
          <div className="loading-container flex items-center justify-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-container flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center p-6">
              <p className="text-lg text-red-600 mb-2">{error}</p>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <VideoComparisonContainer videoLibrary={videoLibrary} />
        )}
      </main>
      
      <footer className="bg-neutral p-4 border-t border-secondary">
        <div className="container mx-auto text-center text-secondary text-sm">
          <p>LCN Video Comparison Tool</p>
          <p className="mt-1">by Yuri Gushiken mkg2145@tc.columbia.edu and Yuexin Li yl4964@columbia.edu</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 