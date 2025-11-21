// game_data.js - Game content and data

import { Location, Hotspot, Clue, Suspect, Puzzle, Decoration } from './entities.js';

export function createGameData() {
  const locations = [];
  const clues = [];
  const suspects = [];
  const puzzles = [];

  // Location 0: Crime Scene - Warehouse
  const warehouse = new Location(0, "Abandoned Warehouse", "The site of the latest heist", [40, 35, 50]);
  warehouse.addDecoration(new Decoration(100, 150, (p) => {
    // Crate
    p.fill(100, 70, 40);
    p.rect(0, 0, 80, 80);
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.line(0, 0, 80, 80);
    p.line(80, 0, 0, 80);
  }));
  warehouse.addDecoration(new Decoration(450, 250, (p) => {
    // Window
    p.fill(60, 80, 120);
    p.rect(0, 0, 60, 80);
    p.stroke(40);
    p.strokeWeight(3);
    p.line(30, 0, 30, 80);
    p.line(0, 40, 60, 40);
  }));
  warehouse.addHotspot(new Hotspot(150, 200, 60, 40, 'clue', 0, 0));
  warehouse.addHotspot(new Hotspot(400, 150, 60, 40, 'puzzle', 0, 0));
  warehouse.addHotspot(new Hotspot(520, 350, 60, 30, 'exit', null, 1));
  
  // Location 1: Suspect's Apartment
  const apartment = new Location(1, "Suspect's Apartment", "First suspect's residence", [60, 50, 70]);
  apartment.addDecoration(new Decoration(200, 100, (p) => {
    // Bookshelf
    p.fill(80, 60, 40);
    p.rect(0, 0, 100, 150);
    p.fill(40, 30, 20);
    for (let i = 0; i < 4; i++) {
      p.rect(5, 5 + i * 35, 90, 30);
    }
  }));
  apartment.addDecoration(new Decoration(450, 200, (p) => {
    // Table
    p.fill(100, 80, 60);
    p.rect(0, 0, 80, 60, 5);
    p.rect(5, 60, 10, 40);
    p.rect(65, 60, 10, 40);
  }));
  apartment.addHotspot(new Hotspot(100, 250, 60, 40, 'clue', 1, 1));
  apartment.addHotspot(new Hotspot(300, 200, 60, 80, 'suspect', 0, 1));
  apartment.addHotspot(new Hotspot(20, 350, 60, 30, 'exit', null, 0));
  apartment.addHotspot(new Hotspot(520, 350, 60, 30, 'exit', null, 2));
  
  // Location 2: Police Station
  const police = new Location(2, "Police Station", "Review evidence and files", [50, 60, 80]);
  police.addDecoration(new Decoration(150, 150, (p) => {
    // Desk
    p.fill(70, 50, 30);
    p.rect(0, 0, 120, 80, 3);
    p.fill(50, 40, 25);
    p.rect(10, 10, 100, 60);
    p.rect(10, 80, 15, 40);
    p.rect(95, 80, 15, 40);
  }));
  police.addDecoration(new Decoration(400, 100, (p) => {
    // Evidence board
    p.fill(200, 180, 150);
    p.rect(0, 0, 150, 100);
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.line(20, 20, 50, 60);
    p.line(50, 60, 100, 40);
    p.noStroke();
  }));
  police.addHotspot(new Hotspot(350, 250, 60, 40, 'clue', 2, 2));
  police.addHotspot(new Hotspot(150, 300, 60, 40, 'puzzle', 1, 2));
  police.addHotspot(new Hotspot(20, 350, 60, 30, 'exit', null, 1));
  police.addHotspot(new Hotspot(520, 350, 60, 30, 'exit', null, 3));
  
  // Location 3: Underground Hideout
  const hideout = new Location(3, "Underground Hideout", "Secret meeting place", [30, 40, 35]);
  hideout.addDecoration(new Decoration(250, 150, (p) => {
    // Computer terminal
    p.fill(40, 40, 50);
    p.rect(0, 0, 80, 60, 3);
    p.fill(0, 200, 100);
    p.rect(5, 5, 70, 50);
    p.fill(200);
    p.rect(35, 60, 10, 30);
    p.rect(10, 90, 60, 5);
  }));
  hideout.addDecoration(new Decoration(100, 250, (p) => {
    // Safe
    p.fill(60, 60, 70);
    p.rect(0, 0, 70, 90, 5);
    p.fill(30, 30, 40);
    p.circle(35, 45, 30);
    p.stroke(200);
    p.strokeWeight(2);
    p.line(35, 45, 50, 35);
    p.noStroke();
  }));
  hideout.addHotspot(new Hotspot(400, 200, 60, 40, 'clue', 3, 3));
  hideout.addHotspot(new Hotspot(250, 250, 60, 80, 'suspect', 1, 3));
  hideout.addHotspot(new Hotspot(20, 350, 60, 30, 'exit', null, 2));
  hideout.addHotspot(new Hotspot(520, 350, 60, 30, 'exit', null, 4));
  
  // Location 4: Final Location - Gang Headquarters
  const headquarters = new Location(4, "Gang Headquarters", "The Chameleon Gang's base", [60, 30, 40]);
  headquarters.addDecoration(new Decoration(300, 150, (p) => {
    // Large meeting table
    p.fill(80, 50, 30);
    p.ellipse(0, 0, 200, 100);
    p.fill(60, 40, 20);
    p.ellipse(0, 0, 180, 80);
  }));
  headquarters.addDecoration(new Decoration(100, 100, (p) => {
    // Chameleon symbol
    p.fill(100, 200, 100, 150);
    p.ellipse(0, 0, 40, 60);
    p.fill(80, 180, 80);
    p.ellipse(-5, 0, 30, 50);
    p.fill(0);
    p.circle(5, -10, 8);
  }));
  headquarters.addHotspot(new Hotspot(250, 250, 60, 40, 'clue', 4, 4));
  headquarters.addHotspot(new Hotspot(400, 250, 60, 80, 'suspect', 2, 4));
  headquarters.addHotspot(new Hotspot(150, 300, 60, 40, 'puzzle', 2, 4));
  headquarters.addHotspot(new Hotspot(20, 350, 60, 30, 'exit', null, 3));
  
  locations.push(warehouse, apartment, police, hideout, headquarters);

  // Clues
  clues.push(new Clue(0, "Torn Mask Piece", "A piece of green fabric from a mask", 0));
  clues.push(new Clue(1, "Suspicious Letter", "A letter mentioning 'the next job'", 1));
  clues.push(new Clue(2, "Fingerprint Report", "Matches found in database", 2));
  clues.push(new Clue(3, "Hidden Camera Footage", "Shows three figures in masks", 3));
  clues.push(new Clue(4, "Gang Roster", "List of gang members and roles", 4));

  // Suspects
  suspects.push(new Suspect(0, "Marcus Green", "Warehouse worker with a record", [
    { text: "I didn't see anything unusual...", next: 1 },
    { text: "Well, maybe I saw someone near the loading dock.", next: 2 },
    { text: "They were wearing something green.", next: -1 }
  ], 1));
  
  suspects.push(new Suspect(1, "Lisa Chrome", "Tech specialist, known associate", [
    { text: "I work alone, detective.", next: 1 },
    { text: "Fine, I know about the hideout.", next: 2 },
    { text: "But I'm not the leader you're looking for.", next: -1 }
  ], 3));
  
  suspects.push(new Suspect(2, "Victor Shade", "The gang's mastermind", [
    { text: "You found me. Impressive.", next: 1 },
    { text: "The Chameleon Gang was my creation.", next: 2 },
    { text: "But you'll never prove it all!", next: -1 }
  ], 4));

  // Puzzles
  puzzles.push(new Puzzle(0, "code", [3, 7, 2, 9], 0)); // Code puzzle at warehouse
  puzzles.push(new Puzzle(1, "document", [2, 0, 3, 1], 2)); // Document assembly at police station
  puzzles.push(new Puzzle(2, "fingerprint", [1, 3, 0, 2], 4)); // Fingerprint matching at headquarters

  return { locations, clues, suspects, puzzles };
}