
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
    id: 'room-2',
    name: 'Modern Living',
    url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'room-3',
    name: 'Minimal Bedroom',
    url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'room-4',
    name: 'Elevated Living',
    url: 'https://i.imgur.com/DCNoHez.jpeg',
  },
  {
    id: 'room-5',
    name: 'Elevated Home Office',
    url: 'https://i.imgur.com/CODj3Ms.jpeg',
  }
];