// levels.js - Level configuration and generation

import { Character, Ability } from './character.js';
import { ELEMENT_TYPE, STATUS_EFFECT } from './globals.js';

export function initializePlayerCharacters(p) {
  const heroes = [];
  
  // Hero 1 - Fire Type
  const hero1 = new Character(
    'hero1',
    'Blaze',
    ELEMENT_TYPE.FIRE,
    100,
    20,
    8,
    150,
    320,
    true
  );
  hero1.abilities = [
    new Ability('Fire Punch', 15, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE),
    new Ability('Flame Burst', 25, 3, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE),
    new Ability('Heal', 20, 4, 'SELF', 'HEAL', ELEMENT_TYPE.NONE)
  ];
  heroes.push(hero1);
  
  // Hero 2 - Water Type
  const hero2 = new Character(
    'hero2',
    'Aqua',
    ELEMENT_TYPE.WATER,
    120,
    18,
    10,
    300,
    320,
    true
  );
  hero2.abilities = [
    new Ability('Water Strike', 12, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.WATER),
    new Ability('Tidal Wave', 22, 3, 'SINGLE', 'ATTACK', ELEMENT_TYPE.WATER),
    new Ability('Shield Up', 0, 4, 'SELF', 'BUFF', ELEMENT_TYPE.NONE, { type: STATUS_EFFECT.DEFENSE_UP, duration: 2, value: 0 })
  ];
  heroes.push(hero2);
  
  // Hero 3 - Nature Type
  const hero3 = new Character(
    'hero3',
    'Terra',
    ELEMENT_TYPE.NATURE,
    110,
    22,
    6,
    450,
    320,
    true
  );
  hero3.abilities = [
    new Ability('Vine Whip', 18, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.NATURE),
    new Ability('Nature\'s Wrath', 30, 3, 'SINGLE', 'ATTACK', ELEMENT_TYPE.NATURE),
    new Ability('Regen', 0, 3, 'SELF', 'BUFF', ELEMENT_TYPE.NONE, { type: STATUS_EFFECT.HEAL_OVER_TIME, duration: 3, value: 10 })
  ];
  heroes.push(hero3);
  
  return heroes;
}

export function generateEnemiesForLevel(level, p) {
  const enemies = [];
  const enemyY = 100;
  
  // Helper function to calculate evenly spaced positions
  function getEnemyPositions(count) {
    const positions = [];
    const spacing = 500 / (count + 1); // Distribute across 500px width with margins
    for (let i = 0; i < count; i++) {
      positions.push(50 + spacing * (i + 1));
    }
    return positions;
  }
  
  switch(level) {
    case 1:
      // 3 Minor Thugs
      const positions1 = getEnemyPositions(3);
      for (let i = 0; i < 3; i++) {
        const enemy = new Character(
          `enemy_${i}`,
          'Thug',
          ELEMENT_TYPE.NONE,
          40,
          12,
          3,
          positions1[i],
          enemyY,
          false
        );
        enemy.abilities = [
          new Ability('Punch', 10, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.NONE)
        ];
        enemies.push(enemy);
      }
      break;
      
    case 2:
      // 4 Minor Thugs, 1 Brawler
      const positions2 = getEnemyPositions(5);
      for (let i = 0; i < 4; i++) {
        const types = [ELEMENT_TYPE.FIRE, ELEMENT_TYPE.WATER, ELEMENT_TYPE.NONE, ELEMENT_TYPE.NONE];
        const enemy = new Character(
          `enemy_${i}`,
          'Thug',
          types[i],
          45,
          14,
          4,
          positions2[i],
          enemyY,
          false
        );
        enemy.abilities = [
          new Ability('Punch', 12, 0, 'SINGLE', 'ATTACK', types[i])
        ];
        enemies.push(enemy);
      }
      const brawler = new Character(
        'enemy_4',
        'Brawler',
        ELEMENT_TYPE.FIRE,
        70,
        18,
        6,
        positions2[4],
        enemyY,
        false
      );
      brawler.abilities = [
        new Ability('Heavy Hit', 18, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE)
      ];
      enemies.push(brawler);
      break;
      
    case 3:
      // 3 Thugs, 2 Brawlers, 1 Support
      const positions3 = getEnemyPositions(6);
      for (let i = 0; i < 3; i++) {
        const types = [ELEMENT_TYPE.FIRE, ELEMENT_TYPE.WATER, ELEMENT_TYPE.NATURE];
        const enemy = new Character(
          `enemy_${i}`,
          'Thug',
          types[i],
          50,
          15,
          5,
          positions3[i],
          enemyY,
          false
        );
        enemy.abilities = [
          new Ability('Attack', 14, 0, 'SINGLE', 'ATTACK', types[i])
        ];
        enemies.push(enemy);
      }
      for (let i = 3; i < 5; i++) {
        const types = [ELEMENT_TYPE.WATER, ELEMENT_TYPE.NATURE];
        const brawler = new Character(
          `enemy_${i}`,
          'Brawler',
          types[i - 3],
          75,
          20,
          7,
          positions3[i],
          enemyY,
          false
        );
        brawler.abilities = [
          new Ability('Strong Hit', 20, 0, 'SINGLE', 'ATTACK', types[i - 3])
        ];
        enemies.push(brawler);
      }
      const support = new Character(
        'enemy_5',
        'Support',
        ELEMENT_TYPE.FIRE,
        50,
        10,
        4,
        positions3[5],
        enemyY,
        false
      );
      support.abilities = [
        new Ability('Heal Ally', 25, 2, 'SINGLE', 'HEAL', ELEMENT_TYPE.NONE),
        new Ability('Weak Hit', 8, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE)
      ];
      enemies.push(support);
      break;
      
    case 4:
      // 2 Brawlers, 1 Support, 1 Mini-Boss
      const positions4 = getEnemyPositions(4);
      for (let i = 0; i < 2; i++) {
        const types = [ELEMENT_TYPE.FIRE, ELEMENT_TYPE.WATER];
        const brawler = new Character(
          `enemy_${i}`,
          'Brawler',
          types[i],
          80,
          22,
          8,
          positions4[i],
          enemyY,
          false
        );
        brawler.abilities = [
          new Ability('Power Hit', 22, 0, 'SINGLE', 'ATTACK', types[i])
        ];
        enemies.push(brawler);
      }
      const support2 = new Character(
        'enemy_2',
        'Support',
        ELEMENT_TYPE.NATURE,
        55,
        12,
        5,
        positions4[2],
        enemyY,
        false
      );
      support2.abilities = [
        new Ability('Heal Ally', 30, 2, 'SINGLE', 'HEAL', ELEMENT_TYPE.NONE),
        new Ability('Attack', 10, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.NATURE)
      ];
      enemies.push(support2);
      
      const miniBoss = new Character(
        'enemy_3',
        'Mini-Boss',
        ELEMENT_TYPE.FIRE,
        120,
        28,
        10,
        positions4[3],
        enemyY,
        false
      );
      miniBoss.abilities = [
        new Ability('Crushing Blow', 30, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE),
        new Ability('Stun Strike', 20, 3, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE, { type: STATUS_EFFECT.STUN, duration: 1, value: 0 })
      ];
      enemies.push(miniBoss);
      break;
      
    case 5:
      // 1 Brawler, 2 Supports, 1 Main Boss
      const positions5 = getEnemyPositions(4);
      const brawler5 = new Character(
        'enemy_0',
        'Elite Brawler',
        ELEMENT_TYPE.WATER,
        90,
        25,
        9,
        positions5[0],
        enemyY,
        false
      );
      brawler5.abilities = [
        new Ability('Mega Hit', 28, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.WATER)
      ];
      enemies.push(brawler5);
      
      for (let i = 1; i < 3; i++) {
        const types = [ELEMENT_TYPE.NATURE, ELEMENT_TYPE.FIRE];
        const support3 = new Character(
          `enemy_${i}`,
          'Elite Support',
          types[i - 1],
          60,
          14,
          6,
          positions5[i],
          enemyY,
          false
        );
        support3.abilities = [
          new Ability('Strong Heal', 35, 2, 'SINGLE', 'HEAL', ELEMENT_TYPE.NONE),
          new Ability('Attack', 12, 0, 'SINGLE', 'ATTACK', types[i - 1])
        ];
        enemies.push(support3);
      }
      
      const mainBoss = new Character(
        'enemy_3',
        'MAIN BOSS',
        ELEMENT_TYPE.FIRE,
        200,
        35,
        12,
        positions5[3],
        enemyY,
        false
      );
      mainBoss.abilities = [
        new Ability('Devastation', 40, 0, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE),
        new Ability('AOE Blast', 25, 2, 'SINGLE', 'ATTACK', ELEMENT_TYPE.FIRE),
        new Ability('Power Surge', 0, 4, 'SELF', 'BUFF', ELEMENT_TYPE.NONE, { type: STATUS_EFFECT.DEFENSE_UP, duration: 2, value: 0 })
      ];
      enemies.push(mainBoss);
      break;
  }
  
  return enemies;
}