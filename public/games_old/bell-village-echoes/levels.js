// levels.js - Level definitions and scene data

export const LEVEL_DATA = {
  1: {
    name: "The Dilapidated Shrine Entrance",
    timeLimit: 600, // 10 minutes in seconds
    scenes: {
      entrance: {
        id: 'entrance',
        name: 'Shrine Entrance',
        connections: { right: 'courtyard' },
        hotspots: [
          {
            id: 'stone_carving',
            name: 'Stone Carving',
            x: 150,
            y: 200,
            width: 80,
            height: 80,
            type: 'examine',
            description: 'An ancient carving with a hidden symbol',
            state: 'initial'
          },
          {
            id: 'overgrown_vines',
            name: 'Overgrown Vines',
            x: 400,
            y: 150,
            width: 100,
            height: 120,
            type: 'item',
            itemId: 'rusted_key',
            state: 'hasItem'
          }
        ]
      },
      courtyard: {
        id: 'courtyard',
        name: 'Small Courtyard',
        connections: { left: 'entrance', right: 'main_door' },
        hotspots: [
          {
            id: 'stone_tablets',
            name: 'Stone Tablets',
            x: 250,
            y: 220,
            width: 100,
            height: 60,
            type: 'puzzle',
            puzzleId: 'tablet_arrangement',
            state: 'unsolved'
          }
        ]
      },
      main_door: {
        id: 'main_door',
        name: 'Main Door',
        connections: { left: 'courtyard' },
        hotspots: [
          {
            id: 'locked_door',
            name: 'Locked Main Door',
            x: 250,
            y: 150,
            width: 100,
            height: 150,
            type: 'use_item',
            requiredItemId: 'rusted_key',
            state: 'locked'
          },
          {
            id: 'wooden_box',
            name: 'Wooden Box',
            x: 450,
            y: 280,
            width: 60,
            height: 50,
            type: 'puzzle',
            puzzleId: 'cipher_box',
            state: 'unsolved'
          }
        ]
      }
    },
    startScene: 'entrance',
    winCondition: 'locked_door_unlocked'
  },
  2: {
    name: "The Inner Sanctum",
    timeLimit: 720, // 12 minutes
    scenes: {
      altar_room: {
        id: 'altar_room',
        name: 'Altar Room',
        connections: { right: 'scroll_chamber' },
        hotspots: [
          {
            id: 'altar',
            name: 'Ancient Altar',
            x: 300,
            y: 200,
            width: 120,
            height: 100,
            type: 'examine',
            description: 'A dusty altar with strange markings',
            state: 'initial'
          },
          {
            id: 'sealed_scroll',
            name: 'Sealed Scroll',
            x: 150,
            y: 250,
            width: 60,
            height: 40,
            type: 'use_item',
            requiredItemId: 'ritual_liquid',
            state: 'sealed'
          },
          {
            id: 'dusty_cabinet',
            name: 'Dusty Cabinet',
            x: 450,
            y: 180,
            width: 80,
            height: 100,
            type: 'puzzle',
            puzzleId: 'symbol_matching',
            state: 'unsolved'
          }
        ]
      },
      scroll_chamber: {
        id: 'scroll_chamber',
        name: 'Scroll Chamber',
        connections: { left: 'altar_room', right: 'hidden_passage' },
        hotspots: [
          {
            id: 'ancient_chest',
            name: 'Ancient Chest',
            x: 280,
            y: 220,
            width: 100,
            height: 80,
            type: 'puzzle',
            puzzleId: 'slider_puzzle',
            state: 'unsolved'
          },
          {
            id: 'effigies',
            name: 'Unsettling Effigies',
            x: 100,
            y: 150,
            width: 80,
            height: 120,
            type: 'item',
            itemId: 'ritual_liquid',
            state: 'hasItem'
          }
        ]
      },
      hidden_passage: {
        id: 'hidden_passage',
        name: 'Hidden Passage',
        connections: { left: 'scroll_chamber' },
        hotspots: [
          {
            id: 'sound_bells',
            name: 'Ceremonial Bells',
            x: 200,
            y: 180,
            width: 200,
            height: 100,
            type: 'puzzle',
            puzzleId: 'sound_sequence',
            state: 'unsolved'
          }
        ]
      }
    },
    startScene: 'altar_room',
    winCondition: 'sound_sequence_solved'
  },
  3: {
    name: "The Crypt of Echoes",
    timeLimit: 900, // 15 minutes
    scenes: {
      crypt_entrance: {
        id: 'crypt_entrance',
        name: 'Crypt Entrance',
        connections: { right: 'burial_chamber' },
        hotspots: [
          {
            id: 'riddle_tablet',
            name: 'Riddle Tablet',
            x: 300,
            y: 200,
            width: 100,
            height: 80,
            type: 'puzzle',
            puzzleId: 'cryptic_riddle',
            state: 'unsolved'
          },
          {
            id: 'scroll_fragment_1',
            name: 'Scroll Fragment',
            x: 150,
            y: 280,
            width: 40,
            height: 30,
            type: 'item',
            itemId: 'fragment_1',
            state: 'hasItem'
          }
        ]
      },
      burial_chamber: {
        id: 'burial_chamber',
        name: 'Burial Chamber',
        connections: { left: 'crypt_entrance', right: 'ritual_chamber' },
        hotspots: [
          {
            id: 'weight_scale',
            name: 'Ancient Scale',
            x: 250,
            y: 220,
            width: 120,
            height: 80,
            type: 'puzzle',
            puzzleId: 'weight_balance',
            state: 'unsolved'
          },
          {
            id: 'scroll_fragment_2',
            name: 'Scroll Fragment',
            x: 420,
            y: 300,
            width: 40,
            height: 30,
            type: 'item',
            itemId: 'fragment_2',
            state: 'hasItem'
          }
        ]
      },
      ritual_chamber: {
        id: 'ritual_chamber',
        name: 'Ritual Chamber',
        connections: { left: 'burial_chamber' },
        hotspots: [
          {
            id: 'lever_mechanism',
            name: 'Lever Mechanism',
            x: 180,
            y: 150,
            width: 100,
            height: 120,
            type: 'puzzle',
            puzzleId: 'lever_sequence',
            state: 'unsolved'
          },
          {
            id: 'final_altar',
            name: 'Final Altar',
            x: 350,
            y: 200,
            width: 140,
            height: 120,
            type: 'puzzle',
            puzzleId: 'final_ritual',
            state: 'unsolved'
          },
          {
            id: 'scroll_fragment_3',
            name: 'Scroll Fragment',
            x: 500,
            y: 180,
            width: 40,
            height: 30,
            type: 'item',
            itemId: 'fragment_3',
            state: 'hasItem'
          }
        ]
      }
    },
    startScene: 'crypt_entrance',
    winCondition: 'final_ritual_solved'
  }
};

export const ITEMS = {
  rusted_key: {
    id: 'rusted_key',
    name: 'Rusted Key',
    description: 'An old, rusty key'
  },
  ritual_liquid: {
    id: 'ritual_liquid',
    name: 'Ritual Liquid',
    description: 'A strange, glowing liquid'
  },
  fragment_1: {
    id: 'fragment_1',
    name: 'Scroll Fragment I',
    description: 'Part of an ancient scroll'
  },
  fragment_2: {
    id: 'fragment_2',
    name: 'Scroll Fragment II',
    description: 'Part of an ancient scroll'
  },
  fragment_3: {
    id: 'fragment_3',
    name: 'Scroll Fragment III',
    description: 'Part of an ancient scroll'
  }
};