
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
    setLoadingMessage('Preparing factory environment...');

    try {
      const generatedUrl = await generateRoomBase(imageFile, selectedRatio);
      setPreviewImage(generatedUrl);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to process image'));
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
        ) : previewImage ? (
          <motion.div key="preview" className="flex flex-col items-center gap-8 w-full max-w-4xl">
            <h1 className="text-3xl font-sans font-bold tracking-tight text-gray-900">Environment Ready</h1>
            <div className={`w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-50 flex items-center justify-center`}>
              <img src={previewImage} className="w-full h-full object-contain" alt="Base Factory" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPreviewImage(null)} className="px-8 py-3 rounded-md border border-gray-300 font-bold hover:bg-gray-50 text-sm">Back</button>
              <button onClick={() => onModelFinalized(previewImage, selectedRatio)} className="px-12 py-3 bg-blue-600 text-white rounded-md flex items-center gap-2 font-bold shadow-lg hover:bg-blue-700 transition-colors text-sm">
                Start Augmentation <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="intro" className="flex flex-col items-center w-full">
            <div className="max-w-2xl text-center mb-12">
              <h1 className="text-5xl font-sans font-bold mb-6 tracking-tight text-gray-900">Synthetic Data Gen</h1>
              <p className="text-lg text-gray-500">Upload a factory or assembly line background to begin generating training data.</p>
            </div>

            {/* Aspect Ratio Picker */}
            <div className="flex flex-col items-center gap-4 mb-10 w-full">
               <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Output Resolution</p>
               <div className="flex flex-wrap justify-center gap-2">
                  {RATIOS.map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setSelectedRatio(ratio)}
                      className={`px-4 py-2 rounded-md border font-medium text-sm transition-all ${
                        selectedRatio === ratio 
                        ? "bg-gray-900 text-white border-gray-900" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
               </div>
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
