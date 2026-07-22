/* ========================================
   save.js — 存档系统 + 启动屏
   ======================================== */

import { SAVE_KEY, SAVE_VERSION, GAUGE_CONFIG } from './config.js';
import { gameState, resetGameStateData } from './state.js';
import { updateUI, updateBattleLog } from './utils.js';
import { showEnemy, renderHandRTWP } from './battle.js';
import { initDeck } from './cards.js';
import { initMap, showNextNode } from './map.js';
import { initPartner } from './partner.js';

export function saveGame() {
    try {
        const saveData = {
            saveVersion: SAVE_VERSION, saveTime: Date.now(),
            hp: gameState.hp, maxHp: gameState.maxHp, mp: gameState.mp, maxMp: gameState.maxMp,
            gold: gameState.gold, skill: gameState.skill, achievement: gameState.achievement, authority: gameState.authority,
            floor: gameState.floor, nodeIndex: gameState.nodeIndex, nodesPerFloor: gameState.nodesPerFloor,
            mapNodes: gameState.mapNodes, layerBossSeed: gameState.layerBossSeed,
            inBattle: gameState.inBattle, currentEnemy: gameState.currentEnemy,
            playerShield: gameState.playerShield, playerDiceResult: gameState.playerDiceResult,
            enemyDiceResult: gameState.enemyDiceResult, blockNextEnemyAttack: gameState.blockNextEnemyAttack,
            isFinisherState: gameState.isFinisherState, tempDamageBoost: gameState.tempDamageBoost,
            gaugeRegenBoost: gameState.gaugeRegenBoost, immuneSmallAttack: gameState.immuneSmallAttack,
            deck: gameState.deck, hand: gameState.hand, drawPile: gameState.drawPile, discardPile: gameState.discardPile,
            cardUsageCount: gameState.cardUsageCount,
            partner: gameState.partner, partnerStage: gameState.partnerStage,
            partnerSatisfaction: gameState.partnerSatisfaction, partnerDarkMode: gameState.partnerDarkMode,
            triggeredEvents: gameState.triggeredEvents, perfectFinishers: gameState.perfectFinishers
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) { console.error('保存失败：', e); }
}

export function hasSave() { return !!localStorage.getItem(SAVE_KEY); }

export function loadGame() {
    const saveStr = localStorage.getItem(SAVE_KEY);
    if (!saveStr) return false;
    try {
        const saveData = JSON.parse(saveStr);
        if (saveData.saveVersion && !String(saveData.saveVersion).startsWith(SAVE_VERSION.split('-')[0])) {
            console.warn('存档版本不一致：', saveData.saveVersion, 'vs', SAVE_VERSION);
            return false;
        }
        Object.assign(gameState, saveData);
        gameState.saveVersion = SAVE_VERSION;
        if (!gameState.rtwp) {
            gameState.rtwp = {
                battleActive: false, paused: false, lastTimestamp: 0, tickAccumulator: 0, timeSpeed: 1.0,
                playerGauge: Math.floor(GAUGE_CONFIG.MAX_GAUGE * 0.7), playerMaxGauge: GAUGE_CONFIG.MAX_GAUGE,
                castingCard: null, castStartMs: 0, castDurationMs: 0, castProgressMs: 0, castInterrupted: false,
                pendingActions: [], cardDrawTimer: 0, enemyGauge: 0, enemyActionThreshold: 100,
                enemyCurrentAction: null, enemyCastProgress: 0, enemyIntent: null,
                _enemyDamageBoost: 0, _enemyTurnCounter: 0, _gaugeFullPaused: false,
            };
        }
        if (!gameState._echoedThisTurn) gameState._echoedThisTurn = {};
        if (gameState.gaugeRegenBoost === undefined) gameState.gaugeRegenBoost = 0;
        updateUI();
        return true;
    } catch (e) { console.error('读取失败：', e); return false; }
}

export function showStartModal() {
    const modal = document.getElementById('start-modal');
    if (modal) modal.classList.remove('hidden');
}

export function bindStartModal() {
    const modal = document.getElementById('start-modal');
    if (!modal) return;

    const continueBtn = document.getElementById('btn-continue');
    const newBtn = document.getElementById('btn-new-game');

    if (hasSave()) {
        const saveData = JSON.parse(localStorage.getItem(SAVE_KEY));
        const summary = document.getElementById('save-summary');
        if (summary) {
            const date = new Date(saveData.saveTime);
            summary.innerHTML = `<p>📅 ${date.toLocaleString('zh-CN')}</p><p>🗡️ 第 <strong>${saveData.floor}</strong> 层 / 节点 ${saveData.nodeIndex + 1}</p><p>💰 ${(saveData.gold || 0).toLocaleString()} 金币 · ⚡ ${saveData.skill} 技能</p><p>🃏 卡组 ${(saveData.deck || []).length} 张</p>`;
        }
        if (continueBtn) continueBtn.style.display = '';
    } else {
        if (continueBtn) continueBtn.style.display = 'none';
        const summary = document.getElementById('save-summary');
        if (summary) summary.innerHTML = '<p style="color:#aaa">尚无存档</p>';
    }

    if (newBtn) {
        newBtn.onclick = () => {
            modal.classList.add('hidden');
            resetGameStateData();
            initDeck(); initMap(); initPartner();
            saveGame(); updateUI();
            showNextNode();
        };
    }
    if (continueBtn) {
        continueBtn.onclick = () => {
            if (loadGame()) {
                modal.classList.add('hidden');
                if (gameState.inBattle && gameState.currentEnemy) {
                    showEnemy(gameState.currentEnemy);
                    renderHandRTWP();
                } else { showNextNode(); }
            } else {
                updateBattleLog('❌ 存档损坏，已开始新游戏。');
                modal.classList.add('hidden');
                resetGameStateData();
                initDeck(); initMap(); initPartner();
                saveGame(); updateUI();
                showNextNode();
            }
        };
    }
}
