import { InteractiveObject } from './interactiveObject.js';

export function createScenesForYear(year, p) {
  const scenes = [];
  
  if (year === 1) {
    scenes.push({
      name: "Great Hall",
      objects: [
        new InteractiveObject(150, 200, 2, 'book', year),
        new InteractiveObject(300, 180, 2, 'wand', year),
        new InteractiveObject(450, 220, 3, 'potion', year)
      ]
    });
    scenes.push({
      name: "Charms Classroom",
      objects: [
        new InteractiveObject(200, 150, 3, 'wand', year),
        new InteractiveObject(400, 170, 2, 'book', year),
        new InteractiveObject(500, 200, 3, 'other', year)
      ]
    });
    scenes.push({
      name: "Potions Classroom",
      objects: [
        new InteractiveObject(180, 190, 3, 'potion', year),
        new InteractiveObject(320, 210, 2, 'potion', year),
        new InteractiveObject(460, 180, 3, 'book', year),
        new InteractiveObject(250, 150, 2, 'other', year)
      ]
    });
  } else if (year === 2) {
    scenes.push({
      name: "Library",
      objects: [
        new InteractiveObject(140, 180, 3, 'book', year),
        new InteractiveObject(280, 200, 4, 'book', year),
        new InteractiveObject(420, 170, 3, 'book', year),
        new InteractiveObject(500, 210, 3, 'other', year)
      ]
    });
    scenes.push({
      name: "Corridor",
      objects: [
        new InteractiveObject(200, 190, 4, 'wand', year),
        new InteractiveObject(350, 180, 3, 'other', year),
        new InteractiveObject(480, 200, 4, 'other', year)
      ]
    });
    scenes.push({
      name: "Courtyard",
      objects: [
        new InteractiveObject(170, 160, 4, 'wand', year),
        new InteractiveObject(300, 190, 3, 'other', year),
        new InteractiveObject(430, 175, 4, 'potion', year),
        new InteractiveObject(520, 200, 3, 'other', year)
      ]
    });
  } else if (year === 3) {
    scenes.push({
      name: "Defense Against Dark Arts",
      objects: [
        new InteractiveObject(160, 170, 5, 'wand', year),
        new InteractiveObject(300, 190, 4, 'book', year),
        new InteractiveObject(440, 180, 5, 'wand', year),
        new InteractiveObject(520, 200, 4, 'other', year)
      ]
    });
    scenes.push({
      name: "Forbidden Corridor",
      objects: [
        new InteractiveObject(180, 180, 5, 'other', year),
        new InteractiveObject(320, 200, 5, 'other', year),
        new InteractiveObject(460, 170, 6, 'other', year)
      ]
    });
    scenes.push({
      name: "Vault Entrance",
      objects: [
        new InteractiveObject(200, 190, 6, 'wand', year),
        new InteractiveObject(350, 180, 5, 'other', year),
        new InteractiveObject(480, 200, 6, 'book', year),
        new InteractiveObject(400, 220, 5, 'potion', year)
      ]
    });
  } else if (year === 4) {
    scenes.push({
      name: "Advanced Potions",
      objects: [
        new InteractiveObject(150, 170, 6, 'potion', year),
        new InteractiveObject(280, 190, 6, 'potion', year),
        new InteractiveObject(410, 180, 7, 'book', year),
        new InteractiveObject(520, 200, 6, 'other', year)
      ]
    });
    scenes.push({
      name: "Secret Passage",
      objects: [
        new InteractiveObject(170, 180, 7, 'other', year),
        new InteractiveObject(310, 200, 7, 'wand', year),
        new InteractiveObject(450, 170, 7, 'other', year),
        new InteractiveObject(540, 210, 6, 'other', year)
      ]
    });
    scenes.push({
      name: "Cursed Vault Chamber",
      objects: [
        new InteractiveObject(190, 190, 7, 'other', year),
        new InteractiveObject(330, 180, 7, 'book', year),
        new InteractiveObject(470, 200, 8, 'wand', year),
        new InteractiveObject(250, 220, 7, 'potion', year),
        new InteractiveObject(420, 220, 7, 'other', year)
      ]
    });
  } else if (year === 5) {
    scenes.push({
      name: "Ancient Runes Study",
      objects: [
        new InteractiveObject(160, 170, 8, 'book', year),
        new InteractiveObject(290, 190, 8, 'book', year),
        new InteractiveObject(420, 180, 8, 'other', year),
        new InteractiveObject(530, 200, 7, 'wand', year)
      ]
    });
    scenes.push({
      name: "Vault Antechamber",
      objects: [
        new InteractiveObject(180, 180, 8, 'other', year),
        new InteractiveObject(310, 200, 8, 'wand', year),
        new InteractiveObject(440, 170, 9, 'other', year),
        new InteractiveObject(540, 210, 8, 'potion', year),
        new InteractiveObject(370, 220, 8, 'book', year)
      ]
    });
    scenes.push({
      name: "Final Vault",
      objects: [
        new InteractiveObject(200, 190, 9, 'other', year),
        new InteractiveObject(330, 180, 9, 'wand', year),
        new InteractiveObject(460, 200, 10, 'other', year),
        new InteractiveObject(270, 220, 9, 'book', year),
        new InteractiveObject(490, 220, 9, 'potion', year),
        new InteractiveObject(380, 150, 10, 'other', year)
      ]
    });
  }
  
  return scenes;
}