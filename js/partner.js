/* ========================================
   partner.js — 伴侣系统
   ======================================== */

import { PARTNERS } from './config.js';
import { gameState } from './state.js';
import { randomChoice, updateBattleLog, closeModal } from './utils.js';
import { checkGameOver } from './game-end.js';

export function initPartner() {
    const isDark = Math.random() < 0.2;
    const partnerTemplate = randomChoice(isDark ? PARTNERS.dark : PARTNERS.normal);
    gameState.partner = { ...partnerTemplate };
    gameState.partnerSatisfaction = partnerTemplate.initialSatisfaction;
    gameState.partnerStage = 1;
    gameState.partnerDarkMode = isDark;
    updateBattleLog(`💕 遇到了 ${partnerTemplate.name}，开始交往吧！`);
}

export function showPartnerModal() {
    const modal = document.getElementById('partner-modal');
    const title = document.getElementById('partner-title');
    const desc = document.getElementById('partner-description');
    const status = document.getElementById('partner-status');
    const options = document.getElementById('partner-options');
    const partner = gameState.partner;

    title.textContent = `💕 伴侣任务 - ${partner.name}`;
    const stageTexts = { 1: '阶段1: 确定关系', 2: '阶段2: 结婚', 3: '阶段3: 家庭赐福' };
    const stageDescs = {
        1: `与 ${partner.name} 的关系还在发展中...`,
        2: `${partner.name} 对你很满意，可以考虑结婚了！`,
        3: `${partner.name} 已成为你的伴侣，持续获得赐福效果！`
    };
    desc.textContent = stageDescs[gameState.partnerStage] || '';

    status.innerHTML = `
        <p>当前阶段: ${stageTexts[gameState.partnerStage] || ''}</p>
        <p>伴侣性格: ${partner.personality}</p>
        <p>满意度: ${gameState.partnerSatisfaction}/100</p>
        ${gameState.partnerDarkMode ? '<p style="color:#9b59b6">⚠️ 黑化模式</p>' : ''}`;
    options.innerHTML = '';

    if (gameState.partnerStage === 1) {
        const dateBtn = document.createElement('button');
        dateBtn.className = 'partner-option';
        dateBtn.textContent = '约会 💰300 ❤️10💙10';
        dateBtn.onclick = () => {
            if (gameState.gold >= 300 && gameState.hp >= 10 && gameState.mp >= 10) {
                gameState.gold -= 300; gameState.hp -= 10; gameState.mp -= 10;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 15);
                updatePartnerStage(); closeModal('partner-modal'); checkPartnerDarkMode();
            } else updateBattleLog('资源不足，无法约会！');
        };
        const giftBtn = document.createElement('button');
        giftBtn.className = 'partner-option';
        giftBtn.textContent = '送礼物 💰500';
        giftBtn.onclick = () => {
            if (gameState.gold >= 500) {
                gameState.gold -= 500;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 10);
                updatePartnerStage(); closeModal('partner-modal'); checkPartnerDarkMode();
            } else updateBattleLog('金币不足！');
        };
        const neglectBtn = document.createElement('button');
        neglectBtn.className = 'partner-option';
        neglectBtn.textContent = '专注工作（冷落伴侣）';
        neglectBtn.onclick = () => { gameState.partnerSatisfaction -= 10; closeModal('partner-modal'); checkPartnerDarkMode(); };
        options.appendChild(dateBtn); options.appendChild(giftBtn); options.appendChild(neglectBtn);
    }

    if (gameState.partnerStage === 2) {
        const marryBtn = document.createElement('button');
        marryBtn.className = 'partner-option';
        marryBtn.textContent = '结婚 💰2000 ❤️20💙20';
        marryBtn.onclick = () => {
            if (gameState.gold >= 2000 && gameState.hp >= 20 && gameState.mp >= 20) {
                gameState.gold -= 2000; gameState.hp -= 20; gameState.mp -= 20;
                gameState.partnerStage = 3;
                updateBattleLog(`💒 恭喜！你与 ${partner.name} 结婚了！获得赐福效果！`);
                closeModal('partner-modal'); checkPartnerDarkMode();
            } else updateBattleLog('资源不足，无法结婚！');
        };
        options.appendChild(marryBtn);
    }

    if (gameState.partnerStage === 3) {
        const accompanyBtn = document.createElement('button');
        accompanyBtn.className = 'partner-option';
        accompanyBtn.textContent = '陪伴 💙15';
        accompanyBtn.onclick = () => {
            if (gameState.mp >= 15) {
                gameState.mp -= 15;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 5);
                updateBattleLog(`💕 你陪伴了 ${partner.name}，满意度提升！`);
                closeModal('partner-modal'); checkPartnerDarkMode();
            }
        };
        const workFocusBtn = document.createElement('button');
        workFocusBtn.className = 'partner-option';
        workFocusBtn.textContent = '专注工作（消耗伴侣满意度）';
        workFocusBtn.onclick = () => { gameState.partnerSatisfaction -= 8; gameState.achievement += 5; closeModal('partner-modal'); checkPartnerDarkMode(); };
        options.appendChild(accompanyBtn); options.appendChild(workFocusBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'partner-option';
    closeBtn.textContent = '稍后再说';
    closeBtn.onclick = () => closeModal('partner-modal');
    options.appendChild(closeBtn);
    modal.classList.remove('hidden');
}

export function updatePartnerStage() {
    if (gameState.partnerStage === 1 && gameState.partnerSatisfaction >= 90) {
        gameState.partnerStage = 2;
        updateBattleLog(`💕 你与 ${gameState.partner.name} 的关系进展顺利！可以结婚了！`);
    }
}

export function checkPartnerDarkMode() {
    if (gameState.partnerDarkMode) return;
    if (gameState.partnerSatisfaction < gameState.partner.darkThreshold) {
        gameState.partnerDarkMode = true;
        updateBattleLog(`⚠️ ${gameState.partner.name} 进入黑化模式！赐福效果增强，但要求更苛刻！`);
    }
    checkGameOver();
}
