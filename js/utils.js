/* ========================================
   utils.js — 工具函数、UI 更新、战斗日志
   ======================================== */

import { gameState } from './state.js';

export let _pendingLogMessages = [];

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function rollDice(min = 1, max = 6) {
    return randomInt(min, max);
}

export function updateUI() {
    document.getElementById('hp-bar').style.width = `${(gameState.hp / gameState.maxHp) * 100}%`;
    document.getElementById('hp-text').textContent = `${gameState.hp}/${gameState.maxHp}`;
    document.getElementById('mp-bar').style.width = `${(gameState.mp / gameState.maxMp) * 100}%`;
    document.getElementById('mp-text').textContent = `${gameState.mp}/${gameState.maxMp}`;
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('skill').textContent = gameState.skill;
    document.getElementById('achievement').textContent = gameState.achievement;
    document.getElementById('authority').textContent = gameState.authority;
    document.getElementById('floor').textContent = gameState.floor;
}

export function updateBattleLog(message) {
    _pendingLogMessages.push(message);
    const log = document.getElementById('battle-log');
    if (log) log.innerHTML = _pendingLogMessages.slice(-8).join('<br>');
}

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function getCardCostText(card) {
    const costs = [];
    if (card.costHp) costs.push(`❤️${card.costHp}`);
    if (card.costMp) costs.push(`💙${card.costMp}`);
    if (card.costGold) costs.push(`💰${card.costGold}`);
    if (card.costSkill) costs.push(`⚡${card.costSkill}`);
    if (card.costAuthority) costs.push(`👑${card.costAuthority}`);
    if (costs.length === 0) return '0';
    return costs.join(' ');
}

export function getCardTypeName(type) {
    const names = { attack: '攻击', defense: '防御', function: '功能', work: '工作' };
    return names[type] || type;
}

export function isActionCard(card) {
    if (!card) return false;
    return ['attack', 'defense', 'function'].includes(card.type);
}

export function triggerLabel(t) {
    return ({
        usage_2:  '本场战斗内累计使用 ≥ 2 次',
        dupe_2:   '出牌时手牌同名 ≥ 2 张',
        hp_le_20: '怪物进入终结态（HP ≤ 20%）',
        per_use:  '每次使用都生效'
    })[t] || t;
}

export function formatEnemyIntent(action, enemy) {
    switch (action.type) {
        case 'attack':        return `⚔️ 攻击 (${Math.ceil(enemy.damage * (action.damageMul || 1.0))} 伤害)`;
        case 'attack_heavy':  return `💀 重击 (${Math.ceil(enemy.damage * (action.damageMul || 2.0))} 伤害)`;
        case 'attack_multi':  return `⚔️ ${action.hits || 3}连击`;
        case 'attack_debuff': return `🔮 心灵压制 (-1权威)`;
        case 'attack_shield_break': return `💥 破盾攻击`;
        case 'attack_reduce_shield': return `🔻 削弱护盾`;
        case 'defend':        return `🛡️ 防御`;
        case 'howl':          return `🐺 嚎叫`;
        case 'special':       return `✨ 特殊技能`;
        default:              return `...`;
    }
}

export function formatActionType(type) {
    const map = {
        attack: '攻击', attack_heavy: '重击', attack_multi: '多重攻击',
        attack_debuff: '心灵压制', attack_shield_break: '破盾攻击', attack_reduce_shield: '削弱护盾',
        defend: '防御', howl: '嚎叫', special: '特殊技能'
    };
    return map[type] || type;
}

export function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}
