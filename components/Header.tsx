
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { UploadCloudIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full py-5 px-4 md:px-8 bg-white sticky top-0 z-40 font-sans border-b border-gray-100">
      <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-lg">
             <UploadCloudIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-sans font-bold tracking-widest text-gray-800 uppercase">
            Welding Augmentation <span className="text-gray-400 text-xs ml-2 normal-case tracking-normal border border-gray-200 px-2 py-0.5 rounded-full">v2.0 (Synthetic Data)</span>
          </h1>
      </div>
    </header>
  );
};

export default Header;
