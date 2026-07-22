/* ========================================
   map.js — 地图系统
   地图生成、节点选择、楼层推进
   ======================================== */

import { FLOW_CONFIG, NODE_TYPES, ENEMIES } from './config.js';
import { gameState } from './state.js';
import { randomChoice, updateBattleLog, updateUI, closeModal } from './utils.js';
import { startBattle } from './battle.js';
import { triggerRandomEvent } from './events.js';
import { showPartnerModal } from './partner.js';
import { showShopModal } from './shop.js';
import { saveGame } from './save.js';
import { checkVictory } from './game-end.js';

export function initMap() {
    gameState.mapNodes = [];
    gameState.nodeIndex = 0;
    const total = FLOW_CONFIG.nodesPerFloor;

    const nodeTypesByIndex = (i) => {
        if (i === 0) return NODE_TYPES.BATTLE;
        if (i === total - 1) return NODE_TYPES.BOSS;
        if (i === Math.floor(total / 2)) return NODE_TYPES.ELITE;
        const rand = Math.random();
        const nearBoss = (i >= total - 3);
        const battleWeight = nearBoss ? 0.35 : 0.55;
        const eliteExtra = 0.05, eventWeight = 0.18;
        const restWeight = nearBoss ? 0.25 : 0.12;
        const shopWeight = nearBoss ? 0.15 : 0.10;
        if (rand < battleWeight) return NODE_TYPES.BATTLE;
        if (rand < battleWeight + eliteExtra) return NODE_TYPES.ELITE;
        if (rand < battleWeight + eliteExtra + eventWeight) return NODE_TYPES.EVENT;
        if (rand < battleWeight + eliteExtra + eventWeight + restWeight) return NODE_TYPES.REST;
        return NODE_TYPES.SHOP;
    };

    for (let i = 0; i < total; i++) {
        gameState.mapNodes.push({ index: i, type: nodeTypesByIndex(i), visited: false, floor: gameState.floor });
    }
}

export function showMapModal() {
    const modal = document.getElementById('map-modal');
    const nodesContainer = document.getElementById('map-nodes');
    nodesContainer.innerHTML = '';
    const typeNames = { [NODE_TYPES.BATTLE]: '战斗', [NODE_TYPES.ELITE]: '精英', [NODE_TYPES.BOSS]: 'BOSS', [NODE_TYPES.EVENT]: '事件', [NODE_TYPES.REST]: '驿站', [NODE_TYPES.SHOP]: '商店' };
    gameState.mapNodes.forEach((node, index) => {
        const marker = node.visited ? '✓' : (index === gameState.nodeIndex ? '→' : '·');
        const div = document.createElement('div');
        div.className = 'event-option';
        div.style.cssText = 'text-align:left; cursor:default;';
        div.innerHTML = `<strong>${marker} 第 ${index + 1} 节点</strong> <span style="color:#aaa">${typeNames[node.type] || '?'}</span>`;
        nodesContainer.appendChild(div);
    });
    modal.classList.remove('hidden');
}

export function showNextNode() {
    const nextIndex = gameState.mapNodes.findIndex(n => !n.visited);
    if (nextIndex === -1) { if (checkFloorComplete()) advanceFloor(); return; }
    gameState.nodeIndex = nextIndex;
    const node = gameState.mapNodes[nextIndex];

    const modal = document.getElementById('map-modal');
    modal.querySelector('h2').textContent = `第 ${gameState.floor} 层 · 第 ${nextIndex + 1} 节点`;
    const typeName = { [NODE_TYPES.BATTLE]: '⚔️ 普通战斗', [NODE_TYPES.ELITE]: '💀 精英战斗', [NODE_TYPES.BOSS]: '👹 BOSS 战斗', [NODE_TYPES.EVENT]: '❓ 随机事件', [NODE_TYPES.REST]: '🏕️ 驿站休息', [NODE_TYPES.SHOP]: '🏪 商店补给' }[node.type] || '?';
    const nodesContainer = document.getElementById('map-nodes');
    nodesContainer.innerHTML = '';
    const desc = document.createElement('p');
    desc.style.marginBottom = '14px';
    desc.innerHTML = `即将进入：<strong>${typeName}</strong>`;
    nodesContainer.appendChild(desc);
    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-primary';
    goBtn.textContent = '前往节点';
    goBtn.onclick = () => { closeModal('map-modal'); handleNodeSelection(nextIndex); };
    nodesContainer.appendChild(goBtn);
    modal.classList.remove('hidden');
}

export function handleNodeSelection(index) {
    const node = gameState.mapNodes[index];
    if (!node) return;
    gameState.nodeIndex = index;

    switch (node.type) {
        case NODE_TYPES.BATTLE: startBattle(randomChoice(ENEMIES.common)); break;
        case NODE_TYPES.ELITE:  startBattle(randomChoice(ENEMIES.elite)); break;
        case NODE_TYPES.BOSS:   startBattle(randomChoice(ENEMIES.boss)); break;
        case NODE_TYPES.EVENT:  triggerRandomEvent(); break;
        case NODE_TYPES.REST:
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + 25);
            gameState.mp = Math.min(gameState.maxMp, gameState.mp + 25);
            updateBattleLog(`🏕️ 驿站休息！HP/MP 各恢复 25 点。`);
            showPartnerModal();
            break;
        case NODE_TYPES.SHOP: showShopModal(); break;
    }
    updateUI();
}

export function checkFloorComplete() {
    return gameState.mapNodes.length > 0 && gameState.mapNodes.every(node => node.visited);
}

export function advanceFloor() {
    if (gameState.floor >= FLOW_CONFIG.totalFloors) {
        updateBattleLog(`🏆 你已征服全部 ${FLOW_CONFIG.totalFloors} 层！`);
        checkVictory();
        return;
    }
    gameState.floor++;
    initMap();
    updateBattleLog(`🏰 进入第 ${gameState.floor} 层！`);
    updateUI();
    saveGame();
    setTimeout(() => showNextNode(), 600);
}

export function continueAfterNonBattle() {
    ['event-modal', 'partner-modal', 'investment-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && !m.classList.contains('hidden')) m.classList.add('hidden');
    });
    const currentNode = gameState.mapNodes[gameState.nodeIndex];
    if (currentNode && !currentNode.visited) currentNode.visited = true;
    saveGame();
    if (checkVictory()) return;
    if (checkFloorComplete()) { advanceFloor(); return; }
    showNextNode();
}
