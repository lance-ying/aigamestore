// levels.js - Level generation
import { Pig, Structure } from './entities.js';
import { GROUND_Y, CANVAS_WIDTH } from './globals.js';

export function generateLevel(p, levelNum) {
  const pigs = [];
  const structures = [];
  
  const baseX = CANVAS_WIDTH - 200;
  
  if (levelNum === 1) {
    // Simple tower
    structures.push(new Structure(p, baseX, GROUND_Y - 20, 15, 40, 'wood'));
    structures.push(new Structure(p, baseX + 40, GROUND_Y - 20, 15, 40, 'wood'));
    structures.push(new Structure(p, baseX + 20, GROUND_Y - 50, 50, 15, 'wood'));
    pigs.push(new Pig(p, baseX + 20, GROUND_Y - 70));
  } else if (levelNum === 2) {
    // Two-story structure
    structures.push(new Structure(p, baseX - 20, GROUND_Y - 20, 15, 40, 'wood'));
    structures.push(new Structure(p, baseX + 20, GROUND_Y - 20, 15, 40, 'wood'));
    structures.push(new Structure(p, baseX, GROUND_Y - 50, 50, 15, 'wood'));
    
    structures.push(new Structure(p, baseX - 10, GROUND_Y - 70, 15, 30, 'wood'));
    structures.push(new Structure(p, baseX + 10, GROUND_Y - 70, 15, 30, 'wood'));
    structures.push(new Structure(p, baseX, GROUND_Y - 95, 40, 15, 'wood'));
    
    pigs.push(new Pig(p, baseX, GROUND_Y - 110));
    pigs.push(new Pig(p, baseX, GROUND_Y - 65));
  } else {
    // Complex structure with stone
    structures.push(new Structure(p, baseX - 30, GROUND_Y - 20, 15, 40, 'stone'));
    structures.push(new Structure(p, baseX + 30, GROUND_Y - 20, 15, 40, 'stone'));
    structures.push(new Structure(p, baseX, GROUND_Y - 50, 70, 15, 'wood'));
    
    structures.push(new Structure(p, baseX - 15, GROUND_Y - 70, 15, 30, 'wood'));
    structures.push(new Structure(p, baseX + 15, GROUND_Y - 70, 15, 30, 'wood'));
    structures.push(new Structure(p, baseX, GROUND_Y - 95, 40, 15, 'glass'));
    
    pigs.push(new Pig(p, baseX, GROUND_Y - 110));
    pigs.push(new Pig(p, baseX - 15, GROUND_Y - 65));
    pigs.push(new Pig(p, baseX + 15, GROUND_Y - 65));
  }
  
  return { pigs, structures };
}