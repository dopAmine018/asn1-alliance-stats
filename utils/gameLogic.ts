
import { Player } from '../types';

export const T10_COSTS = {
    // Advanced Protection
    advProt: {
        gold: [64600000, 92300000, 92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000],
        valor: [1280, 1440, 1440, 1600, 1600, 1800, 1800, 2000, 2000, 2000],
        foodIron: [21700000, 31000000, 31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000]
    },
    // HP, Attack, Defense Boost III
    boost3: {
        gold: [92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000, 403000000, 563000000],
        valor: [1440, 1600, 1600, 1800, 1800, 2000, 2000, 2200, 2200, 2400],
        foodIron: [31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000, 134000000, 175000000]
    },
    // Final Unlock
    unlock: {
        gold: 563000000,
        valor: 2400,
        foodIron: 188000000
    }
};

// Costs to upgrade TO this level (e.g. index 0 is Level 1, index 29 is Level 30)
const BARRACKS_DATA = [
    { lvl: 1, f: 40, g: 40 },
    { lvl: 2, f: 30, g: 30 },
    { lvl: 3, f: 680, g: 680 },
    { lvl: 4, f: 1700, g: 1700 },
    { lvl: 5, f: 14000, g: 14000 },
    { lvl: 6, f: 61000, g: 61000 },
    { lvl: 7, f: 120000, g: 120000 },
    { lvl: 8, f: 190000, g: 190000 },
    { lvl: 9, f: 310000, g: 120000 },
    { lvl: 10, f: 370000, g: 150000 },
    { lvl: 11, f: 930000, g: 370000 },
    { lvl: 12, f: 1600000, g: 630000 },
    { lvl: 13, f: 1700000, g: 700000 },
    { lvl: 14, f: 2400000, g: 980000 },
    { lvl: 15, f: 3400000, g: 1400000 },
    { lvl: 16, f: 6100000, g: 2400000 },
    { lvl: 17, f: 7900000, g: 3200000 },
    { lvl: 18, f: 14000000, g: 5500000 },
    { lvl: 19, f: 17000000, g: 6600000 },
    { lvl: 20, f: 30000000, g: 12000000 },
    { lvl: 21, f: 42000000, g: 17000000 },
    { lvl: 22, f: 54000000, g: 22000000 },
    { lvl: 23, f: 68000000, g: 27000000 },
    { lvl: 24, f: 85000000, g: 34000000 },
    { lvl: 25, f: 140000000, g: 58000000 },
    { lvl: 26, f: 200000000, g: 81000000 },
    { lvl: 27, f: 260000000, g: 110000000 },
    { lvl: 28, f: 370000000, g: 150000000 },
    { lvl: 29, f: 520000000, g: 210000000 },
    { lvl: 30, f: 720000000, g: 290000000 },
    { lvl: 31, f: 790000000, g: 320000000 },
    { lvl: 32, f: 870000000, g: 350000000 },
    { lvl: 33, f: 960000000, g: 380000000 },
    { lvl: 34, f: 1000000000, g: 400000000 },
    { lvl: 35, f: 1100000000, g: 420000000 },
];

const TECH_CENTER_DATA = [
    { lvl: 1, f: 90, g: 90 },
    { lvl: 2, f: 230, g: 230 },
    { lvl: 3, f: 1000, g: 1000 },
    { lvl: 4, f: 2500, g: 2500 },
    { lvl: 5, f: 20000, g: 20000 },
    { lvl: 6, f: 91000, g: 91000 },
    { lvl: 7, f: 210000, g: 210000 },
    { lvl: 8, f: 340000, g: 340000 },
    { lvl: 9, f: 540000, g: 170000 },
    { lvl: 10, f: 650000, g: 210000 },
    { lvl: 11, f: 1600000, g: 520000 },
    { lvl: 12, f: 2800000, g: 890000 },
    { lvl: 13, f: 3100000, g: 980000 },
    { lvl: 14, f: 4300000, g: 1400000 },
    { lvl: 15, f: 6000000, g: 1900000 },
    { lvl: 16, f: 11000000, g: 3400000 },
    { lvl: 17, f: 14000000, g: 4400000 },
    { lvl: 18, f: 24000000, g: 7800000 },
    { lvl: 19, f: 29000000, g: 9300000 },
    { lvl: 20, f: 52000000, g: 17000000 },
    { lvl: 21, f: 73000000, g: 23000000 },
    { lvl: 22, f: 95000000, g: 30000000 },
    { lvl: 23, f: 120000000, g: 38000000 },
    { lvl: 24, f: 150000000, g: 48000000 },
    { lvl: 25, f: 250000000, g: 81000000 },
    { lvl: 26, f: 350000000, g: 110000000 },
    { lvl: 27, f: 460000000, g: 150000000 },
    { lvl: 28, f: 640000000, g: 210000000 },
    { lvl: 29, f: 900000000, g: 290000000 },
    { lvl: 30, f: 1300000000, g: 400000000 },
    { lvl: 31, f: 1400000000, g: 440000000 },
    { lvl: 32, f: 1500000000, g: 490000000 },
    { lvl: 33, f: 1700000000, g: 540000000 },
    { lvl: 34, f: 1800000000, g: 570000000 },
    { lvl: 35, f: 1900000000, g: 590000000 },
];

export interface T10Levels {
    t10Protection: number;
    t10Hp: number;
    t10Atk: number;
    t10Def: number;
    barracksLevel?: number;
    techLevel?: number;
}

export const calculateT10RemainingCost = (p: T10Levels) => {
    // 1. Calculate Research Costs
    const sumRemaining = (currentLevel: number, costArray: number[]) => {
        if (currentLevel >= 10) return 0;
        return costArray.slice(currentLevel).reduce((a, b) => a + b, 0);
    };

    const prot = Number(p.t10Protection) || 0;
    const hp = Number(p.t10Hp) || 0;
    const atk = Number(p.t10Atk) || 0;
    const def = Number(p.t10Def) || 0;

    let gold = 0;
    let valor = 0;
    let foodIron = 0;

    // Protection
    gold += sumRemaining(prot, T10_COSTS.advProt.gold);
    valor += sumRemaining(prot, T10_COSTS.advProt.valor);
    foodIron += sumRemaining(prot, T10_COSTS.advProt.foodIron);

    // Boosts
    gold += sumRemaining(hp, T10_COSTS.boost3.gold);
    valor += sumRemaining(hp, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(hp, T10_COSTS.boost3.foodIron);

    gold += sumRemaining(atk, T10_COSTS.boost3.gold);
    valor += sumRemaining(atk, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(atk, T10_COSTS.boost3.foodIron);

    gold += sumRemaining(def, T10_COSTS.boost3.gold);
    valor += sumRemaining(def, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(def, T10_COSTS.boost3.foodIron);

    // Final Unlock
    if (prot < 10 || hp < 10 || atk < 10 || def < 10) {
        gold += T10_COSTS.unlock.gold;
        valor += T10_COSTS.unlock.valor;
        foodIron += T10_COSTS.unlock.foodIron;
    }

    // 2. Calculate Building Costs (Up to Level 30 for T10 prerequisite)
    const TARGET_LEVEL = 30;

    const calculateBuildingCost = (currentLvl: number, data: {lvl: number, f: number, g: number}[]) => {
        let bGold = 0;
        let bFood = 0;
        // Iterate from next level up to TARGET_LEVEL
        // data array is 0-indexed, so level 1 is at index 0.
        // Cost to reach level L is at index L-1.
        // If current is 25, we need cost for 26 (index 25) up to 30 (index 29).
        
        const startIdx = Math.max(0, currentLvl); // If current is 0, start at index 0 (lvl 1)
        const endIdx = TARGET_LEVEL; // slice is exclusive of end, so slice(0, 30) gets indices 0..29 (Levels 1..30)

        // Safety check
        if (currentLvl >= TARGET_LEVEL) return { bGold: 0, bFood: 0 };

        const needed = data.slice(startIdx, endIdx);
        needed.forEach(item => {
            bGold += item.g;
            bFood += item.f;
        });

        return { bGold, bFood };
    };

    const barracksLvl = Number(p.barracksLevel) || 0;
    const techLvl = Number(p.techLevel) || 0;

    const barracksCost = calculateBuildingCost(barracksLvl, BARRACKS_DATA);
    const techCenterCost = calculateBuildingCost(techLvl, TECH_CENTER_DATA);

    gold += barracksCost.bGold + techCenterCost.bGold;
    foodIron += barracksCost.bFood + techCenterCost.bFood;

    return { gold, valor, foodIron };
};
