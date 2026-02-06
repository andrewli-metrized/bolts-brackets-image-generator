
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef, useState, useEffect } from 'react';
import { RotateCcwIcon, EraserIcon, MousePointerIcon, Trash2Icon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onOpenCrop: () => void;
  onRemoveObject: (box: { x: number; y: number; width: number; height: number }) => void;
  onPlaceObject: (box: { x: number; y: number; width: number; height: number }) => void;
  activeAssetId: string | null;
}

type ToolMode = 'placement' | 'removal';

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage,
  onOpenCrop,
  onRemoveObject,
  onPlaceObject,
  activeAssetId
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

    // For both tools, we now start drawing a box
    setIsDrawing(true);
    const coords = getNormalizedCoords(e.clientX, e.clientY);
    setStartPoint(coords);
    setSelectionBox({ ...coords, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const coords = getNormalizedCoords(e.clientX, e.clientY);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setSelectionBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (selectionBox && selectionBox.width > 2 && selectionBox.height > 2) {
       // If in placement mode, verify we have an asset, then trigger
       if (activeTool === 'placement') {
         if (activeAssetId) {
             onPlaceObject(selectionBox);
             setSelectionBox(null);
         } else {
             // Keep box but maybe flash a warning (handled by parent or just ignored)
             // For now, we clear it if no asset is selected to avoid confusion, 
             // but effectively we just leave it so they can see they drew something 
             // and then realize they need to pick an asset. 
             // Let's actually keep the box visible until they select an asset or cancel?
             // Simplest: Auto-cancel if no asset.
             alert("Please select a hardware part from the inventory first.");
             setSelectionBox(null);
         }
       }
       // If removal mode, we wait for confirmation button
    } else {
        setSelectionBox(null);
    }
  };

  const handleConfirmRemoval = () => {
    if (selectionBox && activeTool === 'removal') {
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
            className="flex items-center justify-center text-center bg-white/90 border border-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 text-xs shadow-sm"
        >
            <RotateCcwIcon className="w-3 h-3 mr-2" />
            New Background
        </button>
        {displayImageUrl && !isLoading && (
          <button 
            onClick={onOpenCrop}
            className="flex items-center justify-center text-center bg-gray-800 border border-transparent text-white font-semibold py-2 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-black text-xs shadow-sm"
          >
            Crop Output
          </button>
        )}
      </div>

      {/* Vertical Toolbar - Middle Right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 bg-white/90 backdrop-blur-md border border-gray-200 p-2 rounded-lg shadow-xl">
        <button
          onClick={() => { setActiveTool('placement'); setSelectionBox(null); }}
          title="Placement Tool (Select Asset -> Drag Box)"
          className={`p-3 rounded-md transition-all ${
            activeTool === 'placement' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          <MousePointerIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setActiveTool('removal'); setSelectionBox(null); }}
          title="Removal Tool (Drag Box -> Remove)"
          className={`p-3 rounded-md transition-all ${
            activeTool === 'removal' 
            ? 'bg-red-500 text-white shadow-md' 
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <EraserIcon className="w-5 h-5" />
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
              className="bg-white text-gray-700 font-bold py-3 px-8 rounded-full shadow-xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRemoval}
              className="bg-red-600 text-white font-bold py-3 px-10 rounded-full shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center gap-2 text-sm"
            >
              <Trash2Icon className="w-4 h-4" />
              Remove Object
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructional Tooltip */}
      {!isDrawing && !selectionBox && !isLoading && displayImageUrl && (
        <div className="absolute top-4 right-4 z-30 pointer-events-none">
          <div className="bg-black/80 text-white text-[10px] uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md font-sans font-bold border border-white/10 shadow-lg">
            {activeTool === 'placement' 
                ? (activeAssetId ? 'Drag box to insert selected part' : 'Select a part from inventory first') 
                : 'Drag to draw removal box'
            }
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
        className={`relative w-full max-w-5xl flex items-center justify-center rounded-sm overflow-hidden bg-gray-200 border border-gray-300 shadow-inner transition-all select-none ${
          isLoading ? 'cursor-wait' : 'cursor-crosshair'
        }`}
      >
        {displayImageUrl ? (
          <>
            <img
              key={displayImageUrl}
              src={displayImageUrl}
              alt="Workstation"
              className="w-full h-full object-contain transition-opacity duration-500 animate-fade-in"
              draggable={false}
            />
            
            {/* Selection Box (Used for both Placement and Removal) */}
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
                  className={`z-40 border-2 shadow-sm pointer-events-none ${
                      activeTool === 'placement' 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : 'border-red-500 bg-red-500/20'
                  }`}
                >
                    {/* Corner Markers */}
                    <div className={`absolute -top-1 -left-1 w-2 h-2 ${activeTool === 'placement' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <div className={`absolute -top-1 -right-1 w-2 h-2 ${activeTool === 'placement' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${activeTool === 'placement' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${activeTool === 'placement' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    
                    {activeTool === 'placement' && !isDrawing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Spinner />
                        </div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
            <div className="flex flex-col items-center justify-center font-sans">
              <Spinner />
              <p className="text-sm font-sans text-gray-500 mt-4 font-medium">Initializing Environment...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 font-sans"
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
