/* ========================================
   battle.js — RTWP 半实时战斗
   核心循环、行动槽、施法、敌人 AI、暂停、UI 渲染、战斗生命周期
   ======================================== */

import { RTWP_CONFIG, GAUGE_CONFIG, HAND_CONFIG, CAST_TIME, CARD_SPEEDS, ENEMY_AI_PROFILES, FLOW_CONFIG, SAVE_KEY, ENEMIES } from './config.js';
import { gameState } from './state.js';
import { _pendingLogMessages, updateUI, updateBattleLog, randomInt, randomChoice, shuffleArray, getCardCostText, getCardTypeName, formatEnemyIntent, formatActionType, closeModal } from './utils.js';
import { executeCardEffect, canUseCard, getCardGaugeCost, deductCardCosts, applyDamageToPlayer, renderUpgradeChips, recalcMaxGauge } from './cards.js';
import { saveGame } from './save.js';
import { checkGameOver, checkVictory } from './game-end.js';
import { checkFloorComplete, advanceFloor, showNextNode } from './map.js';

let _rtwpAnimFrameId = null;

// ==========================================
// 辅助（兼容旧调用）
// ==========================================

export function showEnemy(enemy) { showEnemyRTWP(enemy); }
export function enemyIntentCalculator(enemy) { return gameState.rtwp.enemyIntent || '...'; }

// ==========================================
// 核心循环
// ==========================================

export function rtwpStartBattle() {
    console.log('[RTWP] 半实时战斗循环启动！空格=暂停 F=加速');
    gameState.rtwp.battleActive = true;
    gameState.rtwp.paused = false;
    gameState.rtwp.lastTimestamp = 0;
    gameState.rtwp.tickAccumulator = 0;
    gameState.rtwp.timeSpeed = 1.0;
    gameState.rtwp.playerGauge = Math.floor(gameState.rtwp.playerMaxGauge * 0.7);
    gameState.rtwp.castingCard = null;
    gameState.rtwp.castStartMs = 0;
    gameState.rtwp.castDurationMs = 0;
    gameState.rtwp.castProgressMs = 0;
    gameState.rtwp.castInterrupted = false;
    gameState.rtwp.pendingActions = [];
    gameState.rtwp.cardDrawTimer = 0;
    gameState.rtwp.enemyGauge = 0;
    gameState.rtwp.enemyActionThreshold = 100;
    gameState.rtwp.enemyCurrentAction = null;
    gameState.rtwp.enemyCastProgress = 0;
    gameState.rtwp.enemyIntent = null;
    gameState.rtwp._enemyDamageBoost = 0;
    gameState.rtwp._enemyTurnCounter = 0;
    gameState.rtwp._gaugeFullPaused = false;
    gameState.rtwp._manualPause = false;
    gameState.gaugeRegenBoost = 0;
    gameState._echoedThisTurn = {};
    _pendingLogMessages.length = 0;

    gameState.hand = [];
    for (let i = 0; i < 3; i++) autoDrawCardSilent();
    renderHandRTWP();
    updateUI();
    showEnemyRTWP(gameState.currentEnemy);

    _rtwpAnimFrameId = requestAnimationFrame(rtwpBattleLoop);
}

export function rtwpStopBattle() {
    gameState.rtwp.battleActive = false;
    if (_rtwpAnimFrameId) { cancelAnimationFrame(_rtwpAnimFrameId); _rtwpAnimFrameId = null; }
    gameState.rtwp.castingCard = null;
    gameState.rtwp.pendingActions = [];
    gameState.rtwp.enemyCurrentAction = null;
}

function rtwpBattleLoop(timestamp) {
    if (!gameState.rtwp.battleActive) { _rtwpAnimFrameId = null; return; }
    if (!gameState.rtwp.lastTimestamp) gameState.rtwp.lastTimestamp = timestamp;

    const rawDelta = timestamp - gameState.rtwp.lastTimestamp;
    gameState.rtwp.lastTimestamp = timestamp;
    const effectiveDelta = Math.min(rawDelta, 200) * gameState.rtwp.timeSpeed;
    gameState.rtwp.tickAccumulator += effectiveDelta;

    if (!gameState.rtwp.paused) {
        while (gameState.rtwp.tickAccumulator >= RTWP_CONFIG.LOGICAL_TICK_MS) {
            rtwpLogicalTick(RTWP_CONFIG.LOGICAL_TICK_MS);
            gameState.rtwp.tickAccumulator -= RTWP_CONFIG.LOGICAL_TICK_MS;
        }
    }
    rtwpRender();
    _rtwpAnimFrameId = requestAnimationFrame(rtwpBattleLoop);
}

function rtwpLogicalTick(deltaMs) {
    const deltaSec = deltaMs / 1000;
    updateActionGauge(deltaSec);
    updateEnemyTimer(deltaSec);
    updateCardDrawTimer(deltaSec);
    updateCastBars(deltaMs);
    checkBattleEndConditions();
    checkAutoPauseTriggers();
}

function checkBattleEndConditions() {
    if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) endBattle(true);
}

function rtwpRender() {
    updateGaugeUI();
    showEnemyRTWP(gameState.currentEnemy);
    updateEnemyCastBarUI();
    updatePlayerCastBarUI();
    updatePauseOverlayUI();
    updateSpeedIndicatorUI();
    flushBattleLog();
}

// ==========================================
// 行动槽
// ==========================================

function triggerGaugeFullPause() {
    if (gameState.rtwp.paused) return;
    gameState.rtwp.paused = true;
    gameState.rtwp._gaugeFullPaused = true;
    queueBattleLog('⚡ 行动槽已满 — 请出牌（空格跳过）');
    renderHandRTWP();
}

function updateActionGauge(deltaSec) {
    if (!gameState.currentEnemy) return;
    const skillBonus = 1 + gameState.skill * GAUGE_CONFIG.SKILL_REGEN_BONUS;
    let regenRate = GAUGE_CONFIG.BASE_REGEN_PER_SEC * skillBonus;
    if (gameState.partner && gameState.partnerStage === 3 && gameState.partner.blessing.skillBoost) {
        regenRate *= (1 + gameState.partner.blessing.skillBoost);
    }
    if (gameState.gaugeRegenBoost > 0) regenRate *= (1 + gameState.gaugeRegenBoost);
    recalcMaxGauge();

    const prevGauge = gameState.rtwp.playerGauge;
    gameState.rtwp.playerGauge = Math.min(gameState.rtwp.playerMaxGauge, gameState.rtwp.playerGauge + regenRate * deltaSec);

    if (gameState.rtwp.playerGauge >= gameState.rtwp.playerMaxGauge &&
        prevGauge < gameState.rtwp.playerMaxGauge &&
        !gameState.rtwp.paused && !gameState.rtwp.castingCard &&
        gameState.rtwp.pendingActions.length === 0) {
        triggerGaugeFullPause();
    }
}

// ==========================================
// 施法
// ==========================================

export function playCardRTWP(index) {
    const card = gameState.hand[index];
    if (!card) return;

    const gaugeCost = getCardGaugeCost(card);
    if (gameState.rtwp.playerGauge < gaugeCost && !card._isEcho) { queueBattleLog('⏳ 行动槽不足！'); return; }
    if (!canUseCard(card)) { queueBattleLog('⚠️ 资源不足，无法使用此牌！'); return; }

    if (!card._isEcho) gameState.rtwp.playerGauge -= gaugeCost;
    deductCardCosts(card);

    gameState.hand.splice(index, 1);
    gameState.discardPile.push(card);

    const speed = CARD_SPEEDS[card.id] || 'medium';
    const castMs = CAST_TIME[speed];

    if (gameState.rtwp.paused) {
        gameState.rtwp.pendingActions.push({ card, remainingCast: castMs });
        queueBattleLog(`⏸️ 已排队：${card.name}（暂停解除后施放）`);
        if (gameState.rtwp._gaugeFullPaused) {
            gameState.rtwp._gaugeFullPaused = false;
            gameState.rtwp.paused = false;
            gameState.rtwp.tickAccumulator = 0; // 防止累积 tick 快进施法
            if (gameState.rtwp.pendingActions.length > 0 && !gameState.rtwp.castingCard) {
                const pa = gameState.rtwp.pendingActions.shift();
                startCasting(pa.card, pa.remainingCast);
                queueBattleLog(`▶️ 开始施放：${pa.card.name}`);
            }
        }
    } else {
        startCasting(card, castMs);
    }
    updateUI();
    renderHandRTWP();
}

function startCasting(card, durationMs) {
    gameState.rtwp.castingCard = card;
    gameState.rtwp.castProgressMs = 0;
    gameState.rtwp.castDurationMs = durationMs;
    gameState.rtwp.castInterrupted = false;
}

function updateCastBars(deltaMs) {
    if (gameState.rtwp.castingCard) {
        gameState.rtwp.castProgressMs += deltaMs;
        if (gameState.rtwp.castProgressMs >= gameState.rtwp.castDurationMs) {
            const card = gameState.rtwp.castingCard;
            gameState.rtwp.castingCard = null;
            gameState.rtwp.castProgressMs = 0;
            gameState.rtwp.castDurationMs = 0;
            executeCardEffect(card);
            checkGameOver();
            // 施法期间行动槽可能已回满但被 !castingCard 阻塞，
            // 此处补检：槽满且无排队时触发自动暂停。
            if (gameState.rtwp.playerGauge >= gameState.rtwp.playerMaxGauge &&
                !gameState.rtwp.paused &&
                gameState.rtwp.pendingActions.length === 0) {
                triggerGaugeFullPause();
            }
        }
    } else if (gameState.rtwp.pendingActions.length > 0) {
        const pa = gameState.rtwp.pendingActions.shift();
        startCasting(pa.card, pa.remainingCast);
        queueBattleLog(`▶️ 开始施放：${pa.card.name}`);
    }
}

function onPlayerHitDuringCast(damage) {
    if (!gameState.rtwp.castingCard || damage <= 0) return;
    const speed = CARD_SPEEDS[gameState.rtwp.castingCard.id] || 'medium';
    const interruptChance = { fast: 0.05, medium: 0.15, slow: 0.30 }[speed] || 0.15;
    if (Math.random() < interruptChance) {
        const interruptedCard = gameState.rtwp.castingCard;
        queueBattleLog(`💢 施法被打断！${interruptedCard.name} 被取消了！`);
        gameState.rtwp.castingCard = null;
        gameState.rtwp.castStartMs = 0;
        gameState.rtwp.castDurationMs = 0;
        gameState.hand.push(interruptedCard);
        renderHandRTWP();
    }
}

// ==========================================
// 敌人 AI
// ==========================================

function getEnemyAIProfile(enemy) {
    if (!enemy) return ENEMY_AI_PROFILES.default;
    if (enemy.debuffStack && enemy.hp >= 150) return ENEMY_AI_PROFILES.boss_debuffStack;
    if (enemy.hp >= 150) return ENEMY_AI_PROFILES.boss;
    if (enemy.multiHit) return ENEMY_AI_PROFILES.multiHit;
    if (enemy.damageEscalate) return ENEMY_AI_PROFILES.damageEscalate;
    if (enemy.debuffStack) return ENEMY_AI_PROFILES.debuffStack;
    if (enemy.shieldBreak) return ENEMY_AI_PROFILES.shieldBreak;
    if (enemy.reduceShield) return ENEMY_AI_PROFILES.reduceShield;
    return ENEMY_AI_PROFILES.default;
}

function updateEnemyTimer(deltaSec) {
    const enemy = gameState.currentEnemy;
    if (!enemy || enemy.currentHp <= 0) return;

    const ai = getEnemyAIProfile(enemy);
    gameState.rtwp.enemyGauge += ai.gaugeRegenPerSec * deltaSec;

    if (gameState.rtwp.enemyGauge >= gameState.rtwp.enemyActionThreshold && !gameState.rtwp.enemyCurrentAction) {
        gameState.rtwp.enemyGauge = 0;
        const action = chooseEnemyAction(ai);
        gameState.rtwp.enemyCurrentAction = { ...action };
        gameState.rtwp.enemyCastProgress = 0;
        gameState.rtwp.enemyIntent = formatEnemyIntent(action, enemy);
    }

    if (gameState.rtwp.enemyCurrentAction) {
        gameState.rtwp.enemyCastProgress += deltaSec * 1000;
        if (gameState.rtwp.enemyCastProgress >= gameState.rtwp.enemyCurrentAction.windupMs) {
            resolveEnemyAction(gameState.rtwp.enemyCurrentAction, enemy);
            gameState.rtwp.enemyCurrentAction = null;
            gameState.rtwp.enemyCastProgress = 0;
            gameState.rtwp.enemyIntent = null;
        }
    }
}

function chooseEnemyAction(aiProfile) {
    const totalWeight = aiProfile.actions.reduce((s, a) => s + a.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const action of aiProfile.actions) {
        roll -= action.weight;
        if (roll <= 0) return { ...action };
    }
    return { ...aiProfile.actions[0] };
}

function resolveEnemyAction(action, enemy) {
    if ((action.type.startsWith('attack') || action.type === 'special') && gameState.blockNextEnemyAttack) {
        queueBattleLog(`🛡️ 贵族庇护！抵挡了 ${enemy.name} 的 ${formatActionType(action.type)}！`);
        gameState.blockNextEnemyAttack = false;
        return;
    }

    switch (action.type) {
        case 'attack':
        case 'attack_heavy': {
            let rawDmg = enemy.damage * (action.damageMul || 1.0);
            if (enemy.damageEscalate) { gameState.rtwp._enemyTurnCounter++; rawDmg += gameState.rtwp._enemyTurnCounter * 3; }
            rawDmg = Math.floor(rawDmg);
            applyDamageToPlayer(rawDmg);
            queueBattleLog(`💢 ${enemy.name} 发动攻击！造成 ${rawDmg} 点伤害。`);
            onPlayerHitDuringCast(rawDmg);
            break;
        }
        case 'attack_multi': {
            const hits = action.hits || 3;
            let totalDmg = 0;
            for (let i = 0; i < hits; i++) {
                const hitDmg = Math.max(1, Math.floor(enemy.damage * (action.damageMul || 0.4)));
                applyDamageToPlayer(hitDmg);
                totalDmg += hitDmg;
            }
            queueBattleLog(`💢 ${enemy.name} 发动多重攻击（${hits}连击）！共 ${totalDmg} 点伤害。`);
            onPlayerHitDuringCast(totalDmg);
            break;
        }
        case 'attack_debuff': {
            let rawDmg = Math.floor(enemy.damage * (action.damageMul || 1.0));
            gameState.rtwp._enemyTurnCounter++;
            rawDmg += gameState.rtwp._enemyTurnCounter * 2;
            gameState.authority = Math.max(0, gameState.authority - 1);
            applyDamageToPlayer(rawDmg);
            queueBattleLog(`🔮 ${enemy.name} 心灵压制！权威-1！造成 ${rawDmg} 点伤害。`);
            onPlayerHitDuringCast(rawDmg);
            break;
        }
        case 'attack_shield_break': {
            let rawDmg = Math.floor(enemy.damage * (action.damageMul || 1.2));
            gameState.playerShield = Math.max(0, gameState.playerShield - Math.floor(gameState.playerShield * 0.3));
            applyDamageToPlayer(rawDmg);
            queueBattleLog(`💥 ${enemy.name} 破盾攻击！造成 ${rawDmg} 点伤害。`);
            onPlayerHitDuringCast(rawDmg);
            break;
        }
        case 'attack_reduce_shield': {
            let rawDmg = Math.floor(enemy.damage * (action.damageMul || 1.0));
            gameState.playerShield = Math.max(0, gameState.playerShield - 5);
            applyDamageToPlayer(rawDmg);
            queueBattleLog(`🔻 ${enemy.name} 削弱护盾！造成 ${rawDmg} 点伤害。`);
            onPlayerHitDuringCast(rawDmg);
            break;
        }
        case 'defend': {
            enemy.shield = (enemy.shield || 0) + (action.shieldAmount || 10);
            queueBattleLog(`🛡️ ${enemy.name} 展开防御，获得 ${action.shieldAmount || 10} 护盾。`);
            break;
        }
        case 'howl': {
            gameState.rtwp._enemyDamageBoost += 0.2;
            queueBattleLog(`🐺 ${enemy.name} 发出嚎叫，攻击力上升！`);
            break;
        }
        case 'special': {
            if (enemy.debuffStack) { gameState.authority = Math.max(0, gameState.authority - 2); queueBattleLog(`🔮 ${enemy.name} 心灵压制！权威-2！`); }
            break;
        }
    }

    if (enemy.bleed && enemy.bleed > 0) {
        const dotDmg = 3 + gameState.rtwp._enemyTurnCounter;
        enemy.currentHp = Math.max(0, enemy.currentHp - dotDmg);
        enemy.bleed -= 1;
        queueBattleLog(`🩸 流血生效：${enemy.name} 受到 ${dotDmg} 点伤害（剩余 ${enemy.bleed} 回合）`);
        if (enemy.currentHp <= 0) { queueBattleLog(`💀 ${enemy.name} 因流血倒下！`); endBattle(true); }
    }
    updateUI();
    showEnemyRTWP(enemy);
}

// ==========================================
// 手牌流转
// ==========================================

function updateCardDrawTimer(deltaSec) {
    const skillReduction = gameState.skill * HAND_CONFIG.SKILL_DRAW_BONUS;
    const drawInterval = Math.max(HAND_CONFIG.MIN_DRAW_INTERVAL, HAND_CONFIG.DRAW_INTERVAL_SEC - skillReduction);
    gameState.rtwp.cardDrawTimer += deltaSec;
    while (gameState.rtwp.cardDrawTimer >= drawInterval) {
        gameState.rtwp.cardDrawTimer -= drawInterval;
        autoDrawCard();
    }
}

function autoDrawCard() { autoDrawCardSilent(); renderHandRTWP(); }

function autoDrawCardSilent() {
    if (gameState.hand.length >= HAND_CONFIG.MAX_HAND_SIZE) {
        gameState.discardPile.push(gameState.hand.shift());
    }
    if (gameState.drawPile.length === 0) {
        gameState.drawPile = [...gameState.discardPile];
        gameState.discardPile = [];
        shuffleArray(gameState.drawPile);
    }
    if (gameState.drawPile.length > 0) gameState.hand.push(gameState.drawPile.pop());
}

// ==========================================
// 暂停
// ==========================================

export function togglePause() {
    if (gameState.rtwp.paused && gameState.rtwp._gaugeFullPaused) gameState.rtwp._gaugeFullPaused = false;
    gameState.rtwp.paused = !gameState.rtwp.paused;
    gameState.rtwp._manualPause = gameState.rtwp.paused;
    if (gameState.rtwp.paused) {
        queueBattleLog('⏸️ 战斗暂停 — 按空格键继续，可查看手牌并排队出牌');
    } else {
        queueBattleLog('▶️ 战斗继续');
        if (gameState.rtwp.pendingActions.length > 0 && !gameState.rtwp.castingCard) {
            const pa = gameState.rtwp.pendingActions.shift();
            startCasting(pa.card, pa.remainingCast);
            queueBattleLog(`▶️ 开始施放队列：${pa.card.name}`);
        }
    }
    renderHandRTWP();
}

function checkAutoPauseTriggers() {
    if (gameState.rtwp.paused) return;
    if (gameState.hp <= gameState.maxHp * 0.2 && gameState.hp > 0 && gameState.currentEnemy) {
        gameState.rtwp.paused = true;
        queueBattleLog('⚠️ 自动暂停：血量过低！按空格键继续。');
        renderHandRTWP();
        return;
    }
    if (gameState.rtwp.enemyCurrentAction && gameState.rtwp.enemyCurrentAction.windupMs >= 2500 && gameState.rtwp.enemyCastProgress < 300) {
        gameState.rtwp.paused = true;
        queueBattleLog('⚠️ 自动暂停：敌人即将释放强力攻击！按空格键继续。');
        renderHandRTWP();
    }
}

// ==========================================
// UI 渲染
// ==========================================

function updateGaugeUI() {
    const bar = document.getElementById('gauge-bar');
    const text = document.getElementById('gauge-text');
    if (!bar || !text) return;
    const pct = Math.max(0, (gameState.rtwp.playerGauge / gameState.rtwp.playerMaxGauge) * 100);
    bar.style.width = `${pct}%`;
    text.textContent = `${Math.floor(gameState.rtwp.playerGauge)}/${gameState.rtwp.playerMaxGauge}`;
}

function updateEnemyCastBarUI() {
    const bar = document.getElementById('enemy-cast-bar');
    if (!bar) return;
    if (gameState.rtwp.enemyCurrentAction && !gameState.rtwp.paused) {
        bar.classList.remove('hidden');
        const pct = Math.min(100, (gameState.rtwp.enemyCastProgress / gameState.rtwp.enemyCurrentAction.windupMs) * 100);
        const fill = document.getElementById('enemy-cast-fill');
        const label = document.getElementById('enemy-cast-label');
        if (fill) fill.style.width = `${pct}%`;
        if (label) label.textContent = gameState.rtwp.enemyIntent || '施放中...';
    } else { bar.classList.add('hidden'); }
}

function updatePlayerCastBarUI() {
    const bar = document.getElementById('player-cast-bar');
    if (!bar) return;
    if (gameState.rtwp.castingCard && !gameState.rtwp.paused) {
        bar.classList.remove('hidden');
        const pct = Math.min(100, (gameState.rtwp.castProgressMs / gameState.rtwp.castDurationMs) * 100);
        const fill = document.getElementById('player-cast-fill');
        const label = document.getElementById('player-cast-label');
        if (fill) fill.style.width = `${pct}%`;
        if (label) label.textContent = `施放：${gameState.rtwp.castingCard.name}`;
    } else { bar.classList.add('hidden'); }
}

function updatePauseOverlayUI() {
    const overlay = document.getElementById('pause-overlay');
    if (!overlay) return;
    if (gameState.rtwp.paused && gameState.rtwp.battleActive && gameState.rtwp._manualPause) {
        overlay.classList.remove('hidden');
    } else { overlay.classList.add('hidden'); }
}

function updateSpeedIndicatorUI() {
    const el = document.getElementById('speed-indicator');
    if (!el) return;
    el.textContent = gameState.rtwp.timeSpeed === 2.0 ? '⏩ 2x' : '▶️ 1x';
}

export function renderHandRTWP() {
    const container = document.getElementById('cards-container');
    if (!container) return;
    container.innerHTML = '';

    gameState.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card card-${card.type}`;

        const canAfford = canUseCard(card);
        const gaugeCost = getCardGaugeCost(card);
        const hasGauge = card._isEcho || gameState.rtwp.playerGauge >= gaugeCost;
        const isCastingNow = gameState.rtwp.castingCard && gameState.rtwp.castingCard === card;

        if (!canAfford || (!hasGauge && !gameState.rtwp.paused) || isCastingNow) {
            cardElement.classList.add('disabled');
        }
        if (gameState.rtwp.pendingActions.some(pa => pa.card === card)) {
            cardElement.classList.add('card-queued');
        }

        const attrBadges = (card.attributes || [])
            .map(a => a === 'achievement' ? '<span class="attr-badge attr-achievement" title="成就感">🎖️</span>' : a === 'authority' ? '<span class="attr-badge attr-authority" title="影响力">👑</span>' : '')
            .join('');
        const speed = CARD_SPEEDS[card.id] || 'medium';
        const speedText = { fast: '快', medium: '中', slow: '慢' }[speed];
        const upgradesChips = renderUpgradeChips(card);

        cardElement.innerHTML = `
            <div class="card-cost">${getCardCostText(card)}</div>
            ${attrBadges ? `<div class="card-attrs">${attrBadges}</div>` : ''}
            <span class="card-speed-badge speed-${speed}">${speedText} · ${gaugeCost}</span>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${getCardTypeName(card.type)}</div>
            <div class="card-description">${card.description}</div>
            ${upgradesChips ? `<div class="upgrade-chips">${upgradesChips}</div>` : ''}
        `;

        if (canAfford && hasGauge && !isCastingNow && !gameState.rtwp.pendingActions.some(pa => pa.card === card)) {
            cardElement.addEventListener('click', () => playCardRTWP(index));
        }
        container.appendChild(cardElement);
    });
}

export function showEnemyRTWP(enemy) {
    if (!enemy) return;
    const enemyName = document.getElementById('enemy-name');
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const enemyHpText = document.getElementById('enemy-hp-text');
    const enemyIntent = document.getElementById('enemy-intent');
    if (enemyName) enemyName.textContent = enemy.name;
    if (enemyHpBar) enemyHpBar.style.width = `${(enemy.currentHp / enemy.hp) * 100}%`;
    if (enemyHpText) enemyHpText.textContent = `${enemy.currentHp}/${enemy.hp}`;
    if (enemyIntent) enemyIntent.textContent = gameState.rtwp.enemyIntent ? `意图: ${gameState.rtwp.enemyIntent}` : '';
}

export function queueBattleLog(message) { _pendingLogMessages.push(message); }

function flushBattleLog() {
    if (_pendingLogMessages.length === 0) return;
    const log = document.getElementById('battle-log');
    if (log) log.innerHTML = _pendingLogMessages.slice(-8).join('<br>');
    _pendingLogMessages.length = 0;
}

// ==========================================
// 战斗生命周期
// ==========================================

export function startBattle(enemy) {
    gameState.inBattle = true;
    gameState.currentEnemy = { ...enemy, currentHp: enemy.hp };
    gameState.playerShield = 0;
    gameState.tempDamageBoost = 0;
    gameState.immuneSmallAttack = false;
    gameState.blockNextEnemyAttack = false;
    gameState.isFinisherState = false;
    gameState.cardUsageCount = {};

    gameState.drawPile = [...gameState.deck];
    shuffleArray(gameState.drawPile);
    gameState.hand = [];
    gameState.discardPile = [];

    showEnemyRTWP(gameState.currentEnemy);
    queueBattleLog(`⚔️ 遭遇 ${enemy.name}！开始战斗！（空格=暂停，F=加速）`);
    updateUI();
    rtwpStartBattle();
}

export function endTurn() {
    if (!gameState.inBattle) return;
    queueBattleLog('⏳ RTWP 模式下无需手动结束回合，战斗自动进行。');
}

export function enemyTurn() {}

export function endBattle(victory) {
    if (gameState.inBattle === false) return;
    rtwpStopBattle();
    gameState.inBattle = false;

    if (victory) {
        const enemy = gameState.currentEnemy;
        const goldReward = (enemy.gold || 0) + Math.floor(gameState.floor * 50);
        const skillReward = enemy.skill || 0;
        const achievementReward = enemy.exp || 0;
        const authorityReward = Math.floor((enemy.exp || 0) / 2);

        gameState.gold += goldReward;
        gameState.skill += skillReward;
        gameState.achievement += achievementReward;
        gameState.authority += authorityReward;

        const healFromAchievement = Math.floor(gameState.achievement / 10);
        if (healFromAchievement > 0) gameState.hp = Math.min(gameState.maxHp, gameState.hp + healFromAchievement);

        const currentNode = gameState.mapNodes[gameState.nodeIndex];
        if (currentNode && !currentNode.visited) currentNode.visited = true;

        showBattleResult(true, { gold: goldReward, skill: skillReward, achievement: achievementReward, authority: authorityReward, healFromAchievement, enemyName: enemy.name });
        saveGame();
    } else {
        checkGameOver();
        return;
    }

    gameState.currentEnemy = null;
    gameState.playerShield = 0;
    updateUI();
}

export function continueAfterBattle() {
    closeModal('battle-result-modal');
    if (checkVictory()) return;
    if (checkFloorComplete()) { advanceFloor(); return; }
    showNextNode();
}

function showBattleResult(victory, rewards) {
    const modal = document.getElementById('battle-result-modal');
    const title = document.getElementById('battle-result-title');
    const content = document.getElementById('battle-result-content');

    if (victory) {
        title.textContent = '🎉 战斗胜利！';
        title.className = 'victory';
        content.innerHTML = `
            <p>击败了 <strong>${rewards.enemyName}</strong></p>
            <p>💰 金币 <strong>+${rewards.gold}</strong></p>
            <p>⚡ 技能 <strong>+${rewards.skill}</strong></p>
            <p>✨ 成就感 <strong>+${rewards.achievement}</strong></p>
            <p>👑 权威 <strong>+${rewards.authority}</strong></p>
            ${rewards.healFromAchievement > 0 ? `<p>❤️ 成就感回血 +${rewards.healFromAchievement}</p>` : ''}
            <p style="color:#aaa; margin-top:14px; font-size:12px;">点 "继续" 进入下一节点</p>`;
    } else {
        title.textContent = '💀 战斗失败';
        title.className = 'defeat';
        content.innerHTML = `<p>你被敌人击败了...</p>`;
    }
    modal.classList.remove('hidden');
}

// ==========================================
// Debug API（浏览器控制台使用）
// 用法:
//   __dbg.snap()           — 当前状态快照
//   __dbg.tick(n)          — 推进 n 个逻辑 tick
//   __dbg.untilPause()     — 推进直到自动暂停
//   __dbg.playCard(cost)   — 模拟出牌（扣 gauge + 施法）
//   __dbg.test()           — 完整自动化测试
// ==========================================
window.__gs = gameState;
window.__logicalTick = rtwpLogicalTick;
window.__render = rtwpRender;

window.__dbg = {
    snap() {
        const s = gameState.rtwp;
        return {
            gauge:       s.playerGauge.toFixed(1) + '/' + s.playerMaxGauge,
            paused:      s.paused,
            gaugeFull:   s._gaugeFullPaused,
            manual:      s._manualPause,
            casting:     s.castingCard ? `${s.castingCard.name} ${s.castProgressMs}/${s.castDurationMs}ms` : null,
            pending:     s.pendingActions.length,
            accumulator: s.tickAccumulator.toFixed(0) + 'ms',
            hand:        gameState.hand.length + '张',
            enemy:       gameState.currentEnemy ? `${gameState.currentEnemy.name} hp=${gameState.currentEnemy.currentHp}/${gameState.currentEnemy.hp}` : null,
            battleActive: s.battleActive,
        };
    },

    tick(n = 1) {
        for (let i = 0; i < n; i++) {
            if (!gameState.rtwp.battleActive) { console.log('战斗未激活'); return; }
            if (gameState.rtwp.paused)       { console.log('已暂停，无法推进'); return; }
            rtwpLogicalTick(50);
        }
        rtwpRender();
        console.log(this.snap());
    },

    untilPause(maxTicks = 200) {
        for (let i = 0; i < maxTicks; i++) {
            if (!gameState.rtwp.battleActive) { console.log(`tick ${i}: 战斗结束`); return i; }
            if (!gameState.rtwp.paused) rtwpLogicalTick(50);
            if (gameState.rtwp.paused)  { console.log(`tick ${i}: 暂停触发`, this.snap()); return i; }
        }
        console.log('未触发暂停（已达上限）', this.snap());
        return maxTicks;
    },

    playCard(gaugeCost = 45, castMs = 500) {
        gameState.rtwp.playerGauge = Math.max(0, gameState.rtwp.playerGauge - gaugeCost);
        gameState.rtwp._gaugeFullPaused = false;
        gameState.rtwp.paused = false;
        gameState.rtwp.tickAccumulator = 0;
        gameState.rtwp.castingCard = { name: 'TEST_CARD', id: 'test' };
        gameState.rtwp.castProgressMs = 0;
        gameState.rtwp.castDurationMs = castMs;
        console.log('出牌后:', this.snap());
    },

    test() {
        console.clear();
        console.log('╔══════════════════════════════════╗');
        console.log('║   RTWP 战斗机制自动化测试       ║');
        console.log('╚══════════════════════════════════╝');

        // 确保战斗已激活
        if (!gameState.rtwp.battleActive) {
            console.error('❌ 请先进入一场战斗');
            return;
        }

        // 重置到初始状态
        const maxGauge = gameState.rtwp.playerMaxGauge;
        gameState.rtwp.paused = false;
        gameState.rtwp._gaugeFullPaused = false;
        gameState.rtwp._manualPause = false;
        gameState.rtwp.tickAccumulator = 0;
        gameState.rtwp.playerGauge = Math.floor(maxGauge * 0.7);
        gameState.rtwp.castingCard = null;
        gameState.rtwp.castProgressMs = 0;
        gameState.rtwp.pendingActions = [];

        console.log('\n📌 初始状态:', this.snap());

        // 测试 1: 推进到首次暂停
        console.log('\n--- 测试 1: 槽回满 → 自动暂停 ---');
        const t1 = this.untilPause();
        const s1 = this.snap();
        console.assert(s1.paused && s1.gaugeFull, '✅ 测试1通过' , '❌ 测试1失败', s1);

        // 测试 2: 出牌 + 观察施法推进
        console.log('\n--- 测试 2: 出牌 → 施法推进 ---');
        this.playCard(45, 500); // medium speed
        let castLog = [];
        let castDone = false;
        for (let i = 0; i < 30; i++) {
            if (!gameState.rtwp.castingCard) { castDone = true; break; }
            if (!gameState.rtwp.paused) rtwpLogicalTick(50);
            castLog.push(`  tick${i}: cast ${gameState.rtwp.castProgressMs}/${gameState.rtwp.castDurationMs}ms gauge=${gameState.rtwp.playerGauge.toFixed(0)}`);
        }
        console.log('施法过程:');
        castLog.forEach(l => console.log(l));
        console.assert(castDone, '✅ 测试2通过（施法完成）', '❌ 测试2失败（施法未完成）');

        // 测试 3: 槽再次回满 → 第二次暂停
        console.log('\n--- 测试 3: 槽再次回满 → 第二次暂停 ---');
        const t3 = this.untilPause();
        const s3 = this.snap();
        console.assert(s3.paused && s3.gaugeFull, '✅ 测试3通过', '❌ 测试3失败', s3);

        // 测试 4: 连续出牌 3 次
        console.log('\n--- 测试 4: 连续 3 次出牌循环 ---');
        let allPassed = true;
        for (let round = 1; round <= 3; round++) {
            console.log(`\n第 ${round} 轮:`);
            this.playCard(45, 500);
            let done = false;
            for (let i = 0; i < 30 && !done; i++) {
                if (!gameState.rtwp.paused) rtwpLogicalTick(50);
                if (!gameState.rtwp.castingCard) done = true;
            }
            console.log(`  施法${done ? '✅' : '❌'} | gauge=${gameState.rtwp.playerGauge.toFixed(0)}`);
            if (!done) { allPassed = false; break; }
        }
        console.assert(allPassed, '✅ 测试4通过', '❌ 测试4失败');

        console.log('\n╔══════════════════════════════════╗');
        console.log('║   测试完成                       ║');
        console.log('╚══════════════════════════════════╝');
    }
};

console.log('🧪 Debug API 已就绪: __dbg.snap() | __dbg.tick(n) | __dbg.untilPause() | __dbg.playCard() | __dbg.test()');
