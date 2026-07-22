/* ========================================
   cards.js — 卡牌系统
   初始化、抽牌、出牌、效果结算、变招/追击
   ======================================== */

import { CARDS, CARD_UPGRADES, BATTLE_CONFIG, GAUGE_CONFIG, CARD_SPEEDS } from './config.js';
import { gameState } from './state.js';
import { randomInt, rollDice, shuffleArray, updateBattleLog, updateUI } from './utils.js';
import { renderHandRTWP, endBattle } from './battle.js';
import { checkGameOver } from './game-end.js';

// --- 卡组初始化 ---

export function initDeck() {
    gameState.deck = [];
    CARDS.attackCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_atk_${Math.random().toString(36).slice(2, 8)}` });
    });
    CARDS.defenseCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_def_${Math.random().toString(36).slice(2, 8)}` });
    });
    CARDS.functionCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_fun_${Math.random().toString(36).slice(2, 8)}` });
    });
    CARDS.workCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_wor_${Math.random().toString(36).slice(2, 8)}` });
    });
}

// --- 变招 / 追击 ---

export function attachUpgradeToCard(targetCard, upgradeId) {
    if (!targetCard) return false;
    if (!CARD_UPGRADES[upgradeId]) return false;
    if (!targetCard.upgrades) targetCard.upgrades = [];
    if (targetCard.upgrades.includes(upgradeId)) return false;
    targetCard.upgrades.push(upgradeId);
    const def = CARD_UPGRADES[upgradeId];
    updateBattleLog(`📜 卡牌 [${targetCard.name}] 习得 [${def.name}]！${def.effect}`);
    return true;
}

export function shouldTriggerUpgrade(upgrade, ctx) {
    if (!upgrade) return false;
    switch (upgrade.trigger) {
        case 'usage_2':  return ctx.usageCount >= 2;
        case 'dupe_2':   return ctx.dupesInHand >= 2;
        case 'hp_le_20': return ctx.inFinisherState;
        case 'per_use':  return true;
        default:         return false;
    }
}

export function aggregateUpgradeEffects(card) {
    if (!card.upgrades || card.upgrades.length === 0) return null;
    const upgrades = card.upgrades.map(uid => CARD_UPGRADES[uid]).filter(Boolean);
    if (upgrades.length === 0) return null;

    const usageCount = gameState.cardUsageCount[card.id] || 0;
    const dupesInHand = gameState.hand.filter(c => c.id === card.id && c !== card).length;
    const inFinisherState = gameState.isFinisherState === true;

    const fired = [];
    for (const u of upgrades) {
        if (shouldTriggerUpgrade(u, { usageCount, dupesInHand, inFinisherState })) {
            fired.push(u);
        }
    }
    if (fired.length === 0) return null;

    const agg = { damageBonus: 0, damageMul: 1, ignoreShield: false, splash: false, bleed: 0, armorBreak: false, echo: false, costReduction: 0, labels: [] };
    for (const u of fired) {
        const eff = u.apply({});
        agg.labels.push(u.name);
        if (eff.damageBonus) agg.damageBonus += eff.damageBonus;
        if (eff.damageMul && eff.damageMul !== 1) agg.damageMul *= eff.damageMul;
        if (eff.ignoreShield) agg.ignoreShield = true;
        if (eff.splash) agg.splash = true;
        if (eff.bleed) agg.bleed = Math.max(agg.bleed, eff.bleed);
        if (eff.armorBreak) agg.armorBreak = true;
        if (eff.echo) agg.echo = true;
        if (eff.costReduction) agg.costReduction = Math.max(agg.costReduction, eff.costReduction);
    }
    return agg;
}

export function renderUpgradeChips(card) {
    if (!card.upgrades || card.upgrades.length === 0) return '';
    const visible = card.upgrades.slice(0, 2);
    const overflow = card.upgrades.length - visible.length;
    let html = visible.map(uid => {
        const u = CARD_UPGRADES[uid];
        if (!u) return '';
        return `<span class="upgrade-chip ${u.kind}">${u.name.replace(/^(变招|追击)·/, '')}</span>`;
    }).join('');
    if (overflow > 0) html += `<span class="upgrade-chip upgrade-chip-more">+${overflow}</span>`;
    return html;
}

// --- 抽牌 ---

export function drawCards(count) {
    for (let i = 0; i < count; i++) {
        if (gameState.drawPile.length === 0) {
            gameState.drawPile = [...gameState.discardPile];
            gameState.discardPile = [];
            shuffleArray(gameState.drawPile);
        }
        if (gameState.drawPile.length > 0) {
            gameState.hand.push(gameState.drawPile.pop());
        }
    }
    renderHandRTWP();
}

export function discardHand() {
    gameState.discardPile.push(...gameState.hand);
    gameState.hand = [];
    renderHandRTWP();
}

export function renderHand() {
    if (typeof renderHandRTWP === 'function') renderHandRTWP();
}

// --- 出牌 ---

export function canUseCard(card) {
    if (card.costHp && gameState.hp < card.costHp) return false;
    if (card.costMp && gameState.mp < card.costMp) return false;
    if (card.costGold && gameState.gold < card.costGold) return false;
    if (card.costSkill && gameState.skill < card.costSkill) return false;
    if (card.costAuthority && gameState.authority < card.costAuthority) return false;
    return true;
}

export function playCard(index) {
    // 委托给 RTWP 版本（在 battle.js 中定义）
    if (typeof playCardRTWP === 'function') playCardRTWP(index);
}

// --- 卡牌效果结算 ---

export function executeCardEffect(card) {
    const logMessages = [];

    let damageMultiplier = 1;
    let shieldMultiplier = 1;
    if (gameState.partner && gameState.partnerStage === 3) {
        const blessing = gameState.partner.blessing;
        if (blessing.damageBoost) damageMultiplier += blessing.damageBoost;
        if (blessing.shieldBoost) shieldMultiplier += blessing.shieldBoost;
        if (gameState.partnerDarkMode && blessing.damageBoost) damageMultiplier += blessing.damageBoost;
    }
    if (gameState.tempDamageBoost > 0) damageMultiplier += gameState.tempDamageBoost;

    switch (card.type) {
        case 'attack': {
            const playerDice = rollDice(BATTLE_CONFIG.playerDiceMin, BATTLE_CONFIG.playerDiceMax);
            gameState.playerDiceResult = playerDice;
            const enemyDice = rollDice(BATTLE_CONFIG.enemyDiceMin, BATTLE_CONFIG.enemyDiceMax);
            gameState.enemyDiceResult = enemyDice;
            const skillBonus = 1 + gameState.skill / 200;
            const diceMul = ({1: 0.5, 2: 1, 3: 1, 4: 1.5, 5: 2, 6: 3})[playerDice] || 1;
            const totalMult = damageMultiplier * skillBonus * (1 + gameState.tempDamageBoost) * diceMul;
            let damage = Math.floor(card.damage * totalMult);

            const upgradeAgg = aggregateUpgradeEffects(card);
            if (upgradeAgg) {
                if (upgradeAgg.damageMul !== 1) damage = Math.floor(damage * upgradeAgg.damageMul);
                if (upgradeAgg.damageBonus > 0) damage = Math.floor(damage * (1 + upgradeAgg.damageBonus));
                logMessages.push(`🔄 ${upgradeAgg.labels.join(' + ')} 发动！${upgradeAgg.damageBonus > 0 ? `伤害 +${Math.round(upgradeAgg.damageBonus * 100)}%` : ''}${upgradeAgg.ignoreShield ? '（无视护盾）' : ''}${upgradeAgg.splash ? '（溅射）' : ''}${upgradeAgg.armorBreak ? '（破甲）' : ''}`);
            }

            const critChance = gameState.achievement / 20;
            if (Math.random() < critChance) damage = Math.floor(damage * 2);

            if (gameState.currentEnemy && gameState.currentEnemy.currentHp > 0) {
                if (gameState.currentEnemy.currentHp / gameState.currentEnemy.hp <= 0.2) {
                    gameState.isFinisherState = true;
                }
            }

            const enemyWasAlive = gameState.currentEnemy && gameState.currentEnemy.currentHp > 0;
            if (gameState.currentEnemy) {
                gameState.currentEnemy.currentHp = Math.max(0, gameState.currentEnemy.currentHp - damage);
            }

            if (upgradeAgg && upgradeAgg.bleed > 0 && gameState.currentEnemy && gameState.currentEnemy.currentHp > 0) {
                gameState.currentEnemy.bleed = (gameState.currentEnemy.bleed || 0) + upgradeAgg.bleed;
                logMessages.push(`🩸 目标被挂上流血（${upgradeAgg.bleed} 回合）`);
            }
            if (upgradeAgg && upgradeAgg.armorBreak && gameState.currentEnemy) {
                gameState.currentEnemy.armorBroken = (gameState.currentEnemy.armorBroken || 0) + 1;
                logMessages.push(`🛡️‍💥 目标被破甲（${gameState.currentEnemy.armorBroken} 层）`);
            }

            logMessages.push(`🎲 你的骰子: ${playerDice}（×${diceMul}），敌人骰子: ${enemyDice}`);
            logMessages.push(`⚔️ ${card.name}！对敌人造成 ${damage} 点伤害！`);

            if (enemyWasAlive && gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0 && gameState.isFinisherState) {
                logMessages.push(`✨ 完美终结！`);
                gameState.perfectFinishers.push({ name: gameState.currentEnemy.name, at: Date.now() });
            }

            gameState.cardUsageCount[card.id] = (gameState.cardUsageCount[card.id] || 0) + 1;

            if (upgradeAgg && upgradeAgg.echo && !gameState._echoedThisTurn?.[card.id]) {
                gameState._echoedThisTurn = (gameState._echoedThisTurn || {});
                gameState._echoedThisTurn[card.id] = true;
                gameState.hand.push({ ...card, _isEcho: true });
                renderHandRTWP();
                logMessages.push(`🔁 追击·回响：${card.name} 可再使用 1 次（不消耗行动点）`);
            }

            if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) {
                endBattle(true);
            }
            break;
        }
        case 'defense': {
            const defUpg = aggregateUpgradeEffects(card);
            if (defUpg) logMessages.push(`🔄 ${defUpg.labels.join(' + ')} 发动！`);
            let shield = card.shield ? Math.floor(card.shield * shieldMultiplier) : 0;
            if (defUpg && defUpg.damageBonus > 0) shield = Math.floor(shield * (1 + defUpg.damageBonus));
            gameState.playerShield += shield;

            if (card.immuneSmall) {
                logMessages.push(`🛡️ 意志坚定！本回合免疫小额伤害！`);
                gameState.immuneSmallAttack = true;
            }
            if (card.healHp) {
                gameState.hp = Math.min(gameState.hp + card.healHp, gameState.maxHp);
                logMessages.push(`❤️ 恢复 ${card.healHp} 点血条！`);
            }
            logMessages.push(`🛡️ 获得 ${shield} 点护盾！`);
            if (defUpg && defUpg.echo && !gameState._echoedThisTurn?.[card.id]) {
                gameState._echoedThisTurn = (gameState._echoedThisTurn || {});
                gameState._echoedThisTurn[card.id] = true;
                gameState.hand.push({ ...card, _isEcho: true });
                renderHandRTWP();
                logMessages.push(`🔁 追击·回响：${card.name} 可再使用 1 次`);
            }
            break;
        }
        case 'function': {
            if (card.drawCards) { drawCards(card.drawCards); logMessages.push(`📚 额外抽 ${card.drawCards} 张牌！`); }
            if (card.healHp) { gameState.hp = Math.min(gameState.hp + card.healHp, gameState.maxHp); logMessages.push(`❤️ 恢复 ${card.healHp} 点血条！`); }
            if (card.healMp) { gameState.mp = Math.min(gameState.mp + card.healMp, gameState.maxMp); logMessages.push(`💙 恢复 ${card.healMp} 点蓝条！`); }
            if (card.damageBoost) { gameState.tempDamageBoost += card.damageBoost; logMessages.push(`⚡ 本回合伤害 +${Math.floor(card.damageBoost * 100)}%！`); }
            if (card.gaugeRegenBoost) { gameState.gaugeRegenBoost += card.gaugeRegenBoost; logMessages.push(`⚡ 行动槽回复速度 +${Math.round(card.gaugeRegenBoost * 100)}%！`); }
            if (card.blockNext) { gameState.blockNextEnemyAttack = true; logMessages.push(`🛡️ 抵挡一次敌人大招！`); }
            break;
        }
        case 'work': {
            let goldGain = card.gold || 0;
            if (gameState.partner && gameState.partnerStage === 3 && gameState.partner.blessing.goldBoost) {
                goldGain = Math.floor(goldGain * (1 + gameState.partner.blessing.goldBoost));
            }
            gameState.gold += goldGain;
            gameState.skill += card.skill || 0;
            gameState.achievement += card.achievement || 0;
            gameState.authority += card.authority || 0;

            logMessages.push(`💼 ${card.name}！`);
            logMessages.push(`💰 +${goldGain} 金币 | ⚡ +${card.skill || 0} 技能 | ✨ +${card.achievement || 0} 成就感 | 👑 +${card.authority || 0} 权威`);

            const workPlayerDice = rollDice() + Math.floor(gameState.skill / 10);
            const workEnemyDice = rollDice();
            if (workPlayerDice > workEnemyDice) {
                const bonusDamage = (workPlayerDice - workEnemyDice) * 3;
                if (gameState.currentEnemy) {
                    gameState.currentEnemy.currentHp -= bonusDamage;
                    logMessages.push(`🎲 工作判定胜利！额外造成 ${bonusDamage} 点伤害！`);
                }
            }
            if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) {
                endBattle(true);
            }
            break;
        }
    }

    updateBattleLog(logMessages.join('<br>'));
}

// --- 伤害管线 ---

export function applyDamageToPlayer(rawDamage) {
    let damage = rawDamage;

    const authorityReduction = Math.min(0.5, gameState.authority / 1500);
    const reducedDamage = damage * (1 - authorityReduction);
    const absorbedByAuthority = damage - reducedDamage;
    if (absorbedByAuthority > 0) {
        const log = document.getElementById('battle-log');
        if (log) log.innerHTML += `<br>👑 影响力抵消 ${Math.round(absorbedByAuthority)} 点伤害（${(authorityReduction * 100).toFixed(1)}% 减伤）`;
    }
    damage = reducedDamage;

    if (damage > 0 && gameState.immuneSmallAttack && damage <= 5) {
        updateBattleLog(`🛡️ 意志坚定！免疫了 ${Math.ceil(damage)} 点小额伤害！`);
        gameState.immuneSmallAttack = false;
        damage = 0;
    }

    if (damage > 0 && gameState.playerShield > 0) {
        const shieldAbsorb = Math.min(gameState.playerShield, damage);
        gameState.playerShield -= shieldAbsorb;
        damage -= shieldAbsorb;
    }

    if (damage > 0) {
        gameState.hp = Math.max(0, gameState.hp - Math.ceil(damage));
    }

    updateUI();
    checkGameOver();
}

// --- 行动槽相关 ---

export function getCardGaugeCost(card) {
    const speed = CARD_SPEEDS[card.id] || 'medium';
    const costs = { fast: GAUGE_CONFIG.CARD_COST_FAST, medium: GAUGE_CONFIG.CARD_COST_MEDIUM, slow: GAUGE_CONFIG.CARD_COST_SLOW };
    let cost = costs[speed] || GAUGE_CONFIG.CARD_COST_MEDIUM;
    const agg = aggregateUpgradeEffects(card);
    if (agg && agg.costReduction > 0) {
        cost = Math.max(GAUGE_CONFIG.MIN_GAUGE_TO_ACT, Math.floor(cost * (1 - agg.costReduction)));
    }
    return cost;
}

export function deductCardCosts(card) {
    if (card._isEcho === true) return;
    const costReduction = (() => {
        const probe = aggregateUpgradeEffects(card);
        return probe?.costReduction || 0;
    })();
    const applyReduced = (val) => Math.max(1, Math.floor(val * (1 - costReduction)));
    if (card.costHp) gameState.hp = Math.max(0, gameState.hp - applyReduced(card.costHp));
    if (card.costMp) gameState.mp = Math.max(0, gameState.mp - applyReduced(card.costMp));
    if (card.costGold) gameState.gold -= Math.max(1, Math.floor(card.costGold * (1 - costReduction)));
    if (card.costSkill) gameState.skill -= Math.max(1, Math.floor(card.costSkill * (1 - costReduction)));
    if (card.costAuthority) gameState.authority -= Math.max(1, Math.floor(card.costAuthority * (1 - costReduction)));
}

export function recalcMaxGauge() {
    gameState.rtwp.playerMaxGauge = GAUGE_CONFIG.MAX_GAUGE
        + Math.floor(gameState.achievement * GAUGE_CONFIG.ACHIEVEMENT_GAUGE_SCALE);
    if (gameState.rtwp.playerMaxGauge > GAUGE_CONFIG.MAX_GAUGE_CAP) {
        gameState.rtwp.playerMaxGauge = GAUGE_CONFIG.MAX_GAUGE_CAP;
    }
}
