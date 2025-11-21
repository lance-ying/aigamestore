// creo_data.js - Creo species and skill definitions

import { TYPE_FIRE, TYPE_WATER, TYPE_GRASS, TYPE_ELECTRIC, TYPE_NORMAL } from './globals.js';

export const CREO_SPECIES = {
  // Starter Creo
  FLAMEPUP: {
    name: "Flamepup",
    type: TYPE_FIRE,
    baseStats: { hp: 45, atk: 52, def: 43, spd: 65 },
    color: [255, 100, 50],
    learnset: { 1: "EMBER", 5: "FIRE_FANG", 10: "FLAME_BURST" }
  },
  AQUATAIL: {
    name: "Aquatail",
    type: TYPE_WATER,
    baseStats: { hp: 50, atk: 48, def: 50, spd: 55 },
    color: [50, 150, 255],
    learnset: { 1: "WATER_GUN", 5: "AQUA_JET", 10: "HYDRO_PUMP" }
  },
  LEAFLING: {
    name: "Leafling",
    type: TYPE_GRASS,
    baseStats: { hp: 48, atk: 45, def: 55, spd: 50 },
    color: [100, 200, 80],
    learnset: { 1: "VINE_WHIP", 5: "RAZOR_LEAF", 10: "SOLAR_BEAM" }
  },
  
  // Wild Creo
  SPARKBIT: {
    name: "Sparkbit",
    type: TYPE_ELECTRIC,
    baseStats: { hp: 35, atk: 55, def: 30, spd: 75 },
    color: [255, 255, 100],
    learnset: { 1: "THUNDER_SHOCK", 5: "SPARK", 10: "THUNDERBOLT" }
  },
  ROCKLING: {
    name: "Rockling",
    type: TYPE_NORMAL,
    baseStats: { hp: 55, atk: 60, def: 65, spd: 35 },
    color: [150, 150, 150],
    learnset: { 1: "TACKLE", 5: "ROCK_THROW", 10: "EARTHQUAKE" }
  },
  
  // Boss Creo
  INFERNOX: {
    name: "Infernox",
    type: TYPE_FIRE,
    baseStats: { hp: 80, atk: 90, def: 70, spd: 85 },
    color: [255, 50, 0],
    learnset: { 1: "FIRE_FANG", 5: "FLAME_BURST", 10: "INFERNO", 15: "FIRE_BLAST" }
  }
};

export const SKILLS = {
  // Fire skills
  EMBER: { name: "Ember", type: TYPE_FIRE, power: 40, effect: null },
  FIRE_FANG: { name: "Fire Fang", type: TYPE_FIRE, power: 65, effect: null },
  FLAME_BURST: { name: "Flame Burst", type: TYPE_FIRE, power: 80, effect: null },
  INFERNO: { name: "Inferno", type: TYPE_FIRE, power: 100, effect: null },
  FIRE_BLAST: { name: "Fire Blast", type: TYPE_FIRE, power: 120, effect: null },
  
  // Water skills
  WATER_GUN: { name: "Water Gun", type: TYPE_WATER, power: 40, effect: null },
  AQUA_JET: { name: "Aqua Jet", type: TYPE_WATER, power: 60, effect: null },
  HYDRO_PUMP: { name: "Hydro Pump", type: TYPE_WATER, power: 90, effect: null },
  
  // Grass skills
  VINE_WHIP: { name: "Vine Whip", type: TYPE_GRASS, power: 45, effect: null },
  RAZOR_LEAF: { name: "Razor Leaf", type: TYPE_GRASS, power: 55, effect: null },
  SOLAR_BEAM: { name: "Solar Beam", type: TYPE_GRASS, power: 120, effect: null },
  
  // Electric skills
  THUNDER_SHOCK: { name: "Thunder Shock", type: TYPE_ELECTRIC, power: 40, effect: null },
  SPARK: { name: "Spark", type: TYPE_ELECTRIC, power: 65, effect: null },
  THUNDERBOLT: { name: "Thunderbolt", type: TYPE_ELECTRIC, power: 90, effect: null },
  
  // Normal skills
  TACKLE: { name: "Tackle", type: TYPE_NORMAL, power: 40, effect: null },
  ROCK_THROW: { name: "Rock Throw", type: TYPE_NORMAL, power: 50, effect: null },
  EARTHQUAKE: { name: "Earthquake", type: TYPE_NORMAL, power: 100, effect: null }
};