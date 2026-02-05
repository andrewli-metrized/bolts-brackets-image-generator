
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ProjectState } from '../types';
import { DownloadIcon } from './icons';

interface HistoryProps {
  history: ProjectState[];
  activeId: string;
  onRestore: (id: string) => void;
}

const VersionHistoryPanel: React.FC<HistoryProps> = ({ history, activeId, onRestore }) => {
  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Version History</h2>
      <div className="flex flex-col gap-4">
        {history.map((state, index) => (
          <div
            key={state.id}
            className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
              state.id === activeId ? 'border-black ring-2 ring-black/10' : 'border-transparent hover:border-gray-300'
            }`}
          >
            {/* Clickable Area for Restore */}
            <div 
              onClick={() => onRestore(state.id)} 
              className="w-full h-full cursor-pointer relative"
            >
              <img src={state.imageUrl} className="w-full h-full object-cover" alt={`Version ${index + 1}`} />
              
              {/* Overlay with Version Label */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                <span className="text-[10px] bg-white px-2 py-1 rounded-full font-bold shadow-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  v{index + 1}
                </span>
              </div>
            </div>

            {/* Download Button - Top Right on Hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(state.imageUrl, `v${index + 1}.png`);
              }}
              className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-all z-20"
              title={`Download Version ${index + 1}`}
            >
              <DownloadIcon className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default VersionHistoryPanel;
