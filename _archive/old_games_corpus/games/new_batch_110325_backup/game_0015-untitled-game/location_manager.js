// location_manager.js - Manages locations and scenes
import { gameState, STORY_DATA, CLUE_DATA } from './globals.js';
import { Hotspot, NPC } from './entities.js';

export class LocationManager {
  constructor() {
    this.locations = new Map();
    this.initializeLocations();
  }
  
  initializeLocations() {
    // Headquarters
    this.locations.set("headquarters", {
      name: "HQ - The Junkyard",
      hotspots: [
        new Hotspot("desk", 100, 150, 80, 60, "examine", { 
          text: "Your desk with case files and notes.",
          clue: null
        }),
        new Hotspot("map", 400, 100, 100, 80, "examine", { 
          text: "A map of Rocky Beach showing recent incidents.",
          clue: "schedule"
        }),
        new Hotspot("phone", 500, 200, 60, 50, "interact", { 
          text: "The phone rings... It's a tip about the park!"
        })
      ],
      npcs: [],
      background: [240, 230, 210]
    });
    
    // Park
    this.locations.set("park", {
      name: "Rocky Beach Park",
      hotspots: [
        new Hotspot("graffiti", 200, 120, 120, 100, "examine", { 
          text: "Troll graffiti in bright green paint.",
          clue: "graffiti_photo"
        }),
        new Hotspot("bench", 450, 200, 100, 60, "examine", { 
          text: "An old park bench with some scratches.",
          clue: null
        }),
        new Hotspot("trash_can", 350, 250, 50, 70, "pickup", { 
          text: "A crumpled note inside!",
          clue: "coded_message"
        })
      ],
      npcs: [
        new NPC("witness1", "Mr. Jenkins", 100, 250, [
          [
            "I saw someone here last night around 11 PM.",
            "They were carrying spray paint cans!",
            "Couldn't see their face, but they headed toward the docks."
          ],
          [
            "Hope you catch whoever's doing this!",
            "This park used to be so peaceful."
          ]
        ])
      ],
      background: [180, 220, 180]
    });
    
    // Library
    this.locations.set("library", {
      name: "Public Library",
      hotspots: [
        new Hotspot("computer", 150, 150, 80, 60, "examine", { 
          text: "Online news archives show similar incidents elsewhere.",
          clue: null
        }),
        new Hotspot("books", 350, 120, 100, 80, "examine", { 
          text: "Books on Norse mythology and trolls.",
          clue: null
        }),
        new Hotspot("newspaper", 500, 200, 70, 50, "pickup", { 
          text: "Recent article about the vandalism.",
          clue: "witness_testimony"
        })
      ],
      npcs: [
        new NPC("librarian", "Ms. Watson", 250, 280, [
          [
            "Yes, someone asked about Norse mythology recently.",
            "A young person, seemed very interested in troll legends.",
            "They checked out several books on the subject."
          ]
        ])
      ],
      background: [220, 210, 200]
    });
    
    // Warehouse
    this.locations.set("warehouse", {
      name: "Old Warehouse",
      hotspots: [
        new Hotspot("crate", 200, 180, 100, 80, "examine", { 
          text: "Empty crates, recently moved.",
          clue: null
        }),
        new Hotspot("paint_cans", 400, 150, 80, 90, "pickup", { 
          text: "Green spray paint - matches the graffiti!",
          clue: "paint_sample"
        }),
        new Hotspot("footprints", 300, 280, 120, 50, "examine", { 
          text: "Fresh footprints leading to the pier.",
          clue: null
        })
      ],
      npcs: [],
      background: [160, 160, 170]
    });
    
    // Pier
    this.locations.set("pier", {
      name: "Harbor Pier",
      hotspots: [
        new Hotspot("boat", 150, 200, 120, 80, "examine", { 
          text: "A small boat, recently used.",
          clue: null
        }),
        new Hotspot("rope", 350, 180, 80, 60, "pickup", { 
          text: "Rope with distinctive knot pattern.",
          clue: "rope_piece"
        }),
        new Hotspot("note", 480, 150, 60, 50, "pickup", { 
          text: "A receipt from an art supply store!",
          clue: "receipt"
        })
      ],
      npcs: [
        new NPC("witness2", "Dock Worker", 500, 280, [
          [
            "Yeah, I've seen someone around here at odd hours.",
            "They seemed to be working on some kind of art project.",
            "Left in a hurry when they saw me watching."
          ]
        ])
      ],
      background: [180, 200, 220]
    });
  }
  
  getLocation(locationId) {
    return this.locations.get(locationId);
  }
  
  getCurrentLocation() {
    return this.getLocation(gameState.currentLocation);
  }
  
  unlockLocation(locationId) {
    if (!gameState.unlockedLocations.includes(locationId)) {
      gameState.unlockedLocations.push(locationId);
    }
  }
}