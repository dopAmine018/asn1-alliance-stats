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

export interface T10Levels {
    t10Protection: number;
    t10Hp: number;
    t10Atk: number;
    t10Def: number;
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

    return { gold, valor, foodIron };
};
