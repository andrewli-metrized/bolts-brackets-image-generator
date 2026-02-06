
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AssetItem } from '../types';
import { Trash2Icon } from './icons';

interface ProjectStackProps {
  layers: AssetItem[];
  onRemove: () => void;
}

const ProjectStack: React.FC<ProjectStackProps> = ({ layers, onRemove }) => {
  return (
    <div className="flex flex-col gap-3 font-sans">
      <h2 className="text-xs font-bold tracking-widest text-gray-500 uppercase border-b border-gray-200 pb-2">Added Augmentations</h2>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {layers.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2">No hardware added yet.</p>
        ) : (
          layers.map((asset, index) => (
            <div key={`${asset.id}-${index}`} className="flex items-center gap-3 bg-white p-2 rounded-md border border-gray-200 shadow-sm">
              <img src={asset.url} className="w-8 h-8 rounded object-cover bg-gray-100" />
              <div className="flex-grow">
                <p className="text-xs font-bold truncate text-gray-800">{asset.name}</p>
                <p className="text-[10px] text-gray-500">Object #{index + 1}</p>
              </div>
              {index === layers.length - 1 && (
                <button onClick={onRemove} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors rounded">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectStack;
