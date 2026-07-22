/* ========================================
   state.js — 游戏状态（仅数据，无函数调用）
   ======================================== */

import { INITIAL_RESOURCES, GAUGE_CONFIG, FLOW_CONFIG, SAVE_VERSION } from './config.js';

export let gameState = {
    hp: INITIAL_RESOURCES.hp,
    maxHp: INITIAL_RESOURCES.maxHp,
    mp: INITIAL_RESOURCES.mp,
    maxMp: INITIAL_RESOURCES.maxMp,
    gold: INITIAL_RESOURCES.gold,
    skill: INITIAL_RESOURCES.skill,
    achievement: INITIAL_RESOURCES.achievement,
    authority: INITIAL_RESOURCES.authority,

    floor: 1,
    nodeIndex: 0,
    nodesPerFloor: FLOW_CONFIG.nodesPerFloor,

    inBattle: false,
    currentEnemy: null,
    playerShield: 0,
    playerDiceResult: 0,
    enemyDiceResult: 0,
    blockNextEnemyAttack: false,
    isFinisherState: false,

    rtwp: {
        battleActive: false, paused: false, lastTimestamp: 0, tickAccumulator: 0,
        timeSpeed: 1.0,
        playerGauge: Math.floor(GAUGE_CONFIG.MAX_GAUGE * 0.7),
        playerMaxGauge: GAUGE_CONFIG.MAX_GAUGE,
        castingCard: null, castStartMs: 0, castDurationMs: 0, castProgressMs: 0, castInterrupted: false,
        pendingActions: [], cardDrawTimer: 0,
        enemyGauge: 0, enemyActionThreshold: 100,
        enemyCurrentAction: null, enemyCastProgress: 0, enemyIntent: null,
        _enemyDamageBoost: 0, _enemyTurnCounter: 0,
    },

    deck: [], hand: [], drawPile: [], discardPile: [], cardUsageCount: {},

    partner: null, partnerStage: 0, partnerSatisfaction: 0, partnerDarkMode: false,

    mapNodes: [], layerBossSeed: 0,

    tempDamageBoost: 0, gaugeRegenBoost: 0, immuneSmallAttack: false,

    _echoedThisTurn: {},

    triggeredEvents: [], perfectFinishers: [],

    saveVersion: SAVE_VERSION, saveTime: 0
};

export function resetGameStateData() {
    gameState.hp = INITIAL_RESOURCES.hp;
    gameState.maxHp = INITIAL_RESOURCES.maxHp;
    gameState.mp = INITIAL_RESOURCES.mp;
    gameState.maxMp = INITIAL_RESOURCES.maxMp;
    gameState.gold = INITIAL_RESOURCES.gold;
    gameState.skill = INITIAL_RESOURCES.skill;
    gameState.achievement = INITIAL_RESOURCES.achievement;
    gameState.authority = INITIAL_RESOURCES.authority;
    gameState.floor = 1;
    gameState.nodeIndex = 0;
    gameState.inBattle = false;
    gameState.currentEnemy = null;
    gameState.playerShield = 0;
    gameState.playerDiceResult = 0;
    gameState.enemyDiceResult = 0;
    gameState.isFinisherState = false;
    gameState.tempDamageBoost = 0;
    gameState.gaugeRegenBoost = 0;
    gameState.immuneSmallAttack = false;
    gameState.blockNextEnemyAttack = false;
    gameState.deck = [];
    gameState.hand = [];
    gameState.drawPile = [];
    gameState.discardPile = [];
    gameState.cardUsageCount = {};
    gameState.partner = null;
    gameState.partnerStage = 0;
    gameState.partnerSatisfaction = 0;
    gameState.partnerDarkMode = false;
    gameState.mapNodes = [];
    gameState.layerBossSeed = 0;
    gameState.triggeredEvents = [];
    gameState.perfectFinishers = [];
    gameState._echoedThisTurn = {};
    gameState.rtwp = {
        battleActive: false, paused: false, lastTimestamp: 0, tickAccumulator: 0,
        timeSpeed: 1.0,
        playerGauge: Math.floor(GAUGE_CONFIG.MAX_GAUGE * 0.7),
        playerMaxGauge: GAUGE_CONFIG.MAX_GAUGE,
        castingCard: null, castStartMs: 0, castDurationMs: 0, castProgressMs: 0, castInterrupted: false,
        pendingActions: [], cardDrawTimer: 0,
        enemyGauge: 0, enemyActionThreshold: 100,
        enemyCurrentAction: null, enemyCastProgress: 0, enemyIntent: null,
        _enemyDamageBoost: 0, _enemyTurnCounter: 0, _gaugeFullPaused: false, _manualPause: false,
    };
}
