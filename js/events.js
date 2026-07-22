/* ========================================
   events.js — 随机事件 + 卡牌升级事件弹窗
   ======================================== */

import { CARD_UPGRADES, CARD_UPGRADE_EVENTS, RANDOM_EVENTS } from './config.js';
import { gameState } from './state.js';
import { randomChoice, updateBattleLog, updateUI, isActionCard, triggerLabel, getCardCostText, getCardTypeName, closeModal } from './utils.js';
import { attachUpgradeToCard, renderUpgradeChips } from './cards.js';
import { saveGame } from './save.js';
import { checkGameOver, checkVictory } from './game-end.js';
import { checkFloorComplete, advanceFloor, showNextNode, continueAfterNonBattle } from './map.js';

export let _pendingUpgrade = null;

// --- 随机事件 ---

export function triggerRandomEvent() {
    const eventCategories = ['positive', 'negative', 'risk', 'neutral', 'cardUpgrade'];
    const weights = [0.225, 0.225, 0.225, 0.225, 0.10];
    const rand = Math.random();
    let category;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) { category = eventCategories[i]; break; }
    }

    if (category === 'cardUpgrade') {
        const keys = Object.keys(CARD_UPGRADE_EVENTS);
        const keyPool = [];
        keys.forEach(k => {
            const w = CARD_UPGRADE_EVENTS[k].weight || 1;
            for (let i = 0; i < w * 10; i++) keyPool.push(k);
        });
        showCardUpgradeEvent(keyPool[Math.floor(Math.random() * keyPool.length)]);
        return;
    }
    showEventModal(randomChoice(RANDOM_EVENTS[category]));
}

export function showEventModal(event) {
    const modal = document.getElementById('event-modal');
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-description').textContent = event.description;
    const options = document.getElementById('event-options');
    options.innerHTML = '';

    if (event.effect.risk) {
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'event-option';
        acceptBtn.textContent = '接受挑战';
        acceptBtn.onclick = () => { applyRiskEffect(event.effect); continueAfterNonBattle(); };
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'event-option';
        rejectBtn.textContent = '拒绝（无损失）';
        rejectBtn.onclick = () => continueAfterNonBattle();
        options.appendChild(acceptBtn);
        options.appendChild(rejectBtn);
    } else {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'event-option';
        confirmBtn.textContent = '确认';
        confirmBtn.onclick = () => { applyEffect(event.effect); continueAfterNonBattle(); };
        options.appendChild(confirmBtn);
    }
    modal.classList.remove('hidden');
}

export function applyEffect(effect) {
    const messages = [];
    if (effect.gold) { gameState.gold += effect.gold; messages.push(`💰 金币 ${effect.gold > 0 ? '+' : ''}${effect.gold}`); }
    if (effect.goldPercent) { const change = Math.floor(gameState.gold * effect.goldPercent / 100); gameState.gold += change; messages.push(`💰 金币 ${change > 0 ? '+' : ''}${change} (${effect.goldPercent}%)`); }
    if (effect.hp) { gameState.hp = Math.max(0, Math.min(gameState.maxHp, gameState.hp + effect.hp)); messages.push(`❤️ 血条 ${effect.hp > 0 ? '+' : ''}${effect.hp}`); }
    if (effect.mp) { gameState.mp = Math.max(0, Math.min(gameState.maxMp, gameState.mp + effect.mp)); messages.push(`💙 蓝条 ${effect.mp > 0 ? '+' : ''}${effect.mp}`); }
    if (effect.skill) { gameState.skill += effect.skill; messages.push(`⚡ 技能 +${effect.skill}`); }
    if (effect.achievement) { gameState.achievement += effect.achievement; messages.push(`✨ 成就感 +${effect.achievement}`); }
    if (effect.authority) { gameState.authority += effect.authority; messages.push(`👑 权威 +${effect.authority}`); }
    updateBattleLog(messages.join('<br>'));
    updateUI();
    checkGameOver();
}

export function applyRiskEffect(effect) {
    const success = Math.random() > 0.5;
    updateBattleLog(success ? `🎲 风险判定成功！` : `🎲 风险判定失败！`);
    applyEffect(success ? effect.win : effect.lose);
}

// --- 卡牌升级事件 ---

export function showCardUpgradeEvent(eventKey) {
    const evt = CARD_UPGRADE_EVENTS[eventKey];
    if (!evt) { continueAfterNonBattle(); return; }
    if (evt.cost && gameState.gold < evt.cost) { updateBattleLog(`💰 金币不足以听取密藏（需 ${evt.cost}）`); continueAfterNonBattle(); return; }
    if (evt.cost) gameState.gold -= evt.cost;

    const modal = document.getElementById('card-upgrade-modal');
    document.getElementById('card-upgrade-title').textContent = `🗡️ ${evt.title}`;
    document.getElementById('card-upgrade-desc').innerHTML = `${evt.description}<br><span style="color:#888; font-size:11px;">第一步：选择 ${evt.choices} 个升级中的 1 个</span>`;
    _pendingUpgrade = { eventDef: evt, pickedTagId: null };
    renderUpgradeStage1();
    modal.classList.remove('hidden');
}

export function renderUpgradeStage1() {
    const stage = document.getElementById('card-upgrade-stage');
    stage.innerHTML = '';
    _pendingUpgrade.eventDef.pool.forEach(uid => {
        const def = CARD_UPGRADES[uid];
        if (!def) return;
        const btn = document.createElement('div');
        btn.className = 'upgrade-tag-option';
        btn.innerHTML = `<span class="tag-name ${def.kind}">${def.name}</span><span class="tag-desc">${def.effect}</span><span class="tag-desc" style="color:#666;">触发器：${triggerLabel(def.trigger)}</span>`;
        btn.onclick = () => { _pendingUpgrade.pickedTagId = uid; renderUpgradeStage2(); };
        stage.appendChild(btn);
    });
}

export function renderUpgradeStage2() {
    const stage = document.getElementById('card-upgrade-stage');
    stage.innerHTML = '';
    const desc = document.getElementById('card-upgrade-desc');
    const def = CARD_UPGRADES[_pendingUpgrade.pickedTagId];
    desc.innerHTML = `已选：<span class="tag-name ${def.kind}" style="display:inline-block;padding:2px 10px;border-radius:12px;font-weight:bold;color:#fff;background:${def.color}">${def.name}</span><br>第二步：从手牌中选一张动作牌挂载`;

    const handActionCards = gameState.hand.filter(isActionCard);
    if (handActionCards.length === 0) {
        const deckActionCards = gameState.deck.filter(isActionCard);
        if (deckActionCards.length === 0) { desc.innerHTML += '<br><span style="color:#e74c3c">卡组中没有任何动作牌，本次升级跳过。</span>'; finishCardUpgrade(); return; }
        const target = randomChoice(deckActionCards);
        if (attachUpgradeToCard(target, _pendingUpgrade.pickedTagId)) desc.innerHTML += `<br><span style="color:#aaa">手牌无可挂载目标，已自动挂到卡组 [${target.name}]</span>`;
        finishCardUpgrade();
        return;
    }

    handActionCards.forEach(card => {
        const upgradesChips = renderUpgradeChips(card);
        const btn = document.createElement('div');
        btn.className = 'upgrade-target-option';
        btn.innerHTML = `<strong>${card.name}</strong><span class="target-meta">${getCardCostText(card)} · ${getCardTypeName(card.type)}</span>${upgradesChips ? `<div style="margin-top:6px;">${upgradesChips}</div>` : ''}`;
        btn.onclick = () => {
            if (attachUpgradeToCard(card, _pendingUpgrade.pickedTagId)) finishCardUpgrade();
            else updateBattleLog('该卡已挂载此升级，请选其他卡。');
        };
        stage.appendChild(btn);
    });

    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn';
    skipBtn.textContent = '放弃本次升级';
    skipBtn.onclick = () => finishCardUpgrade(true);
    stage.appendChild(skipBtn);
}

export function finishCardUpgrade(skipContinue) {
    _pendingUpgrade = null;
    closeModal('card-upgrade-modal');
    if (!skipContinue) {
        const currentNode = gameState.mapNodes[gameState.nodeIndex];
        if (currentNode && !currentNode.visited) currentNode.visited = true;
        saveGame();
        if (checkVictory()) return;
        if (checkFloorComplete()) { advanceFloor(); } else { showNextNode(); }
    }
}
