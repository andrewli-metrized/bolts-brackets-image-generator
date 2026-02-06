
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
// Changed WardrobeItem to AssetItem to match types.ts
import type { AssetItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon, XIcon } from './icons';

interface WardrobePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onGarmentSelect: (garmentFile: File, garmentInfo: AssetItem) => void;
  onGarmentUpload?: (files: File[]) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: AssetItem[];
}

// Helper to convert image URL to a File object using a canvas to bypass potential CORS issues.
const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context.'));
            }
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas toBlob failed.'));
                }
                const mimeType = blob.type || 'image/png';
                const file = new File([blob], filename, { type: mimeType });
                resolve(file);
            }, 'image/png');
        };

        image.onerror = (error) => {
            reject(new Error(`Could not load image from URL for canvas conversion. Error: ${error}`));
        };

        image.src = url;
    });
};

const WardrobeModal: React.FC<WardrobePanelProps> = ({ isOpen, onClose, onGarmentSelect, onGarmentUpload, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGarmentClick = async (item: AssetItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            // If the item was from an upload, its URL is a blob URL. We need to fetch it to create a file.
            // If it was a default item, it's a regular URL. This handles both.
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load item: ${item.url}`, err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Added explicit File[] type to avoid 'unknown' inference
            const files = Array.from(e.target.files) as File[];
            const validFiles = files.filter(file => file.type.startsWith('image/'));

            if (validFiles.length === 0) {
                setError('Please select valid image files.');
                return;
            }

            if (onGarmentUpload) {
                onGarmentUpload(validFiles);
            } else {
                 // Fallback to original single file immediate select logic if no upload handler
                const file = validFiles[0];
                const customGarmentInfo: AssetItem = {
                    id: `custom-${Date.now()}`,
                    name: file.name,
                    url: URL.createObjectURL(file),
                };
                onGarmentSelect(file, customGarmentInfo);
            }
            
            // Reset input so the same files can be selected again if needed
            e.target.value = '';
        }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Select Target Object</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a hardware part to overlay or upload your own.</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {wardrobe.map((item) => {
                const isActive = activeGarmentIds.includes(item.id);
                return (
                    <button
                    key={item.id}
                    onClick={() => handleGarmentClick(item)}
                    disabled={isLoading || isActive}
                    className="relative aspect-square border-2 border-transparent hover:border-blue-500 rounded-xl overflow-hidden transition-all duration-200 group bg-gray-50 shadow-sm hover:shadow-md"
                    aria-label={`Select ${item.name}`}
                    >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover p-2" />
                    <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm py-2 px-1 border-t border-gray-100">
                         <p className="text-xs font-bold text-center text-gray-700 truncate">{item.name}</p>
                    </div>
                    
                    {isActive && (
                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center border-4 border-blue-600 rounded-xl">
                            <div className="bg-white text-blue-600 rounded-full p-1 shadow-lg">
                                <CheckCircleIcon className="w-6 h-6" />
                            </div>
                        </div>
                    )}
                    </button>
                );
                })}
                <label htmlFor="modal-upload" className={`relative aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 transition-all ${isLoading ? 'cursor-not-allowed bg-gray-50' : 'hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 cursor-pointer group'}`}>
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloudIcon className="w-6 h-6"/>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide">Upload New</span>
                    <input 
                        id="modal-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/webp" 
                        multiple
                        onChange={handleFileChange} 
                        disabled={isLoading}
                    />
                </label>
            </div>
            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WardrobeModal;
