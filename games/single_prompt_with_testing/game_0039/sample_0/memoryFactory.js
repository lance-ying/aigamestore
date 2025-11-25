// memoryFactory.js - Creates different memory scenes
import { Memory, MEMORY_TYPES } from './memory.js';
import { CANVAS_WIDTH } from './globals.js';

export function createMemories(p) {
  const memories = [];

  // Memory 1: Childhood Home
  const childhood = new Memory(
    p,
    MEMORY_TYPES.CHILDHOOD,
    "Your Childhood Home - Where it all began",
    [135, 206, 235]
  );
  childhood.addFragment(150, 250);
  childhood.addFragment(450, 280);
  childhood.addFragment(300, 200);
  childhood.addObject(400, 240, 80, 80, 'house');
  childhood.addObject(100, 250, 60, 60, 'tree');
  childhood.addObject(250, 280, 80, 40, 'swing');
  childhood.addBackgroundElement(100, 80, 'cloud');
  childhood.addBackgroundElement(300, 60, 'cloud');
  childhood.addBackgroundElement(500, 90, 'cloud');
  memories.push(childhood);

  // Memory 2: First Day of School
  const school = new Memory(
    p,
    MEMORY_TYPES.CHILDHOOD,
    "First Day of School - New adventures await",
    [255, 218, 185]
  );
  school.addFragment(200, 260);
  school.addFragment(400, 240);
  school.addObject(500, 250, 70, 70, 'house');
  school.addObject(150, 270, 60, 50, 'bench');
  school.addBackgroundElement(150, 70, 'cloud');
  school.addBackgroundElement(450, 85, 'cloud');
  memories.push(school);

  // Memory 3: Meeting Your First Love
  const firstLove = new Memory(
    p,
    MEMORY_TYPES.FIRST_LOVE,
    "The Day We Met - A moment frozen in time",
    [255, 182, 193]
  );
  firstLove.addFragment(180, 270);
  firstLove.addFragment(320, 250);
  firstLove.addFragment(460, 280);
  firstLove.addObject(300, 280, 60, 50, 'bench');
  firstLove.addObject(120, 260, 60, 60, 'tree');
  firstLove.addBackgroundElement(100, 60, 'heart');
  firstLove.addBackgroundElement(250, 80, 'heart');
  firstLove.addBackgroundElement(400, 70, 'heart');
  firstLove.addBackgroundElement(500, 90, 'heart');
  memories.push(firstLove);

  // Memory 4: First Kiss
  const kiss = new Memory(
    p,
    MEMORY_TYPES.FIRST_LOVE,
    "Our First Kiss - Hearts intertwined",
    [255, 218, 224]
  );
  kiss.addFragment(250, 240);
  kiss.addFragment(350, 270);
  kiss.addObject(450, 260, 60, 60, 'tree');
  kiss.addBackgroundElement(150, 65, 'heart');
  kiss.addBackgroundElement(300, 75, 'heart');
  kiss.addBackgroundElement(450, 60, 'heart');
  memories.push(kiss);

  // Memory 5: Discovering Your Art
  const art1 = new Memory(
    p,
    MEMORY_TYPES.ARTISTIC,
    "The First Brushstroke - Finding your voice",
    [147, 112, 219]
  );
  art1.addFragment(150, 260);
  art1.addFragment(350, 240);
  art1.addFragment(500, 270);
  art1.addObject(280, 220, 70, 90, 'easel');
  art1.addBackgroundElement(100, 80, 'star');
  art1.addBackgroundElement(200, 60, 'star');
  art1.addBackgroundElement(350, 70, 'star');
  art1.addBackgroundElement(500, 65, 'star');
  memories.push(art1);

  // Memory 6: Your First Exhibition
  const art2 = new Memory(
    p,
    MEMORY_TYPES.ARTISTIC,
    "Opening Night - Dreams becoming reality",
    [186, 85, 211]
  );
  art2.addFragment(200, 250);
  art2.addFragment(400, 260);
  art2.addObject(150, 240, 60, 80, 'easel');
  art2.addObject(450, 250, 60, 80, 'easel');
  art2.addBackgroundElement(100, 75, 'star');
  art2.addBackgroundElement(300, 65, 'star');
  art2.addBackgroundElement(500, 80, 'star');
  memories.push(art2);

  // Memory 7: The Breakup
  const regret1 = new Memory(
    p,
    MEMORY_TYPES.REGRET,
    "The Day We Said Goodbye - Words left unspoken",
    [70, 70, 90]
  );
  regret1.addFragment(220, 270);
  regret1.addFragment(380, 250);
  regret1.addObject(300, 280, 60, 50, 'bench');
  regret1.addBackgroundElement(100, 50, 'rain');
  regret1.addBackgroundElement(200, 80, 'rain');
  regret1.addBackgroundElement(300, 60, 'rain');
  regret1.addBackgroundElement(400, 90, 'rain');
  regret1.addBackgroundElement(500, 70, 'rain');
  memories.push(regret1);

  // Memory 8: Lost Opportunities
  const regret2 = new Memory(
    p,
    MEMORY_TYPES.REGRET,
    "Paths Not Taken - The weight of what could have been",
    [50, 50, 70]
  );
  regret2.addFragment(180, 260);
  regret2.addFragment(420, 275);
  regret2.addBackgroundElement(150, 60, 'rain');
  regret2.addBackgroundElement(250, 85, 'rain');
  regret2.addBackgroundElement(350, 70, 'rain');
  regret2.addBackgroundElement(450, 55, 'rain');
  memories.push(regret2);

  // Memory 9: Acceptance
  const peace1 = new Memory(
    p,
    MEMORY_TYPES.PEACE,
    "Understanding - The journey was worth it",
    [240, 248, 255]
  );
  peace1.addFragment(250, 250);
  peace1.addFragment(350, 270);
  peace1.addBackgroundElement(100, 70, 'cloud');
  peace1.addBackgroundElement(400, 60, 'cloud');
  memories.push(peace1);

  // Memory 10: Final Journey
  const peace2 = new Memory(
    p,
    MEMORY_TYPES.PEACE,
    "The Door to Peace - Your story complete",
    [230, 230, 250]
  );
  peace2.addFragment(200, 260);
  peace2.addFragment(400, 270);
  peace2.addObject(CANVAS_WIDTH/2 - 30, 240, 60, 90, 'door');
  peace2.addBackgroundElement(150, 65, 'cloud');
  peace2.addBackgroundElement(450, 75, 'cloud');
  memories.push(peace2);

  return memories;
}