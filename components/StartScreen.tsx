
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { referenceRooms } from '../referenceModels';
import { generateRoomBase } from '../services/geminiService';
import { getFriendlyErrorMessage, urlToFile } from '../lib/utils';
import { UploadCloudIcon } from './icons';
import Spinner from './Spinner';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startGeneration = useCallback(async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Processing background...');

    try {
      // Process image and immediately callback to parent to switch screens
      const generatedUrl = await generateRoomBase(imageFile);
      onModelFinalized(generatedUrl);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to process image'));
      setIsLoading(false);
    }
  }, [onModelFinalized]);

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
      setError("Failed to load reference image.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-8 min-h-screen font-sans">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" className="flex flex-col items-center">
            <Spinner />
            <p className="mt-4 text-xl font-sans font-medium text-gray-700">{loadingMessage}</p>
          </motion.div>
        ) : (
          <motion.div key="intro" className="flex flex-col items-center w-full">
            <div className="max-w-2xl text-center mb-12">
              <h1 className="text-5xl font-sans font-bold mb-6 tracking-tight text-gray-900">Synthetic Data Gen</h1>
              <p className="text-lg text-gray-500">Upload a factory or assembly line background to begin.</p>
            </div>

            <label className="w-full max-w-lg aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-all mb-12 group">
              <UploadCloudIcon className="w-12 h-12 text-gray-300 mb-4 group-hover:text-blue-500 transition-colors" />
              <span className="text-lg font-medium text-gray-700">Upload Background Image</span>
              <span className="text-sm text-gray-400 mt-2">Factory floor, workbench, or assembly line</span>
              <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
            </label>

            <div className="w-full">
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-6 uppercase text-center">Or use a sample environment</p>
              <div className="flex flex-wrap justify-center gap-4">
                {referenceRooms.map(room => (
                  <div 
                    key={room.id} 
                    onClick={() => handleReferenceSelect(room)} 
                    className="group cursor-pointer relative aspect-video w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] max-w-[280px] rounded-lg overflow-hidden shadow-sm hover:shadow-md border border-gray-200 transition-all"
                  >
                    <img src={room.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    <p className="absolute bottom-2 left-2 text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">{room.name}</p>
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
