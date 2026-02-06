
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
import { placeObjectInBox, modifyRoomWithPrompt, removeObject } from './services/geminiService';
import { AssetItem, ProjectState } from './types';
import { RefreshCwIcon, XIcon } from './components/icons';
import { defaultAssets } from './wardrobe';
import { getFriendlyErrorMessage } from './lib/utils';
import { CropOverlay } from './components/CropOverlay';
import Header from './components/Header';

const DEFAULT_PROMPT = `Add safety warnings (yellow tape) to the floor and add a slight industrial haze to the lighting to increase realism.`;

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [history, setHistory] = useState<ProjectState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_PROMPT);
  
  // New State for "Active Asset" flow
  const [activeAsset, setActiveAsset] = useState<{file: File, info: AssetItem} | null>(null);
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
      description: 'Factory Base',
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
  };

  // Step 1: User selects an asset from the panel
  const handleAssetSelect = (assetFile: File, assetInfo: AssetItem) => {
    if (isLoading) return;
    setActiveAsset({ file: assetFile, info: assetInfo });
    setError(null);
  };

  // Step 2: User draws a box on the canvas, triggering generation
  const handlePlaceObject = async (box: { x: number; y: number; width: number; height: number }) => {
    if (!currentProject || isLoading || !activeAsset) return;
    
    setIsLoading(true);
    setLoadingMessage(`Integrating ${activeAsset.info.name} into scene...`);
    setError(null);
    
    try {
      const newUrl = await placeObjectInBox(currentProject.imageUrl, activeAsset.file, box, selectedRatio);
      addHistoryState(newUrl, `Added ${activeAsset.info.name}`, [...currentProject.assetsApplied, activeAsset.info]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Placement failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveObject = async (box: { x: number; y: number; width: number; height: number }) => {
    if (!currentProject || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage(`Removing selected region...`);
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
    setLoadingMessage(`Augmenting environment...`);
    setError(null);
    try {
      const newUrl = await modifyRoomWithPrompt(currentProject.imageUrl, userPrompt, selectedRatio);
      addHistoryState(newUrl, "Environment Mod", currentProject.assetsApplied);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Modification failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropConfirm = (croppedUrl: string) => {
    addHistoryState(croppedUrl, "Output Cropped", currentProject.assetsApplied);
    setIsCropping(false);
  };

  if (!hasApiKey) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8 font-sans">
        <h1 className="text-4xl font-sans font-bold mb-6 tracking-tight text-gray-900">Welding Augmentation</h1>
        <p className="text-gray-500 mb-8 max-w-sm">Please select a Gemini API key to start generating synthetic data.</p>
        <button 
          onClick={() => (window as any).aistudio.openSelectKey()} 
          className="bg-blue-600 text-white py-3 px-8 rounded-md font-bold shadow-lg hover:bg-blue-700 transition-colors"
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
           <>
            <Header />
            <StartScreen onModelFinalized={handleModelFinalized} />
           </>
        ) : (
          <>
          <Header />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-row h-[calc(100vh-64px)] overflow-hidden"
          >
            <VersionHistoryPanel 
                history={history} 
                activeId={currentProject.id} 
                onRestore={handleRestoreVersion} 
            />
            
            <main className="flex-grow relative flex flex-col md:flex-row">
              <div className="flex-grow flex items-center justify-center p-4 bg-gray-100/50 relative overflow-hidden">
                <Canvas 
                  displayImageUrl={currentProject.imageUrl}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onStartOver={() => setHistory([])}
                  onOpenCrop={() => setIsCropping(true)}
                  onRemoveObject={handleRemoveObject}
                  onPlaceObject={handlePlaceObject}
                  activeAssetId={activeAsset?.info.id || null}
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

              <aside className="w-full md:w-80 bg-white border-l border-gray-200 flex flex-col p-6 overflow-hidden shadow-xl z-10 h-full">
                <div className="flex flex-col gap-6 h-full">
                   
                   <div className="flex-shrink-0">
                       <ProjectStack 
                          layers={currentProject.assetsApplied} 
                          onRemove={() => {
                            if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                          }} 
                       />
                   </div>

                   <div className="flex-grow overflow-hidden min-h-0">
                       <AssetPanel 
                          onAssetSelect={handleAssetSelect}
                          isLoading={isLoading}
                          assets={defaultAssets}
                          activeAssetId={activeAsset?.info.id || null}
                       />
                   </div>

                   <div className="space-y-3 flex-shrink-0 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Global Adjustments</h2>
                      </div>
                      <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="e.g. 'Add more steam', 'Make floor grimy'..."
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 font-sans"
                      />
                      <button 
                        onClick={handlePromptSubmit}
                        disabled={isLoading || !userPrompt.trim()}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                      >
                        <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Apply Environment Mod
                      </button>
                   </div>
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
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
