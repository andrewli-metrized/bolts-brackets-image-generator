
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import AssetPanel from './components/WardrobePanel'; 
import VersionHistoryPanel from './components/SavedLooksPanel'; 
import ProjectStack from './components/OutfitStack'; 
import { placeFurniture, modifyRoomWithPrompt, removeObject } from './services/geminiService';
import { AssetItem, ProjectState } from './types';
import { RefreshCwIcon, XIcon } from './components/icons';
import { defaultAssets } from './wardrobe';
import { getFriendlyErrorMessage } from './lib/utils';
import { CropOverlay } from './components/CropOverlay';

const DEFAULT_PROMPT = `populate the empty space with a complete modern aesthetic room

Then, as an expert designer, selectively add accessory elements from the following list to enrich the scene and create a cozy, high-end feel:

Large-scale, framed abstract art on the walls

A curated collection of ceramic vases and bowls

Styled stacks of coffee table books

A tall indoor olive tree or similar statement plant in a planter

Soft, ambient lighting details`;

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_PROMPT);
  const [placementCoord, setPlacementCoord] = useState<{ x: number; y: number } | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio) {
        setHasApiKey(await (window as any).aistudio.hasSelectedApiKey());
      } else {
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const currentProject = useMemo(() => history[currentIndex] || null, [history, currentIndex]);

  const handleModelFinalized = (url: string, ratio: string) => {
    setSelectedRatio(ratio);
    const initialState: ProjectState = {
      id: `state-${Date.now()}`,
      imageUrl: url,
      description: 'Studio Base',
      timestamp: Date.now(),
      assetsApplied: []
    };
    setHistory([initialState]);
    setCurrentIndex(0);
  };

  const handleRestoreVersion = (stateId: string) => {
    const index = history.findIndex(s => s.id === stateId);
    if (index !== -1) {
      setCurrentIndex(index);
      setError(null);
      setPlacementCoord(null);
    }
  };

  const addHistoryState = (imageUrl: string, description: string, assetsApplied: AssetItem[]) => {
    const newState: ProjectState = {
      id: `state-${Date.now()}`,
      imageUrl,
      description,
      timestamp: Date.now(),
      assetsApplied
    };
    const newHistory = [...history.slice(0, currentIndex + 1), newState];
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setPlacementCoord(null);
  };

  const handleAssetSelect = async (assetFile: File, assetInfo: AssetItem) => {
    if (!currentProject || isLoading) return;
    
    let targetCoord = placementCoord;

    if (!targetCoord) {
      const confirmDefault = confirm("You haven't selected a spot in the room yet. Place it in the center?");
      if (!confirmDefault) return;
      targetCoord = { x: 50, y: 70 };
    }
    
    setIsLoading(true);
    setLoadingMessage(`Placing ${assetInfo.name}...`);
    setError(null);
    try {
      const newUrl = await placeFurniture(currentProject.imageUrl, assetFile, targetCoord, selectedRatio);
      addHistoryState(newUrl, `Added ${assetInfo.name}`, [...currentProject.assetsApplied, assetInfo]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Placement failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveObject = async (box: { x: number; y: number; width: number; height: number }) => {
    if (!currentProject || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage(`Removing selected object...`);
    setError(null);
    try {
      const newUrl = await removeObject(currentProject.imageUrl, box, selectedRatio);
      addHistoryState(newUrl, `Removed object`, currentProject.assetsApplied);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Removal failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSubmit = async () => {
    if (!currentProject || !userPrompt.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingMessage(`Updating scene...`);
    setError(null);
    try {
      const newUrl = await modifyRoomWithPrompt(currentProject.imageUrl, userPrompt, selectedRatio);
      addHistoryState(newUrl, userPrompt, currentProject.assetsApplied);
      // Removed clearing of userPrompt to allow multiple modifications if desired with the same prompt template
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Modification failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropConfirm = (croppedUrl: string) => {
    addHistoryState(croppedUrl, "Manually Cropped", currentProject.assetsApplied);
    setIsCropping(false);
  };

  if (!hasApiKey) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8 font-sans">
        <h1 className="text-5xl font-sans font-bold mb-6 tracking-tight">EQ3 Studio</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Please select a Gemini API key to start designing your space.</p>
        <button 
          onClick={() => (window as any).aistudio.openSelectKey()} 
          className="bg-black text-white py-4 px-10 rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
        >
          Connect API Key
        </button>
      </div>
    );
  }

  return (
    <div className="font-sans h-screen bg-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!currentProject ? (
          <StartScreen onModelFinalized={handleModelFinalized} />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-row h-full overflow-hidden"
          >
            <VersionHistoryPanel 
                history={history} 
                activeId={currentProject.id} 
                onRestore={handleRestoreVersion} 
            />
            
            <main className="flex-grow relative flex flex-col md:flex-row">
              <div className="flex-grow flex items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
                <Canvas 
                  displayImageUrl={currentProject.imageUrl}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onStartOver={() => setHistory([])}
                  placementCoord={placementCoord}
                  onSetPlacementCoord={setPlacementCoord}
                  onOpenCrop={() => setIsCropping(true)}
                  onRemoveObject={handleRemoveObject}
                />
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 min-w-[300px]"
                    >
                      <span className="flex-grow text-sm font-medium">{error}</span>
                      <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <aside className="w-full md:w-80 bg-white border-l border-gray-100 flex flex-col p-6 overflow-y-auto shadow-2xl z-10">
                <div className="flex flex-col gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <h2 className="text-lg font-sans font-bold uppercase tracking-tight">FINAL TOUCHES</h2>
                      </div>
                      <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="e.g. 'Add more sunlight', 'Change floor to grey concrete'..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm h-64 resize-none focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400 font-sans leading-relaxed"
                      />
                      <button 
                        onClick={handlePromptSubmit}
                        disabled={isLoading || !userPrompt.trim()}
                        className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      >
                        <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Modify Space
                      </button>
                   </div>

                   <ProjectStack 
                      layers={currentProject.assetsApplied} 
                      onRemove={() => {
                        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                      }} 
                   />

                   <AssetPanel 
                      onAssetSelect={handleAssetSelect}
                      isLoading={isLoading}
                      assets={defaultAssets}
                   />
                </div>
              </aside>
            </main>

            <AnimatePresence>
              {isCropping && currentProject && (
                <CropOverlay 
                  imageSrc={currentProject.imageUrl}
                  onConfirm={handleCropConfirm}
                  onCancel={() => setIsCropping(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
