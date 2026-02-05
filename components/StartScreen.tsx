
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { referenceRooms } from '../referenceModels';
import { generateRoomBase } from '../services/geminiService';
import { getFriendlyErrorMessage, urlToFile } from '../lib/utils';
import { UploadCloudIcon, ChevronRightIcon } from './icons';
import Spinner from './Spinner';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string, ratio: string) => void;
}

const RATIOS = ["1:1", "16:9", "9:16", "3:4", "4:3"];

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState("16:9");

  const startGeneration = useCallback(async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Creating your Room Studio Base...');

    try {
      const generatedUrl = await generateRoomBase(imageFile, selectedRatio);
      setPreviewImage(generatedUrl);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to process room'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedRatio]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) startGeneration(file);
  };

  const handleReferenceSelect = async (room: typeof referenceRooms[0]) => {
    setIsLoading(true);
    try {
      const file = await urlToFile(room.url, `${room.id}.jpg`);
      startGeneration(file);
    } catch (err) {
      setError("Failed to load reference room.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-8 min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" className="flex flex-col items-center">
            <Spinner />
            <p className="mt-4 text-xl font-sans font-medium">{loadingMessage}</p>
          </motion.div>
        ) : previewImage ? (
          <motion.div key="preview" className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <h1 className="text-4xl font-sans font-bold tracking-tight">Studio Base Ready</h1>
            <div className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border-8 border-white bg-gray-100 flex items-center justify-center`}>
              <img src={previewImage} className="w-full h-full object-contain" alt="Base Room" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPreviewImage(null)} className="px-8 py-3 rounded-full border border-gray-300 font-bold hover:bg-gray-50">Back</button>
              <button onClick={() => onModelFinalized(previewImage, selectedRatio)} className="px-12 py-3 bg-black text-white rounded-full flex items-center gap-2 font-bold shadow-xl hover:scale-105 transition-transform">
                Start Design <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="intro" className="flex flex-col items-center w-full">
            <div className="max-w-2xl text-center mb-12">
              <h1 className="text-6xl font-sans font-bold mb-6 tracking-tight">EQ3 Studio</h1>
              <p className="text-lg text-gray-600">Choose your project format, then upload a space to begin.</p>
            </div>

            {/* Aspect Ratio Picker */}
            <div className="flex flex-col items-center gap-4 mb-10 w-full">
               <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Select Project Format</p>
               <div className="flex flex-wrap justify-center gap-3">
                  {RATIOS.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setSelectedRatio(ratio)}
                      className={`px-6 py-2 rounded-full border-2 font-bold transition-all ${
                        selectedRatio === ratio 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
               </div>
            </div>

            <label className="w-full max-w-lg aspect-video rounded-3xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all mb-12">
              <UploadCloudIcon className="w-16 h-16 text-gray-300 mb-4" />
              <span className="text-xl font-medium">Upload Room Photo</span>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>

            <div className="w-full">
              <p className="text-sm font-bold tracking-widest text-gray-400 mb-8 uppercase text-center">Or try a reference space</p>
              <div className="flex flex-wrap justify-center gap-4">
                {referenceRooms.map(room => (
                  <div 
                    key={room.id} 
                    onClick={() => handleReferenceSelect(room)} 
                    className="group cursor-pointer relative aspect-video w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] max-w-[280px] rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    <img src={room.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <p className="absolute bottom-3 left-3 text-white text-sm font-bold">{room.name}</p>
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="mt-6 text-red-500 font-medium">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartScreen;