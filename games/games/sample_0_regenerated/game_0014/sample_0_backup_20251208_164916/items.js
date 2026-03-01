/**
 * items.js
 * Definitions for items that the player can collect.
 */

export const ITEM_TIERS = {
    COMMON: 'COMMON',
    RARE: 'RARE',
    LEGENDARY: 'LEGENDARY'
};

export const ITEMS = [
    {
        id: 'soldier_syringe',
        name: 'Soldier\'s Syringe',
        tier: ITEM_TIERS.COMMON,
        desc: 'Increases attack speed by 15%',
        color: [255, 255, 200],
        onAcquire: (player) => { player.stats.attackSpeed *= 1.15; }
    },
    {
        id: 'goat_hoof',
        name: 'Paul\'s Goat Hoof',
        tier: ITEM_TIERS.COMMON,
        desc: 'Increases movement speed by 10%',
        color: [200, 255, 200],
        onAcquire: (player) => { player.stats.moveSpeed *= 1.1; }
    },
    {
        id: 'lens_makers_glasses',
        name: 'Lens-Maker\'s Glasses',
        tier: ITEM_TIERS.COMMON,
        desc: 'Increases crit chance by 10%',
        color: [200, 100, 100],
        onAcquire: (player) => { player.stats.critChance += 0.1; }
    },
    {
        id: 'hopoo_feather',
        name: 'Hopoo Feather',
        tier: ITEM_TIERS.RARE,
        desc: 'Gain +1 maximum jump',
        color: [100, 200, 255],
        onAcquire: (player) => { player.stats.maxJumps += 1; }
    },
    {
        id: 'ukulele',
        name: 'Ukulele',
        tier: ITEM_TIERS.RARE,
        desc: '25% chance to fire chain lightning',
        color: [255, 150, 50],
        onAcquire: (player) => { player.stats.procChainLightning = true; }
    },
    {
        id: 'behemoth',
        name: 'Brilliant Behemoth',
        tier: ITEM_TIERS.LEGENDARY,
        desc: 'All attacks explode',
        color: [255, 50, 50],
        onAcquire: (player) => { player.stats.explosiveRounds = true; }
    }
];

export function getRandomItem() {
    // Simple weighted random
    const rand = Math.random();
    let tier = ITEM_TIERS.COMMON;
    
    if (rand > 0.95) tier = ITEM_TIERS.LEGENDARY;
    else if (rand > 0.8) tier = ITEM_TIERS.RARE;
    
    const pool = ITEMS.filter(i => i.tier === tier);
    return pool[Math.floor(Math.random() * pool.length)];
}