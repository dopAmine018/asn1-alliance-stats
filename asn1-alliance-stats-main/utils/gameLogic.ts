import { Player } from '../types';

export const T10_COSTS = {
    advProt: {
        gold: [64600000, 92300000, 92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000],
        valor: [1280, 1440, 1440, 1600, 1600, 1800, 1800, 2000, 2000, 2000],
        foodIron: [21700000, 31000000, 31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000]
    },
    boost3: {
        gold: [92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000, 403000000, 563000000],
        valor: [1440, 1600, 1600, 1800, 1800, 2000, 2000, 2200, 2200, 2400],
        foodIron: [31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000, 134000000, 175000000]
    },
    unlock: {
        gold: 563000000,
        valor: 2400,
        foodIron: 188000000
    }
};

const BARRACKS_DATA = [
    { lvl: 1, f: 40, g: 40 }, { lvl: 2, f: 30, g: 30 }, { lvl: 3, f: 680, g: 680 }, { lvl: 4, f: 1700, g: 1700 }, { lvl: 5, f: 14000, g: 14000 }, { lvl: 6, f: 61000, g: 61000 }, { lvl: 7, f: 120000, g: 120000 }, { lvl: 8, f: 190000, g: 190000 }, { lvl: 9, f: 310000, g: 120000 }, { lvl: 10, f: 370000, g: 150000 }, { lvl: 11, f: 930000, g: 370000 }, { lvl: 12, f: 1600000, g: 630000 }, { lvl: 13, f: 1700000, g: 700000 }, { lvl: 14, f: 2400000, g: 980000 }, { lvl: 15, f: 3400000, g: 1400000 }, { lvl: 16, f: 6100000, g: 2400000 }, { lvl: 17, f: 7900000, g: 3200000 }, { lvl: 18, f: 14000000, g: 5500000 }, { lvl: 19, f: 17000000, g: 6600000 }, { lvl: 20, f: 30000000, g: 12000000 }, { lvl: 21, f: 42000000, g: 17000000 }, { lvl: 22, f: 54000000, g: 22000000 }, { lvl: 23, f: 68000000, g: 27000000 }, { lvl: 24, f: 85000000, g: 34000000 }, { lvl: 25, f: 140000000, g: 58000000 }, { lvl: 26, f: 200000000, g: 81000000 }, { lvl: 27, f: 260000000, g: 110000000 }, { lvl: 28, f: 370000000, g: 150000000 }, { lvl: 29, f: 520000000, g: 210000000 }, { lvl: 30, f: 720000000, g: 290000000 }, { lvl: 31, f: 790000000, g: 320000000 }, { lvl: 32, f: 870000000, g: 350000000 }, { lvl: 33, f: 960000000, g: 380000000 }, { lvl: 34, f: 1000000000, g: 400000000 }, { lvl: 35, f: 1100000000, g: 420000000 },
];

const TECH_CENTER_DATA = [
    { lvl: 1, f: 90, g: 90 }, { lvl: 2, f: 230, g: 230 }, { lvl: 3, f: 1000, g: 1000 }, { lvl: 4, f: 2500, g: 2500 }, { lvl: 5, f: 20000, g: 20000 }, { lvl: 6, f: 91000, g: 91000 }, { lvl: 7, f: 210000, g: 210000 }, { lvl: 8, f: 340000, g: 340000 }, { lvl: 9, f: 540000, g: 170000 }, { lvl: 10, f: 650000, g: 210000 }, { lvl: 11, f: 1600000, g: 520000 }, { lvl: 12, f: 2800000, g: 890000 }, { lvl: 13, f: 3100000, g: 980000 }, { lvl: 14, f: 4300000, g: 1400000 }, { lvl: 15, f: 6000000, g: 1900000 }, { lvl: 16, f: 11000000, g: 3400000 }, { lvl: 17, f: 14000000, g: 4400000 }, { lvl: 18, f: 24000000, g: 7800000 }, { lvl: 19, f: 29000000, g: 9300000 }, { lvl: 20, f: 52000000, g: 17000000 }, { lvl: 21, f: 73000000, g: 23000000 }, { lvl: 22, f: 95000000, g: 30000000 }, { lvl: 23, f: 120000000, g: 38000000 }, { lvl: 24, f: 150000000, g: 48000000 }, { lvl: 25, f: 250000000, g: 81000000 }, { lvl: 26, f: 350000000, g: 110000000 }, { lvl: 27, f: 460000000, g: 150000000 }, { lvl: 28, f: 640000000, g: 210000000 }, { lvl: 29, f: 900000000, g: 290000000 }, { lvl: 30, f: 1300000000, g: 400000000 }, { lvl: 31, f: 1400000000, g: 440000000 }, { lvl: 32, f: 1500000000, g: 490000000 }, { lvl: 33, f: 1700000000, g: 540000000 }, { lvl: 34, f: 1800000000, g: 570000000 }, { lvl: 35, f: 1900000000, g: 590000000 },
];

export interface T10Levels {
    t10Protection: number;
    t10Hp: number;
    t10Atk: number;
    t10Def: number;
    t10Elite?: number;
    barracksLevel?: number;
    techLevel?: number;
}

export const calculateT10RemainingCost = (p: T10Levels) => {
    const sumRemaining = (currentLevel: number, costArray: number[]) => {
        if (currentLevel >= 10) return 0;
        return costArray.slice(currentLevel).reduce((a, b) => a + b, 0);
    };

    const prot = Number(p.t10Protection) || 0;
    const hp = Number(p.t10Hp) || 0;
    const atk = Number(p.t10Atk) || 0;
    const def = Number(p.t10Def) || 0;
    const elite = Number(p.t10Elite) || 0;

    let gold = 0, valor = 0, foodIron = 0;

    gold += sumRemaining(prot, T10_COSTS.advProt.gold);
    valor += sumRemaining(prot, T10_COSTS.advProt.valor);
    foodIron += sumRemaining(prot, T10_COSTS.advProt.foodIron);

    gold += sumRemaining(hp, T10_COSTS.boost3.gold);
    valor += sumRemaining(hp, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(hp, T10_COSTS.boost3.foodIron);

    gold += sumRemaining(atk, T10_COSTS.boost3.gold);
    valor += sumRemaining(atk, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(atk, T10_COSTS.boost3.foodIron);

    gold += sumRemaining(def, T10_COSTS.boost3.gold);
    valor += sumRemaining(def, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(def, T10_COSTS.boost3.foodIron);

    if (elite < 10) {
        gold += T10_COSTS.unlock.gold;
        valor += T10_COSTS.unlock.valor;
        foodIron += T10_COSTS.unlock.foodIron;
    }

    const TARGET_LEVEL = 30;
    const calculateBuildingCost = (currentLvl: number, data: {lvl: number, f: number, g: number}[]) => {
        let bGold = 0, bFood = 0;
        const startIdx = Math.max(0, currentLvl);
        const endIdx = TARGET_LEVEL;
        if (currentLvl >= TARGET_LEVEL) return { bGold: 0, bFood: 0 };
        const needed = data.slice(startIdx, endIdx);
        needed.forEach(item => { bGold += item.g; bFood += item.f; });
        return { bGold, bFood };
    };

    const barracksCost = calculateBuildingCost(Number(p.barracksLevel) || 0, BARRACKS_DATA);
    const techCenterCost = calculateBuildingCost(Number(p.techLevel) || 0, TECH_CENTER_DATA);
    gold += barracksCost.bGold + techCenterCost.bGold;
    foodIron += barracksCost.bFood + techCenterCost.bFood;

    return { gold, valor, foodIron };
};

export const calculateStsRemainingCost = (p: any) => {
    let gold = 0, valor = 0, foodIron = 0;
    const sum = (curr: number, map: any) => {
        let g = 0, f = 0, v = 0;
        for (let i = Number(curr) + 1; i <= 10; i++) {
            let k = i <= 3 ? 'lv1_3' : i <= 6 ? 'lv4_6' : 'lv7_10';
            if (map['lv'+i]) k = 'lv'+i;
            g += map[k].g; f += map[k].f; v += map[k].v;
        }
        return { g, f, v };
    };
    const add = (r: any) => { gold += r.g; foodIron += r.f; valor += r.v; };
    const t1 = { lv1: {g:33.65e6,f:11.1e6,v:400}, lv2: {g:33.65e6,f:11.1e6,v:400}, lv3: {g:33.6e6,f:11.6e6,v:400}, lv4_6: {g:47.07e6,f:15.7e6,v:550}, lv7_10: {g:61.25e6,f:20.42e6,v:700} };
    const t2 = { lv1_3: {g:33.6e6,f:11.6e6,v:400}, lv4_6: {g:47.07e6,f:15.7e6,v:550}, lv7_10: {g:61.25e6,f:20.42e6,v:700} };
    const t4 = { lv1_3: {g:61.25e6,f:20.42e6,v:700}, lv4_6: {g:76.56e6,f:25.52e6,v:900}, lv7_10: {g:95.7e6,f:31.9e6,v:1100} };
    const t6 = { lv1_3: {g:76.56e6,f:25.52e6,v:900}, lv4_6: {g:95.7e6,f:31.9e6,v:1100}, lv7_10: {g:162.7e6,f:54.23e6,v:1850} };
    const t7 = { lv1_3: {g:95.7e6,f:31.9e6,v:1100}, lv4_6: {g:162.7e6,f:54.23e6,v:1850}, lv7_10: {g:227.78e6,f:75.93e6,v:2550} };
    add(sum(p.stsPowerBoost1, t1));
    add(sum(p.stsFinalStand1, t2)); add(sum(p.stsFierceAssault1, t2)); add(sum(p.stsVigilantFormation1, t2));
    if (Number(p.stsExtraDrillGround||0)<1) { gold+=61.25e6; foodIron+=20.42e6; valor+=700; }
    add(sum(p.stsBarrackExpansion1, t4)); add(sum(p.stsFocusedTraining1, t4));
    add(sum(p.stsFinalStand2, t4)); add(sum(p.stsFierceAssault2, t4)); add(sum(p.stsVigilantFormation2, t4));
    add(sum(p.stsDrillGroundExpansion, t6)); add(sum(p.stsRapidMarch1, t6));
    add(sum(p.stsFinalStand3, t7)); add(sum(p.stsFierceAssault3, t7)); add(sum(p.stsVigilantFormation3, t7));
    add(sum(p.stsFatalStrike1, t7));
    return { gold, valor, foodIron };
};

export const calculateMasteryRemainingCost = (p: any, prefix: 'Air' | 'Tank' | 'Missile') => {
    let gold = 0, valor = 0, foodIron = 0;
    
    const costs10 = [
        { f: 21.66e6, g: 65e6, v: 1500 }, // 1
        { f: 21.66e6, g: 65e6, v: 1500 }, // 2
        { f: 30.28e6, g: 91.05e6, v: 1690 }, // 3
        { f: 30.28e6, g: 91.05e6, v: 1690 }, // 4
        { f: 39.48e6, g: 118.44e6, v: 1880 }, // 5
        { f: 39.48e6, g: 118.44e6, v: 1880 }, // 6
        { f: 55.27e6, g: 165.82e6, v: 2070 }, // 7
        { f: 55.27e6, g: 165.82e6, v: 2070 }, // 8
        { f: 77.38e6, g: 232.15e6, v: 2250 }, // 9
        { f: 77.38e6, g: 232.15e6, v: 2250 }, // 10
    ];

    const costs5 = [
        { f: 21.66e6, g: 65e6, v: 1500 }, // 1
        { f: 30.28e6, g: 91.05e6, v: 1690 }, // 2
        { f: 39.48e6, g: 118.44e6, v: 1880 }, // 3
        { f: 55.27e6, g: 165.82e6, v: 2070 }, // 4
        { f: 77.38e6, g: 232.15e6, v: 2250 }, // 5
    ];

    const sumRemaining = (current: number, costs: any[]) => {
        let g = 0, f = 0, v = 0;
        for (let i = Number(current); i < costs.length; i++) {
            g += costs[i].g; f += costs[i].f; v += costs[i].v;
        }
        return { g, f, v };
    };

    const add = (r: any) => { gold += r.g; foodIron += r.f; valor += r.v; };

    add(sumRemaining(p[`mastery${prefix}Hp1`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Atk1`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Def1`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Damage1`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}March1`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}Hp2`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Atk2`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Def2`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Damage2`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}UltDef1`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Hp3`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Atk3`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Def3`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Damage3`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}March2`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}Hp4`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Atk4`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Def4`] || 0, costs10));
    add(sumRemaining(p[`mastery${prefix}Damage4`] || 0, costs5));
    add(sumRemaining(p[`mastery${prefix}UltDef2`] || 0, costs10));

    return { gold, valor, foodIron };
};

export const calculateAirMasteryRemainingCost = (p: any) => calculateMasteryRemainingCost(p, 'Air');
export const calculateTankMasteryRemainingCost = (p: any) => calculateMasteryRemainingCost(p, 'Tank');
export const calculateMissileMasteryRemainingCost = (p: any) => calculateMasteryRemainingCost(p, 'Missile');