
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
// Changed WardrobeItem to AssetItem to match types.ts
import type { AssetItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';

interface WardrobePanelProps {
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

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, onGarmentUpload, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);

    const handleGarmentClick = async (item: AssetItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        try {
            // If the item was from an upload, its URL is a blob URL. We need to fetch it to create a file.
            // If it was a default item, it's a regular URL. This handles both.
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            const detailedError = `Failed to load wardrobe item. This is often a CORS issue. Check the developer console for details.`;
            setError(detailedError);
            console.error(`[CORS Check] Failed to load and convert wardrobe item from URL: ${item.url}. The browser's console should have a specific CORS error message if that's the issue.`, err);
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
    <div className="pt-6 border-t border-gray-400/50">
        <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Wardrobe</h2>
        <div className="grid grid-cols-3 gap-3">
            {wardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            return (
                <button
                key={item.id}
                onClick={() => handleGarmentClick(item)}
                disabled={isLoading || isActive}
                className="relative aspect-square border rounded-lg overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 group disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label={`Select ${item.name}`}
                >
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-bold text-center p-1">{item.name}</p>
                </div>
                {isActive && (
                    <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                    </div>
                )}
                </button>
            );
            })}
            <label htmlFor="custom-garment-upload" className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400 hover:text-gray-600 cursor-pointer'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-xs text-center">Upload</span>
                <input 
                    id="custom-garment-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp, image/avif, image/heic, image/heif" 
                    multiple
                    onChange={handleFileChange} 
                    disabled={isLoading}
                />
            </label>
        </div>
        {wardrobe.length === 0 && (
             <p className="text-center text-sm text-gray-500 mt-4">Your uploaded garments will appear here.</p>
        )}
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default WardrobePanel;
