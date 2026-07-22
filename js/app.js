/* ========================================
   app.js — 应用入口（ES module）
   DOM 就绪后直接初始化，仅负责事件绑定和卡组查看
   ======================================== */

import { RTWP_CONFIG, SAVE_KEY } from './config.js';
import { gameState } from './state.js';
import { updateUI, updateBattleLog, getCardCostText, closeModal } from './utils.js';
import { renderUpgradeChips } from './cards.js';
import { togglePause, queueBattleLog, rtwpStopBattle, renderHandRTWP, showEnemy, continueAfterBattle } from './battle.js';
import { finishCardUpgrade } from './events.js';
import { saveGame, showStartModal, bindStartModal } from './save.js';
import { showNextNode } from './map.js';

// ==========================================
// 卡组查看
// ==========================================

function showDeckModal() {
    const modal = document.getElementById('deck-modal');
    const deckList = document.getElementById('deck-list');
    deckList.innerHTML = '';

    const cardGroups = { attack: [], defense: [], function: [], work: [] };
    gameState.deck.forEach(card => cardGroups[card.type].push(card));
    const typeNames = { attack: '攻击卡', defense: '防御卡', function: '功能卡', work: '工作卡' };

    for (const [type, cards] of Object.entries(cardGroups)) {
        if (cards.length === 0) continue;
        const groupTitle = document.createElement('h4');
        groupTitle.textContent = typeNames[type];
        groupTitle.style.cssText = 'color:#3498db; margin-top:15px;';
        deckList.appendChild(groupTitle);

        cards.forEach(card => {
            const upgradesHtml = renderUpgradeChips(card);
            const cardDiv = document.createElement('div');
            cardDiv.className = 'deck-card';
            cardDiv.innerHTML = `<div style="flex:1;"><span class="deck-card-name">${card.name}</span>${upgradesHtml ? `<div style="margin-top:4px;">${upgradesHtml}</div>` : ''}</div><span class="deck-card-count">${getCardCostText(card)}</span>`;
            cardDiv.style.cssText = 'display:flex; align-items:flex-start;';
            deckList.appendChild(cardDiv);
        });
    }
    modal.classList.remove('hidden');
}

// ==========================================
// 事件绑定与初始化（ES module 自动延迟，DOM 已就绪）
// ==========================================

const pauseHandler = () => {
    if (gameState.inBattle) togglePause();
    else showNextNode();
};
document.getElementById('btn-pause')?.addEventListener('click', pauseHandler);
document.getElementById('btn-end-turn')?.addEventListener('click', pauseHandler);

document.addEventListener('keydown', (e) => {
    if (!gameState.inBattle) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === RTWP_CONFIG.PAUSE_KEY) { e.preventDefault(); togglePause(); }
    if (e.code === RTWP_CONFIG.FAST_FORWARD_KEY) {
        e.preventDefault();
        gameState.rtwp.timeSpeed = gameState.rtwp.timeSpeed === 1.0 ? 2.0 : 1.0;
        queueBattleLog(gameState.rtwp.timeSpeed === 2.0 ? '⏩ 2x 加速' : '▶️ 正常速度');
    }
});

document.getElementById('btn-view-deck').addEventListener('click', showDeckModal);
document.getElementById('btn-save').addEventListener('click', () => {
    saveGame();
    if (gameState.inBattle) queueBattleLog('💾 游戏已保存！');
    else updateBattleLog('💾 游戏已保存！');
});
document.getElementById('btn-restart').addEventListener('click', () => {
    if (confirm('确定要回到启动屏吗？当前进度将保留（直到开始新游戏）。')) {
        rtwpStopBattle();
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        gameState.inBattle = false;
        gameState.currentEnemy = null;
        updateUI();
        showStartModal();
    }
});

document.getElementById('btn-close-battle-result').addEventListener('click', continueAfterBattle);
document.getElementById('btn-close-deck').addEventListener('click', () => closeModal('deck-modal'));
document.getElementById('btn-play-again').addEventListener('click', () => {
    closeModal('ending-modal');
    localStorage.removeItem(SAVE_KEY);
    showStartModal();
});
document.getElementById('btn-close-card-upgrade').addEventListener('click', () => finishCardUpgrade(true));

bindStartModal();
showStartModal();
updateUI();
