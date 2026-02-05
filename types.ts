
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface AssetItem {
  id: string;
  name: string;
  url: string;
}

export interface ProjectState {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: number;
  assetsApplied: AssetItem[];
}
