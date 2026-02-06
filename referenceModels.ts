
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface ReferenceRoom {
  id: string;
  name: string;
  url: string;
}

export const referenceRooms: ReferenceRoom[] = [
  {
    id: 'factory-1',
    name: 'Assembly Line',
    url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'factory-2',
    name: 'Welding Station',
    url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'factory-3',
    name: 'Metal Workshop',
    url: 'https://images.unsplash.com/photo-1533230635465-c3cd8f1dfc5b?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 'factory-4',
    name: 'Conveyor Belt',
    url: 'https://images.unsplash.com/photo-1596489397637-b4d2938817a5?auto=format&fit=crop&q=80&w=1200',
  }
];