/** Rangoli powder colours. */
export const PALETTE: [string, string][] = [
  ['Kumkum red', '#E3262F'], ['Sindoor', '#F4562B'], ['Marigold', '#FF9B1F'], ['Haldi yellow', '#FFD12E'],
  ['Parrot green', '#7ACC4C'], ['Leaf green', '#1E9150'], ['Peacock blue', '#0E94AC'], ['Sky blue', '#58C6F5'],
  ['Indigo', '#3B4FD6'], ['Jamun purple', '#8C3FD6'], ['Rani pink', '#EC3392'], ['Rose', '#FF97BE'],
  ['Chalk white', '#F7F1E3'], ['Clay', '#A0522D'],
];
/** The accent colour that goes with palette entry `ci` when a Make piece is placed. */
export const second = (ci: number): string => PALETTE[(ci + 5) % PALETTE.length][1];
