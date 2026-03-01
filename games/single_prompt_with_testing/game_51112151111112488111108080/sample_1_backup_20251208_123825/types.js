// Entity Types
export const TYPES = {
    // Objects
    BABA: 'BABA',
    WALL: 'WALL',
    FLAG: 'FLAG',
    ROCK: 'ROCK',
    WATER: 'WATER',
    GRASS: 'GRASS',
    SKULL: 'SKULL',
    TILE: 'TILE', // Floor
    
    // Text Nouns
    TEXT_BABA: 'TEXT_BABA',
    TEXT_WALL: 'TEXT_WALL',
    TEXT_FLAG: 'TEXT_FLAG',
    TEXT_ROCK: 'TEXT_ROCK',
    TEXT_WATER: 'TEXT_WATER',
    TEXT_GRASS: 'TEXT_GRASS',
    TEXT_SKULL: 'TEXT_SKULL',
    
    // Text Operators
    TEXT_IS: 'TEXT_IS',
    
    // Text Properties
    TEXT_YOU: 'TEXT_YOU',
    TEXT_WIN: 'TEXT_WIN',
    TEXT_STOP: 'TEXT_STOP',
    TEXT_PUSH: 'TEXT_PUSH',
    TEXT_DEFEAT: 'TEXT_DEFEAT',
    TEXT_SINK: 'TEXT_SINK'
};

// Categories
export const CATEGORIES = {
    OBJECT: 'OBJECT',
    TEXT: 'TEXT'
};

// Property Mappings
export const TEXT_TO_TYPE = {
    [TYPES.TEXT_BABA]: TYPES.BABA,
    [TYPES.TEXT_WALL]: TYPES.WALL,
    [TYPES.TEXT_FLAG]: TYPES.FLAG,
    [TYPES.TEXT_ROCK]: TYPES.ROCK,
    [TYPES.TEXT_WATER]: TYPES.WATER,
    [TYPES.TEXT_GRASS]: TYPES.GRASS,
    [TYPES.TEXT_SKULL]: TYPES.SKULL
};

export const TEXT_TO_PROPERTY = {
    [TYPES.TEXT_YOU]: 'YOU',
    [TYPES.TEXT_WIN]: 'WIN',
    [TYPES.TEXT_STOP]: 'STOP',
    [TYPES.TEXT_PUSH]: 'PUSH',
    [TYPES.TEXT_DEFEAT]: 'DEFEAT',
    [TYPES.TEXT_SINK]: 'SINK'
};

// Visual Configuration
export const TYPE_CONFIG = {
    [TYPES.BABA]: { color: [255, 255, 255], layer: 10 },
    [TYPES.WALL]: { color: [100, 100, 100], layer: 5 },
    [TYPES.FLAG]: { color: [255, 255, 0], layer: 8 },
    [TYPES.ROCK]: { color: [150, 100, 50], layer: 6 },
    [TYPES.WATER]: { color: [50, 100, 255], layer: 4 },
    [TYPES.GRASS]: { color: [50, 200, 50], layer: 2 },
    [TYPES.SKULL]: { color: [200, 50, 50], layer: 7 },
    [TYPES.TILE]: { color: [30, 30, 35], layer: 1 },

    // Text Colors
    [TYPES.TEXT_BABA]: { color: [255, 0, 128], isText: true },
    [TYPES.TEXT_WALL]: { color: [128, 128, 128], isText: true },
    [TYPES.TEXT_FLAG]: { color: [255, 255, 100], isText: true },
    [TYPES.TEXT_ROCK]: { color: [180, 130, 80], isText: true },
    [TYPES.TEXT_WATER]: { color: [100, 150, 255], isText: true },
    [TYPES.TEXT_GRASS]: { color: [100, 220, 100], isText: true },
    [TYPES.TEXT_SKULL]: { color: [220, 100, 100], isText: true },

    [TYPES.TEXT_IS]: { color: [255, 255, 255], isText: true },
    
    [TYPES.TEXT_YOU]: { color: [255, 0, 128], isText: true },
    [TYPES.TEXT_WIN]: { color: [255, 255, 0], isText: true },
    [TYPES.TEXT_STOP]: { color: [50, 200, 50], isText: true },
    [TYPES.TEXT_PUSH]: { color: [120, 120, 120], isText: true },
    [TYPES.TEXT_DEFEAT]: { color: [150, 0, 0], isText: true },
    [TYPES.TEXT_SINK]: { color: [50, 100, 255], isText: true }
};

export function isText(type) {
    return TYPE_CONFIG[type] && TYPE_CONFIG[type].isText;
}

export function getTextLabel(type) {
    return type.replace('TEXT_', '');
}