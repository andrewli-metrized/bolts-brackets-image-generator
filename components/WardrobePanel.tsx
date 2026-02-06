
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AssetItem } from '../types';
import { urlToFile } from '../lib/utils';
import { UploadCloudIcon, CheckCircleIcon } from './icons';

interface AssetPanelProps {
  onAssetSelect: (file: File, info: AssetItem) => void;
  isLoading: boolean;
  assets: AssetItem[];
  activeAssetId: string | null;
}

const AssetPanel: React.FC<AssetPanelProps> = ({ onAssetSelect, isLoading, assets, activeAssetId }) => {
  const handleSelect = async (item: AssetItem) => {
    if (isLoading) return;
    try {
      const file = await urlToFile(item.url, item.name);
      onAssetSelect(file, item);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-sans h-full">
      <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase border-b border-gray-200 pb-2">Parts Inventory</h2>
      <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4">
        {assets.map(asset => (
          <button
            key={asset.id}
            onClick={() => handleSelect(asset)}
            disabled={isLoading}
            className={`group relative aspect-square rounded-lg overflow-hidden border transition-all ${
                activeAssetId === asset.id 
                ? 'border-blue-600 ring-2 ring-blue-600/20' 
                : 'border-gray-200 hover:border-blue-400'
            }`}
          >
            <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
            <div className={`absolute inset-x-0 bottom-0 p-2 transition-opacity ${activeAssetId === asset.id ? 'opacity-100 bg-blue-600/80' : 'opacity-0 group-hover:opacity-100 bg-black/60'}`}>
              <p className="text-[10px] text-white font-bold truncate text-center">{asset.name}</p>
            </div>
            {activeAssetId === asset.id && (
                <div className="absolute top-2 right-2 bg-white rounded-full text-blue-600 p-0.5">
                    <CheckCircleIcon className="w-4 h-4" />
                </div>
            )}
          </button>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
          <UploadCloudIcon className="w-6 h-6 text-gray-300" />
          <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase text-center">Upload Part</span>
          <input type="file" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAssetSelect(file, { id: `custom-${Date.now()}`, name: file.name, url: URL.createObjectURL(file) });
          }} />
        </label>
      </div>
    </div>
  );
};

export default AssetPanel;
