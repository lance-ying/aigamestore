import { Scene, Hotspot, InventoryItem } from './scene.js';
import { gameState, STORY_FLAGS, ACTION_TYPES } from './globals.js';

// Inventory items
export const ITEMS = {
  WRENCH: new InventoryItem("wrench", "Wrench", "A sturdy wrench", (p, x, y, s) => {
    p.push();
    p.fill(150, 150, 150);
    p.rect(x - s/4, y - s/3, s/2, s/6);
    p.ellipse(x - s/4, y, s/3, s/3);
    p.pop();
  }),
  KEY: new InventoryItem("key", "Key", "An old rusty key", (p, x, y, s) => {
    p.push();
    p.fill(180, 140, 80);
    p.rect(x - s/2, y - s/8, s/2, s/4);
    p.ellipse(x + s/8, y, s/4, s/4);
    p.pop();
  }),
  PHOTO: new InventoryItem("photo", "Photo", "A suspicious photo", (p, x, y, s) => {
    p.push();
    p.fill(255, 255, 200);
    p.rect(x - s/2, y - s/2, s, s * 0.7);
    p.fill(100);
    p.rect(x - s/3, y - s/3, s * 0.6, s * 0.4);
    p.pop();
  }),
  DOCUMENT: new InventoryItem("document", "Document", "Important evidence", (p, x, y, s) => {
    p.push();
    p.fill(255);
    p.rect(x - s/2, y - s/2, s, s * 0.8);
    p.fill(0);
    for (let i = 0; i < 3; i++) {
      p.rect(x - s/3, y - s/3 + i * s/4, s * 0.6, s/20);
    }
    p.pop();
  }),
  EVIDENCE: new InventoryItem("evidence", "Combined Evidence", "Photo and document together", (p, x, y, s) => {
    p.push();
    p.fill(255, 200, 100);
    p.rect(x - s/2, y - s/2, s, s);
    p.fill(200, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(s/2);
    p.text("!", x, y);
    p.pop();
  })
};

ITEMS.PHOTO.combinable = ["document"];
ITEMS.DOCUMENT.combinable = ["photo"];

export function createScenes(p) {
  const scenes = [];

  // Scene 0: Garage (Starting location)
  const garage = new Scene(0, "Garage", "A dimly lit garage with your motorcycle", [60, 60, 80]);
  garage.renderSceneElements = (p) => {
    // Floor
    p.fill(40, 40, 50);
    p.rect(0, 300, 600, 100);
    
    // Motorcycle
    p.push();
    p.fill(80, 80, 100);
    p.ellipse(200, 320, 60, 60);
    p.ellipse(280, 320, 60, 60);
    p.fill(100, 100, 120);
    p.rect(180, 270, 120, 50, 10);
    p.fill(150, 50, 50);
    p.rect(240, 250, 40, 30);
    p.pop();

    // Workbench
    p.fill(100, 80, 60);
    p.rect(450, 250, 120, 20);
    p.rect(460, 270, 10, 80);
    p.rect(550, 270, 10, 80);
  };

  garage.addHotspot(new Hotspot(160, 240, 160, 120, "Motorcycle", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.USE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "Your trusty bike. Needs some work before it's road-worthy.";
      } else if (action === ACTION_TYPES.USE) {
        if (state.selectedItem && state.selectedItem.id === "wrench" && !state.storyFlags[STORY_FLAGS.FIXED_BIKE]) {
          state.storyFlags[STORY_FLAGS.FIXED_BIKE] = true;
          state.puzzlesSolved++;
          state.score += 100;
          return "You fixed the bike! Now you can ride.";
        } else if (state.storyFlags[STORY_FLAGS.FIXED_BIKE]) {
          return "The bike is ready to go!";
        }
        return "You need the right tool to fix this.";
      }
    }
  ));

  garage.addHotspot(new Hotspot(450, 240, 120, 80, "Workbench", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TAKE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "A cluttered workbench with tools scattered around.";
      } else if (action === ACTION_TYPES.TAKE) {
        if (!state.storyFlags[STORY_FLAGS.GOT_WRENCH]) {
          state.storyFlags[STORY_FLAGS.GOT_WRENCH] = true;
          state.inventory.push(ITEMS.WRENCH);
          state.score += 50;
          return "You picked up a wrench!";
        }
        return "Nothing else useful here.";
      }
    }
  ));

  garage.addConnection("right", 1);
  scenes.push(garage);

  // Scene 1: Street
  const street = new Scene(1, "Street", "A quiet street outside the garage", [100, 120, 140]);
  street.renderSceneElements = (p) => {
    // Sky
    p.fill(80, 100, 120);
    p.rect(0, 50, 600, 150);
    
    // Buildings
    p.fill(70, 70, 80);
    p.rect(50, 120, 150, 180);
    p.rect(400, 100, 150, 200);
    
    // Windows
    p.fill(200, 200, 150, 100);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        p.rect(70 + j * 50, 140 + i * 50, 30, 40);
      }
    }
    
    // Road
    p.fill(50, 50, 60);
    p.rect(0, 300, 600, 100);
    
    // Road markings
    p.stroke(200, 200, 0);
    p.strokeWeight(3);
    for (let i = 0; i < 6; i++) {
      p.line(i * 120 + 20, 350, i * 120 + 80, 350);
    }
    p.noStroke();
  };

  street.addHotspot(new Hotspot(50, 120, 150, 180, "Building", 
    [ACTION_TYPES.LOOK], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "An old apartment building. The door is locked.";
      }
    }
  ));

  street.addConnection("left", 0);
  street.addConnection("right", 2);
  scenes.push(street);

  // Scene 2: Bar Entrance
  const barEntrance = new Scene(2, "Bar Entrance", "Outside a seedy bar", [80, 70, 90]);
  barEntrance.renderSceneElements = (p) => {
    // Sky
    p.fill(60, 70, 90);
    p.rect(0, 50, 600, 150);
    
    // Bar building
    p.fill(90, 50, 50);
    p.rect(150, 100, 300, 200);
    
    // Door
    p.fill(50, 30, 30);
    p.rect(270, 180, 80, 120);
    p.fill(100, 80, 60);
    p.ellipse(340, 240, 10, 10);
    
    // Sign
    p.fill(200, 50, 50);
    p.rect(200, 120, 200, 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("THE BAR", 300, 140);
    
    // Ground
    p.fill(60, 60, 70);
    p.rect(0, 300, 600, 100);
  };

  barEntrance.addHotspot(new Hotspot(270, 180, 80, 120, "Door", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.USE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "The door to the bar. Looks locked.";
      } else if (action === ACTION_TYPES.USE) {
        if (state.selectedItem && state.selectedItem.id === "key" && !state.storyFlags[STORY_FLAGS.OPENED_DOOR]) {
          state.storyFlags[STORY_FLAGS.OPENED_DOOR] = true;
          state.puzzlesSolved++;
          state.score += 150;
          return "You unlocked the door!";
        } else if (state.storyFlags[STORY_FLAGS.OPENED_DOOR]) {
          state.currentScene = 3;
          return "You enter the bar.";
        }
        return "It's locked. You need a key.";
      }
    }
  ));

  barEntrance.addConnection("left", 1);
  scenes.push(barEntrance);

  // Scene 3: Inside Bar
  const bar = new Scene(3, "Bar", "Inside a dimly lit bar", [50, 40, 60]);
  bar.renderSceneElements = (p) => {
    // Walls
    p.fill(60, 50, 70);
    p.rect(0, 50, 600, 250);
    
    // Bar counter
    p.fill(80, 60, 40);
    p.rect(100, 220, 400, 30);
    p.rect(110, 250, 10, 100);
    p.rect(480, 250, 10, 100);
    
    // Bartender
    p.fill(120, 100, 80);
    p.ellipse(300, 180, 40, 40);
    p.fill(60, 60, 80);
    p.rect(280, 200, 40, 60);
    
    // Bottles
    p.fill(100, 150, 100, 150);
    p.rect(150, 190, 15, 30);
    p.rect(180, 195, 15, 25);
    p.rect(210, 192, 15, 28);
    
    // Table
    p.fill(70, 50, 30);
    p.ellipse(450, 280, 80, 50);
    
    // Floor
    p.fill(40, 35, 45);
    p.rect(0, 300, 600, 100);
  };

  bar.addHotspot(new Hotspot(260, 140, 80, 120, "Bartender", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TALK], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "A gruff-looking bartender. Might know something.";
      } else if (action === ACTION_TYPES.TALK) {
        if (!state.storyFlags[STORY_FLAGS.TALKED_TO_MECHANIC]) {
          state.dialogueActive = true;
          state.dialogueOptions = [
            { text: "I need information about the gang.", flag: STORY_FLAGS.TALKED_TO_MECHANIC },
            { text: "Just passing through.", flag: null }
          ];
          return null;
        }
        return "I told you everything I know.";
      }
    }
  ));

  bar.addHotspot(new Hotspot(410, 240, 80, 80, "Table", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TAKE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "A small table with something on it.";
      } else if (action === ACTION_TYPES.TAKE) {
        if (!state.storyFlags[STORY_FLAGS.FOUND_CLUE] && state.storyFlags[STORY_FLAGS.TALKED_TO_MECHANIC]) {
          state.storyFlags[STORY_FLAGS.FOUND_CLUE] = true;
          state.inventory.push(ITEMS.PHOTO);
          state.puzzlesSolved++;
          state.score += 100;
          return "You found a suspicious photo!";
        }
        return "Nothing here.";
      }
    }
  ));

  bar.addConnection("down", 2);
  scenes.push(bar);

  // Scene 4: Alley (accessed from street scene 1)
  const alley = new Scene(4, "Alley", "A dark alley behind the buildings", [40, 40, 50]);
  alley.renderSceneElements = (p) => {
    // Walls
    p.fill(50, 50, 60);
    p.rect(0, 50, 200, 250);
    p.rect(400, 50, 200, 250);
    
    // Ground
    p.fill(35, 35, 45);
    p.rect(0, 300, 600, 100);
    
    // Dumpster
    p.fill(60, 80, 60);
    p.rect(120, 250, 100, 80);
    p.fill(50, 70, 50);
    p.rect(125, 255, 90, 70);
    
    // Crates
    p.fill(80, 60, 40);
    p.rect(450, 270, 60, 60);
    p.rect(455, 275, 50, 50);
    
    // Fire escape
    p.stroke(100, 100, 110);
    p.strokeWeight(3);
    p.line(500, 100, 500, 300);
    for (let i = 0; i < 3; i++) {
      p.line(480, 150 + i * 60, 520, 150 + i * 60);
    }
    p.noStroke();
  };

  alley.addHotspot(new Hotspot(120, 250, 100, 80, "Dumpster", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TAKE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "A rusty dumpster. Smells terrible.";
      } else if (action === ACTION_TYPES.TAKE) {
        if (!state.storyFlags[STORY_FLAGS.GOT_KEY]) {
          state.storyFlags[STORY_FLAGS.GOT_KEY] = true;
          state.inventory.push(ITEMS.KEY);
          state.score += 75;
          return "You found a key in the trash!";
        }
        return "Nothing else in there.";
      }
    }
  ));

  alley.addConnection("up", 1);
  scenes.push(alley);

  // Add alley connection to street
  scenes[1].addConnection("down", 4);

  // Scene 5: Boss Room (final scene)
  const bossRoom = new Scene(5, "Boss Office", "A luxurious office", [70, 60, 80]);
  bossRoom.renderSceneElements = (p) => {
    // Walls
    p.fill(80, 70, 90);
    p.rect(0, 50, 600, 250);
    
    // Desk
    p.fill(60, 40, 30);
    p.rect(200, 200, 200, 30);
    p.rect(210, 230, 10, 70);
    p.rect(380, 230, 10, 70);
    
    // Boss
    p.fill(140, 120, 100);
    p.ellipse(300, 160, 50, 50);
    p.fill(40, 40, 50);
    p.rect(275, 180, 50, 70);
    
    // Painting
    p.fill(100, 80, 60);
    p.rect(50, 80, 120, 100);
    p.fill(150, 100, 80);
    p.rect(60, 90, 100, 80);
    
    // Bookshelf
    p.fill(70, 50, 40);
    p.rect(450, 100, 100, 150);
    for (let i = 0; i < 4; i++) {
      p.fill(random_color(p, i));
      p.rect(455, 105 + i * 35, 20, 30);
      p.rect(480, 105 + i * 35, 20, 30);
    }
    
    // Floor
    p.fill(50, 45, 55);
    p.rect(0, 300, 600, 100);
  };

  bossRoom.addHotspot(new Hotspot(50, 80, 120, 100, "Painting", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TAKE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "An expensive painting. Something's hidden behind it.";
      } else if (action === ACTION_TYPES.TAKE) {
        if (!state.storyFlags[STORY_FLAGS.GOT_EVIDENCE]) {
          state.storyFlags[STORY_FLAGS.GOT_EVIDENCE] = true;
          state.inventory.push(ITEMS.DOCUMENT);
          state.score += 150;
          return "You found important documents!";
        }
        return "Nothing else there.";
      }
    }
  ));

  bossRoom.addHotspot(new Hotspot(250, 120, 100, 150, "Boss", 
    [ACTION_TYPES.LOOK, ACTION_TYPES.TALK, ACTION_TYPES.USE], 
    (action, state) => {
      if (action === ACTION_TYPES.LOOK) {
        return "The gang's leader. Time to confront them.";
      } else if (action === ACTION_TYPES.TALK) {
        if (!state.storyFlags[STORY_FLAGS.TALKED_TO_BOSS]) {
          state.dialogueActive = true;
          state.dialogueOptions = [
            { text: "I know what you did!", flag: STORY_FLAGS.TALKED_TO_BOSS },
            { text: "We need to talk.", flag: null }
          ];
          return null;
        }
        return "Show me the proof!";
      } else if (action === ACTION_TYPES.USE) {
        if (state.selectedItem && state.selectedItem.id === "evidence" && !state.storyFlags[STORY_FLAGS.FINAL_CONFRONTATION]) {
          state.storyFlags[STORY_FLAGS.FINAL_CONFRONTATION] = true;
          state.puzzlesSolved++;
          state.score += 300;
          state.gamePhase = "GAME_OVER_WIN";
          return "You exposed the conspiracy! Case closed!";
        } else if (!state.storyFlags[STORY_FLAGS.TALKED_TO_BOSS]) {
          return "Better talk to them first.";
        } else if (!state.selectedItem || state.selectedItem.id !== "evidence") {
          return "You need proof to confront them!";
        }
        return "The evidence speaks for itself.";
      }
    }
  ));

  bossRoom.addConnection("down", 3);
  scenes.push(bossRoom);

  // Add connection from bar to boss room (after talking to bartender)
  scenes[3].addConnection("up", 5);

  return scenes;
}

function random_color(p, seed) {
  const colors = [
    [150, 100, 80],
    [100, 150, 120],
    [120, 100, 150],
    [150, 120, 100]
  ];
  return colors[seed % colors.length];
}