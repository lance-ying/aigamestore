// scenes.js
export const SCENES = {
  beach: {
    name: "Beach",
    description: "You stand on a sandy beach. Waves crash nearby.",
    connections: {
      UP: "forest",
      RIGHT: "cave"
    },
    objects: [
      { id: "rope", name: "Rope", x: 150, y: 250, w: 40, h: 15, collectible: true },
      { id: "stick", name: "Stick", x: 400, y: 280, w: 50, h: 10, collectible: true }
    ],
    interactables: []
  },
  forest: {
    name: "Forest Path",
    description: "Dense trees surround you. A path leads deeper into the forest.",
    connections: {
      DOWN: "beach",
      UP: "clearing"
    },
    objects: [
      { id: "mushroom", name: "Mushroom", x: 250, y: 220, w: 25, h: 25, collectible: true }
    ],
    interactables: []
  },
  cave: {
    name: "Dark Cave",
    description: "A damp cave entrance. You can barely see inside.",
    connections: {
      LEFT: "beach",
      UP: "caveDeep"
    },
    objects: [],
    interactables: [
      { id: "rockPile", name: "Rock Pile", x: 300, y: 200, w: 80, h: 60, requiresItem: "stick" }
    ]
  },
  caveDeep: {
    name: "Deep Cave",
    description: "Deeper in the cave. Strange markings on the wall.",
    connections: {
      DOWN: "cave"
    },
    objects: [],
    interactables: [
      { id: "codePanel", name: "Code Panel", x: 300, y: 180, w: 100, h: 80, type: "puzzle" }
    ],
    requiresUnlock: false
  },
  clearing: {
    name: "Forest Clearing",
    description: "A peaceful clearing with sunlight streaming through.",
    connections: {
      DOWN: "forest",
      RIGHT: "ruins"
    },
    objects: [
      { id: "flower", name: "Blue Flower", x: 200, y: 240, w: 20, h: 20, collectible: true }
    ],
    interactables: []
  },
  ruins: {
    name: "Ancient Ruins",
    description: "Old stone structures covered in vines.",
    connections: {
      LEFT: "clearing",
      UP: "tower"
    },
    objects: [],
    interactables: [
      { id: "door", name: "Locked Door", x: 350, y: 150, w: 60, h: 100, requiresItem: "key" }
    ]
  },
  tower: {
    name: "Stone Tower",
    description: "Inside an ancient tower. A lever mechanism is here.",
    connections: {
      DOWN: "ruins"
    },
    objects: [],
    interactables: [
      { id: "lever", name: "Lever", x: 280, y: 200, w: 40, h: 60, type: "switch" }
    ],
    requiresUnlock: true
  },
  bridge: {
    name: "Broken Bridge",
    description: "A bridge spans a chasm, but it's damaged.",
    connections: {
      LEFT: "ruins",
      RIGHT: "dock"
    },
    objects: [],
    interactables: [
      { id: "bridgeGap", name: "Bridge Gap", x: 300, y: 250, w: 100, h: 20, requiresItem: "rope-stick" }
    ],
    requiresUnlock: true
  },
  dock: {
    name: "Old Dock",
    description: "A weathered dock with a boat tied up.",
    connections: {
      LEFT: "bridge"
    },
    objects: [],
    interactables: [
      { id: "boat", name: "Damaged Boat", x: 350, y: 250, w: 120, h: 80, type: "final" }
    ],
    requiresUnlock: true
  }
};

export function getScene(sceneName) {
  return SCENES[sceneName] || SCENES.beach;
}

export function getAvailableDirections(sceneName, gameState) {
  const scene = getScene(sceneName);
  const directions = [];
  
  for (const [dir, targetScene] of Object.entries(scene.connections || {})) {
    const target = SCENES[targetScene];
    if (!target.requiresUnlock || gameState.unlockedAreas.includes(targetScene)) {
      directions.push(dir);
    }
  }
  
  return directions;
}