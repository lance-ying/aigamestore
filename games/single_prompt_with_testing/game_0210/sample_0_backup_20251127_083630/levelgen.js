// Level generation and room management
import { gameState, ROOM_WIDTH, ROOM_HEIGHT, TILE_SIZE } from './globals.js';
import { Platform, Spike, Checkpoint, CrewMember, MovingPlatform } from './entities.js';

// Room templates
const roomTemplates = {
  start: {
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 } // Floor
    ],
    spikes: [],
    checkpoints: [{ x: 50, y: 340 }],
    crew: []
  },
  
  corridor: {
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 200, y: 360, width: 100, height: 20, direction: 'up' },
      { x: 400, y: 20, width: 100, height: 20, direction: 'down' }
    ],
    checkpoints: [],
    crew: []
  },
  
  zigzag: {
    platforms: [
      { x: 0, y: 380, width: 200, height: 20 },
      { x: 200, y: 280, width: 200, height: 20 },
      { x: 400, y: 180, width: 200, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 0, y: 360, width: 200, height: 20, direction: 'up' },
      { x: 200, y: 260, width: 200, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 450, y: 140 }],
    crew: []
  },
  
  gap: {
    platforms: [
      { x: 0, y: 380, width: 150, height: 20 },
      { x: 450, y: 380, width: 150, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 150, y: 360, width: 300, height: 20, direction: 'up' }
    ],
    checkpoints: [],
    crew: []
  },
  
  moving: {
    platforms: [
      { x: 0, y: 380, width: 100, height: 20 },
      { x: 500, y: 380, width: 100, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    movingPlatforms: [
      { x: 150, y: 300, width: 100, height: 10, startX: 150, endX: 350, startY: 300, endY: 300, speed: 0.02 }
    ],
    spikes: [
      { x: 100, y: 360, width: 400, height: 20, direction: 'up' }
    ],
    checkpoints: [{ x: 530, y: 340 }],
    crew: []
  },
  
  spikeTunnel: {
    platforms: [
      { x: 0, y: 380, width: 600, height: 20 },
      { x: 0, y: 0, width: 600, height: 20 }
    ],
    spikes: [
      { x: 150, y: 360, width: 50, height: 20, direction: 'up' },
      { x: 250, y: 20, width: 50, height: 20, direction: 'down' },
      { x: 350, y: 360, width: 50, height: 20, direction: 'up' },
      { x: 450, y: 20, width: 50, height: 20, direction: 'down' }
    ],
    checkpoints: [{ x: 550, y: 340 }],
    crew: []
  }
};

// Level layout (room coordinates to room types)
const levelLayout = {
  '0,0': { type: 'start', crew: null },
  '1,0': { type: 'corridor', crew: null },
  '2,0': { type: 'zigzag', crew: 'Violet' },
  '2,1': { type: 'gap', crew: null },
  '1,1': { type: 'moving', crew: 'Vermillion' },
  '0,1': { type: 'spikeTunnel', crew: null },
  '0,2': { type: 'zigzag', crew: 'Vitellary' },
  '1,2': { type: 'corridor', crew: null },
  '2,2': { type: 'gap', crew: 'Victoria' },
  '2,3': { type: 'moving', crew: null },
  '1,3': { type: 'spikeTunnel', crew: 'Verdigris' },
  '0,3': { type: 'corridor', crew: 'Vermillion' } // Note: Duplicate crew name for variety
};

export function generateLevel() {
  // Clear existing level
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.checkpoints = [];
  gameState.crewMembers = [];
  gameState.rooms.clear();
  
  // Generate all rooms in the layout
  for (const [coords, roomData] of Object.entries(levelLayout)) {
    const [x, y] = coords.split(',').map(Number);
    generateRoom(x, y, roomData.type, roomData.crew);
  }
  
  // Set initial room
  gameState.currentRoom.x = 0;
  gameState.currentRoom.y = 0;
}

function generateRoom(roomX, roomY, templateName, crewName) {
  const key = `${roomX},${roomY}`;
  
  // Get template
  const template = roomTemplates[templateName];
  if (!template) return;
  
  const room = {
    x: roomX,
    y: roomY,
    type: templateName,
    platforms: [],
    spikes: [],
    checkpoints: [],
    crew: null,
    movingPlatforms: []
  };
  
  // Create platforms
  for (const p of template.platforms) {
    const platform = new Platform(p.x, p.y, p.width, p.height);
    room.platforms.push(platform);
  }
  
  // Create moving platforms
  if (template.movingPlatforms) {
    for (const mp of template.movingPlatforms) {
      const movingPlatform = new MovingPlatform(
        mp.x, mp.y, mp.width, mp.height,
        mp.startX, mp.endX, mp.startY, mp.endY, mp.speed
      );
      room.movingPlatforms.push(movingPlatform);
    }
  }
  
  // Create spikes
  for (const s of template.spikes) {
    const spike = new Spike(s.x, s.y, s.width, s.height, s.direction);
    room.spikes.push(spike);
  }
  
  // Create checkpoints
  for (const c of template.checkpoints) {
    const checkpoint = new Checkpoint(c.x, c.y);
    room.checkpoints.push(checkpoint);
  }
  
  // Create crew member
  if (crewName) {
    const crewX = 300;
    const crewY = 200;
    const crew = new CrewMember(crewX, crewY, crewName);
    room.crew = crew;
  }
  
  gameState.rooms.set(key, room);
}

export function loadRoom(roomX, roomY) {
  const key = `${roomX},${roomY}`;
  const room = gameState.rooms.get(key);
  
  if (!room) {
    // Generate empty room if it doesn't exist
    generateRoom(roomX, roomY, 'corridor', null);
    return loadRoom(roomX, roomY);
  }
  
  // Clear current entities
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.checkpoints = [];
  
  // Load room entities
  gameState.platforms = room.platforms.filter(p => p.type !== 'moving');
  gameState.spikes = room.spikes;
  gameState.checkpoints = room.checkpoints;
  
  // Add moving platforms
  for (const mp of room.movingPlatforms) {
    gameState.platforms.push(mp);
  }
}

export function getCurrentRoom() {
  const key = `${gameState.currentRoom.x},${gameState.currentRoom.y}`;
  return gameState.rooms.get(key);
}