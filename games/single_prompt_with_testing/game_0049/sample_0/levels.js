// levels.js - Level configurations and puzzle setups
import { Panel } from './panel.js';
import { gameState } from './globals.js';

export function setupLevel(levelIndex) {
  const panels = [];
  
  switch(levelIndex) {
    case 0: // Tutorial level - Simple zoom to reveal
      panels.push(new Panel(0, 'forest', 0));
      panels.push(new Panel(1, 'mountain', 0));
      panels.push(new Panel(2, 'river', 0));
      panels.push(new Panel(3, 'temple', 0));
      panels[3].hasOrb = true; // Orb in temple panel
      break;
      
    case 1: // Level 2 - Panel connections
      panels.push(new Panel(0, 'city', 0));
      panels.push(new Panel(1, 'window', 0));
      panels.push(new Panel(2, 'door', 0));
      panels.push(new Panel(3, 'garden', 0));
      panels[1].hasOrb = true;
      panels[1].connectedTo = [0]; // Window connects to city
      break;
      
    case 2: // Level 3 - Swap mechanics
      panels.push(new Panel(0, 'tower', 0));
      panels.push(new Panel(1, 'stairs', 0));
      panels.push(new Panel(2, 'bridge', 0));
      panels.push(new Panel(3, 'cave', 0));
      panels[2].hasOrb = true;
      break;
      
    case 3: // Level 4 - Multiple zoom levels
      panels.push(new Panel(0, 'sky', 0));
      panels.push(new Panel(1, 'cloud', 0));
      panels.push(new Panel(2, 'bird', 0));
      panels.push(new Panel(3, 'nest', 0));
      panels[3].hasOrb = true;
      panels[2].connectedTo = [3];
      break;
      
    case 4: // Level 5 - Complex puzzle
      panels.push(new Panel(0, 'palace', 0));
      panels.push(new Panel(1, 'mirror', 0));
      panels.push(new Panel(2, 'crystal', 0));
      panels.push(new Panel(3, 'treasure', 0));
      panels[0].hasOrb = true;
      panels[1].connectedTo = [0];
      panels[2].connectedTo = [3];
      break;
  }
  
  return panels;
}

export function checkLevelComplete(panels) {
  // Check if orb in current level is collected
  for (let panel of panels) {
    if (panel.hasOrb && panel.orbRevealed) {
      return true;
    }
  }
  return false;
}