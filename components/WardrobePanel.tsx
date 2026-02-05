
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AssetItem } from '../types';
import { urlToFile } from '../lib/utils';
import { UploadCloudIcon } from './icons';

interface AssetPanelProps {
  onAssetSelect: (file: File, info: AssetItem) => void;
  isLoading: boolean;
  assets: AssetItem[];
}

const AssetPanel: React.FC<AssetPanelProps> = ({ onAssetSelect, isLoading, assets }) => {
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
    <div className="flex flex-col gap-3 font-sans">
      <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Furniture Gallery</h2>
      <div className="grid grid-cols-2 gap-3">
        {assets.map(asset => (
          <button
            key={asset.id}
            onClick={() => handleSelect(asset)}
            disabled={isLoading}
            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 hover:border-black transition-all"
          >
            <img src={asset.url} className="w-full h-full object-cover" alt={asset.name} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white font-bold truncate">{asset.name}</p>
            </div>
          </button>
        ))}
        <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
          <UploadCloudIcon className="w-6 h-6 text-gray-300" />
          <span className="text-[10px] font-bold mt-1 text-gray-400 uppercase">Add Your Own</span>
          <input type="file" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAssetSelect(file, { id: 'custom', name: file.name, url: URL.createObjectURL(file) });
          }} />
        </label>
      </div>
    </div>
  );
};

export default AssetPanel;
