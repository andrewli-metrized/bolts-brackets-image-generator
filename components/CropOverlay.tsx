
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { motion } from 'framer-motion';
import { getCroppedImg } from '../lib/utils';
import { XIcon, CheckCircleIcon } from './icons';

interface CropOverlayProps {
  imageSrc: string;
  onConfirm: (croppedSrc: string) => void;
  onCancel: () => void;
}

const RATIOS = [
  { label: 'Free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '16:9', value: 16/9 },
  { label: '9:16', value: 9/16 },
  { label: '3:4', value: 3/4 },
  { label: '4:3', value: 4/3 },
];

export const CropOverlay: React.FC<CropOverlayProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(16 / 9);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        aspect || 1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleConfirm = async () => {
    // Use completedCrop for the final calculation as it's guaranteed to be in pixels
    if (imgRef.current && completedCrop) {
      try {
        const cropped = await getCroppedImg(imgRef.current, completedCrop);
        onConfirm(cropped);
      } catch (err) {
        console.error("Crop failed", err);
      }
    }
  };

  const handleAspectChange = (newAspect: number) => {
    setAspect(newAspect || undefined);
    if (imgRef.current) {
        const { width, height } = imgRef.current;
        const newCrop = centerCrop(
            makeAspectCrop(
              { unit: '%', width: 90 },
              newAspect || 1,
              width,
              height
            ),
            width,
            height
          );
          setCrop(newCrop);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 md:p-10 overflow-hidden font-sans"
    >
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <h2 className="text-white text-2xl font-sans font-bold tracking-tight">Crop Your Design</h2>
        <div className="flex gap-4">
           <button onClick={onCancel} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
             <XIcon className="w-6 h-6" />
           </button>
        </div>
      </div>

      <div className="flex-grow w-full max-w-5xl flex items-center justify-center overflow-hidden">
        <ReactCrop 
          crop={crop} 
          onChange={c => setCrop(c)}
          onComplete={c => setCompletedCrop(c)}
          aspect={aspect}
          className="max-h-full"
        >
          <img 
            ref={imgRef}
            src={imageSrc} 
            onLoad={onImageLoad} 
            // Removed object-contain to ensure the DOM element matches the rendered pixel area
            className="max-w-full max-h-[70vh] block h-auto w-auto shadow-2xl" 
            alt="To crop" 
          />
        </ReactCrop>
      </div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col gap-6 mt-8">
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold text-center">Aspect Ratio</p>
          <div className="flex flex-wrap justify-center gap-2">
            {RATIOS.map(r => (
              <button
                key={r.label}
                onClick={() => handleAspectChange(r.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  (aspect === r.value || (r.value === 0 && !aspect)) 
                  ? "bg-white text-black" 
                  : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleConfirm}
          disabled={!completedCrop}
          className="w-full bg-white text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
        >
          <CheckCircleIcon className="w-5 h-5" />
          Apply Crop
        </button>
      </div>
    </motion.div>
  );
};
