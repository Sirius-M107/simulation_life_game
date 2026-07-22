/* ========================================
   shop.js — 商店系统
   ======================================== */

import { FLOW_CONFIG, CARDS } from './config.js';
import { gameState } from './state.js';
import { randomInt, updateBattleLog, updateUI } from './utils.js';
import { continueAfterNonBattle } from './map.js';

export function addCardToDeck(card) {
    if (gameState.deck.length >= FLOW_CONFIG.deckSizeMax) {
        const refund = Math.floor((card.gold || 0) * 0.5);
        gameState.gold += refund;
        updateBattleLog(`⚠️ 卡组已达上限 ${FLOW_CONFIG.deckSizeMax} 张，回收 ${refund} 金币。`);
        return false;
    }
    gameState.deck.push({ ...card });
    return true;
}

export function showShopModal() {
    const modal = document.getElementById('investment-modal');
    const title = document.getElementById('investment-title');
    const desc = document.getElementById('investment-description');
    const options = document.getElementById('investment-options');

    title.textContent = '🏪 商店';
    desc.innerHTML = `购买强力卡牌和道具！<br><span style="color:#aaa; font-size:12px;">当前卡组 ${gameState.deck.length} / ${FLOW_CONFIG.deckSizeMax} 张</span>`;
    options.innerHTML = '';

    const deckFull = gameState.deck.length >= FLOW_CONFIG.deckSizeMax;

    const atkCard = CARDS.attackCards[randomInt(0, CARDS.attackCards.length - 1)];
    const atkBtn = document.createElement('button');
    atkBtn.className = 'investment-option';
    atkBtn.textContent = `攻击卡: ${atkCard.name} - 💰800${deckFull ? '（卡组满）' : ''}`;
    atkBtn.disabled = deckFull;
    atkBtn.onclick = () => {
        if (gameState.gold >= 800) { gameState.gold -= 800; gameState.deck.push({ ...atkCard }); updateBattleLog(`购买了 ${atkCard.name}！`); updateUI(); showShopModal(); }
        else updateBattleLog('金币不足！');
    };
    options.appendChild(atkBtn);

    const defCard = CARDS.defenseCards[randomInt(0, CARDS.defenseCards.length - 1)];
    const defBtn = document.createElement('button');
    defBtn.className = 'investment-option';
    defBtn.textContent = `防御卡: ${defCard.name} - 💰800${deckFull ? '（卡组满）' : ''}`;
    defBtn.disabled = deckFull;
    defBtn.onclick = () => {
        if (gameState.gold >= 800) { gameState.gold -= 800; gameState.deck.push({ ...defCard }); updateBattleLog(`购买了 ${defCard.name}！`); updateUI(); showShopModal(); }
        else updateBattleLog('金币不足！');
    };
    options.appendChild(defBtn);

    const workCard = CARDS.workCards[randomInt(0, CARDS.workCards.length - 1)];
    const workBtn = document.createElement('button');
    workBtn.className = 'investment-option';
    workBtn.textContent = `工作卡: ${workCard.name} - 💰1000${deckFull ? '（卡组满）' : ''}`;
    workBtn.disabled = deckFull;
    workBtn.onclick = () => {
        if (gameState.gold >= 1000) { gameState.gold -= 1000; gameState.deck.push({ ...workCard }); updateBattleLog(`购买了 ${workCard.name}！`); updateUI(); showShopModal(); }
        else updateBattleLog('金币不足！');
    };
    options.appendChild(workBtn);

    const healBtn = document.createElement('button');
    healBtn.className = 'investment-option';
    healBtn.textContent = '回血道具 - 💰300 (恢复30血条)';
    healBtn.onclick = () => {
        if (gameState.gold >= 300) { gameState.gold -= 300; gameState.hp = Math.min(gameState.maxHp, gameState.hp + 30); updateBattleLog('购买了回血道具，恢复30血条！'); updateUI(); showShopModal(); }
        else updateBattleLog('金币不足！');
    };
    options.appendChild(healBtn);

    const manaBtn = document.createElement('button');
    manaBtn.className = 'investment-option';
    manaBtn.textContent = '回蓝道具 - 💰300 (恢复30蓝条)';
    manaBtn.onclick = () => {
        if (gameState.gold >= 300) { gameState.gold -= 300; gameState.mp = Math.min(gameState.maxMp, gameState.mp + 30); updateBattleLog('购买了回蓝道具，恢复30蓝条！'); updateUI(); showShopModal(); }
        else updateBattleLog('金币不足！');
    };
    options.appendChild(manaBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'investment-option';
    closeBtn.textContent = '离开商店（进入下一节点）';
    closeBtn.onclick = () => continueAfterNonBattle();
    options.appendChild(closeBtn);

    modal.classList.remove('hidden');
}
