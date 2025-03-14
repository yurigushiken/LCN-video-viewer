const fs = require('fs');
const path = require('path');

// Path to the VideoComparisonContainer.js file
const filePath = path.join(__dirname, '..', 'LCN-video-viewer-clean', 'src', 'components', 'VideoComparisonContainer.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Add the useMemo import if it doesn't exist
if (!content.includes('useMemo')) {
  content = content.replace(
    'import React, { useState, useEffect, useRef } from \'react\';',
    'import React, { useState, useEffect, useRef, useMemo } from \'react\';'
  );
}

// Add the selectedPreset state if it doesn't exist
if (!content.includes('selectedPreset')) {
  content = content.replace(
    'const [loadError, setLoadError] = useState(null);',
    'const [loadError, setLoadError] = useState(null);\n  const [selectedPreset, setSelectedPreset] = useState(\'\');'
  );
}

// Modify the loadYouTubeVideos function to sort videos alphabetically
content = content.replace(
  'setYoutubeVideos(videos);',
  `// Sort videos alphabetically by title
          const sortedVideos = [...videos].sort((a, b) => 
            a.title.localeCompare(b.title)
          );
          setYoutubeVideos(sortedVideos);`
);

// Add the presets and handlePresetSelect functions
if (!content.includes('// Calculate available presets')) {
  const presetsCode = `
  // Calculate available presets from video titles
  const presets = useMemo(() => {
    if (!youtubeVideos || youtubeVideos.length === 0) {
      return [];
    }
    
    // Extract prefixes like "gw_", "hw_", etc.
    const prefixSet = new Set();
    youtubeVideos.forEach(video => {
      const match = video.title.match(/^([a-z]+)_/);
      if (match && match[1]) {
        prefixSet.add(match[1]);
      }
    });
    
    return Array.from(prefixSet).sort();
  }, [youtubeVideos]);
  
  // Handle preset selection
  const handlePresetSelect = (presetValue) => {
    setSelectedPreset(presetValue);
    
    if (!presetValue) {
      // If empty selection, don't change anything
      return;
    }
    
    // Filter videos to this category
    const filteredVideos = youtubeVideos.filter(video => 
      video.title.startsWith(\`\${presetValue}_\`)
    );
    
    // Sort videos by age ("adult" first, then numeric order)
    const sortedVideos = [...filteredVideos].sort((a, b) => {
      // Put adult first
      if (a.title.includes('adult')) return -1;
      if (b.title.includes('adult')) return 1;
      
      // Extract numbers for comparison
      const numA = parseInt(a.title.match(/(\\d+)/)?.[1] || 0);
      const numB = parseInt(b.title.match(/(\\d+)/)?.[1] || 0);
      
      return numA - numB;
    });
    
    console.log(\`Preset \${presetValue} selected. Found \${sortedVideos.length} videos:\`, 
      sortedVideos.map(v => v.title)
    );
    
    // Load videos into slots
    const visibleSlots = getVisibleSlots();
    const newViewerSlots = [...viewerSlots];
    
    // Fill slots with sorted videos, up to the number of visible slots
    for (let i = 0; i < Math.min(sortedVideos.length, visibleSlots); i++) {
      newViewerSlots[i] = sortedVideos[i];
    }
    
    setViewerSlots(newViewerSlots);
    showNotification(\`Loaded \${Math.min(sortedVideos.length, visibleSlots)} \${presetValue} videos\`, 'success');
  };`;
  
  // Insert presets code after the debug player references effect
  content = content.replace(
    /\/\/ Debug player references.*?\}, \[viewerSlots\]\);/s,
    match => match + presetsCode
  );
}

// Add the presets dropdown UI
const presetDropdownUI = `
          {/* Presets dropdown - with more obvious styling */}
          <div className="presets-container mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
            <div className="flex items-center">
              <label className="font-bold text-lg mr-2 text-blue-800">Presets:</label>
              <select
                className="flex-1 p-3 border rounded mb-1 bg-blue-100 border-blue-300 font-medium text-blue-800"
                value={selectedPreset}
                onChange={(e) => handlePresetSelect(e.target.value)}
              >
                <option value="">-- Select Video Category Preset --</option>
                {presets.map(preset => (
                  <option key={preset} value={preset}>
                    {preset.toUpperCase()} Videos
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-blue-600 mt-1">
              Select a category to automatically load videos in sequence
            </div>
          </div>`;

// Add the preset dropdown UI before the video dropdowns
if (!content.includes('presets-container')) {
  content = content.replace(
    /{\/\* Video dropdowns \*\/}/,
    match => presetDropdownUI + '\n          ' + match
  );
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('VideoComparisonContainer.js has been updated with:');
console.log('1. Alphabetical sorting of videos in dropdowns');
console.log('2. Added presets dropdown functionality'); 