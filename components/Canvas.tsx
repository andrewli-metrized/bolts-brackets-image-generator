
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState, useEffect } from 'react';
// Added Trash2Icon to the imports
import { RotateCcwIcon, EraserIcon, MousePointerIcon, Trash2Icon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  placementCoord: { x: number; y: number } | null;
  onSetPlacementCoord: (coord: { x: number; y: number } | null) => void;
  onOpenCrop: () => void;
  onRemoveObject: (box: { x: number; y: number; width: number; height: number }) => void;
}

type ToolMode = 'placement' | 'removal';

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage,
  placementCoord,
  onSetPlacementCoord,
  onOpenCrop,
  onRemoveObject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<ToolMode>('placement');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const getNormalizedCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading || !displayImageUrl) return;

    if (activeTool === 'placement') {
      const { x, y } = getNormalizedCoords(e.clientX, e.clientY);
      onSetPlacementCoord({ x, y });
      setSelectionBox(null);
    } else if (activeTool === 'removal') {
      setIsDrawing(true);
      const coords = getNormalizedCoords(e.clientX, e.clientY);
      setStartPoint(coords);
      setSelectionBox({ ...coords, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || activeTool !== 'removal') return;

    const coords = getNormalizedCoords(e.clientX, e.clientY);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setSelectionBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (activeTool === 'removal' && isDrawing) {
      setIsDrawing(false);
    }
  };

  const handleConfirmRemoval = () => {
    if (selectionBox && selectionBox.width > 2 && selectionBox.height > 2) {
      onRemoveObject(selectionBox);
      setSelectionBox(null);
    }
  };

  // Reset tool when starting over or image changes
  useEffect(() => {
    setSelectionBox(null);
  }, [displayImageUrl]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group font-sans">
      {/* Controls Overlay - Top Left */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <button 
            onClick={onStartOver}
            className="flex items-center justify-center text-center bg-white/80 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-black active:scale-95 text-sm shadow-sm backdrop-blur-sm"
        >
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            New Room
        </button>
        {displayImageUrl && !isLoading && (
          <button 
            onClick={onOpenCrop}
            className="flex items-center justify-center text-center bg-black border border-black text-white font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-gray-800 active:scale-95 text-sm shadow-lg"
          >
            Crop Design
          </button>
        )}
      </div>

      {/* Vertical Toolbar - Middle Right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-2xl shadow-xl">
        <button
          onClick={() => setActiveTool('placement')}
          title="Placement Tool"
          className={`p-3 rounded-xl transition-all ${
            activeTool === 'placement' 
            ? 'bg-black text-white shadow-lg scale-110' 
            : 'text-gray-400 hover:text-black hover:bg-gray-50'
          }`}
        >
          <MousePointerIcon className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTool('removal')}
          title="Eraser / Removal Tool"
          className={`p-3 rounded-xl transition-all ${
            activeTool === 'removal' 
            ? 'bg-red-500 text-white shadow-lg scale-110' 
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <EraserIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Removal Confirm Button - Bottom */}
      <AnimatePresence>
        {selectionBox && !isDrawing && activeTool === 'removal' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-10 z-30 flex gap-3"
          >
            <button
              onClick={() => setSelectionBox(null)}
              className="bg-white text-gray-700 font-bold py-3 px-8 rounded-full shadow-2xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRemoval}
              className="bg-red-600 text-white font-bold py-3 px-10 rounded-full shadow-2xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <Trash2Icon className="w-5 h-5" />
              Remove Selected Region
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructional Tooltip */}
      {!placementCoord && !selectionBox && !isLoading && displayImageUrl && (
        <div className="absolute top-4 right-4 z-30 pointer-events-none">
          <div className="bg-black/70 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md font-sans font-bold">
            {activeTool === 'placement' ? 'Click room to set placement point' : 'Drag to draw removal box'}
          </div>
        </div>
      )}

      {/* Image Display */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full max-w-5xl flex items-center justify-center rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner transition-all select-none ${
          isLoading ? 'cursor-wait' : activeTool === 'removal' ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
      >
        {displayImageUrl ? (
          <>
            <img
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Room Design"
              className="w-full h-full object-contain transition-opacity duration-500 animate-fade-in"
              draggable={false}
            />
            
            {/* Placement Marker */}
            <AnimatePresence>
              {placementCoord && !isLoading && activeTool === 'placement' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ 
                    left: `${placementCoord.x}%`, 
                    top: `${placementCoord.y}%`,
                    position: 'absolute'
                  }}
                  className="z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-12 h-12 bg-black/20 rounded-full animate-ping" />
                    <div className="w-6 h-6 border-2 border-white bg-black/50 rounded-full shadow-lg flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Removal Box */}
            <AnimatePresence>
              {selectionBox && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    left: `${selectionBox.x}%`,
                    top: `${selectionBox.y}%`,
                    width: `${selectionBox.width}%`,
                    height: `${selectionBox.height}%`,
                    position: 'absolute',
                  }}
                  className="z-40 border-2 border-red-500 bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.3)] pointer-events-none"
                >
                  <div className="absolute -top-3 -left-3 w-6 h-6 border-l-4 border-t-4 border-red-600" />
                  <div className="absolute -top-3 -right-3 w-6 h-6 border-r-4 border-t-4 border-red-600" />
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 border-l-4 border-bottom-4 border-red-600" />
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 border-r-4 border-bottom-4 border-red-600" />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
            <div className="flex flex-col items-center justify-center font-sans">
              <Spinner />
              <p className="text-md font-sans text-gray-600 mt-4 font-medium">Initializing Studio...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 font-sans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-sans text-gray-800 mt-4 text-center px-4 font-bold tracking-tight">
                        {loadingMessage}
                      </p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Canvas;
