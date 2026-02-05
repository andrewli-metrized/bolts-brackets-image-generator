
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
      <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Room Assets</h2>
      <div className="space-y-2">
        {layers.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No furniture added yet.</p>
        ) : (
          layers.map((asset, index) => (
            <div key={`${asset.id}-${index}`} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <img src={asset.url} className="w-10 h-10 rounded object-cover" />
              <div className="flex-grow">
                <p className="text-xs font-bold truncate">{asset.name}</p>
                <p className="text-[10px] text-gray-500">Placed # {index + 1}</p>
              </div>
              {index === layers.length - 1 && (
                <button onClick={onRemove} className="p-1 hover:text-red-500 transition-colors">
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
