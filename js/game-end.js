/* ========================================
   game-end.js — 游戏结束/胜利判定
   独立文件，零循环依赖，被所有模块安全引用
   ======================================== */

import { gameState } from './state.js';
import { FLOW_CONFIG } from './config.js';

export function checkGameOver() {
    if (gameState.hp <= 0) { showEnding('defeat', '💀 你的身体撑不住了...游戏结束。'); return true; }
    if (gameState.mp <= 0) { showEnding('defeat', '💀 你的精神崩溃了...游戏结束。'); return true; }
    if (gameState.gold < -10000) { showEnding('defeat', '💀 你彻底破产了...游戏结束。'); return true; }
    if (gameState.gold >= FLOW_CONFIG.victoryGold) { checkVictory(); return true; }
    return false;
}

export function checkVictory() {
    if (gameState.gold >= FLOW_CONFIG.victoryGold) {
        let endingText = '🏆 恭喜！你达成了财富自由！\n\n';
        endingText += `最终资产: ${gameState.gold.toLocaleString()} 金币\n`;
        endingText += `楼层: ${gameState.floor}\n技能: ${gameState.skill}\n成就感: ${gameState.achievement}\n权威: ${gameState.authority}\n`;
        if (gameState.partner && gameState.partnerStage === 3) endingText += `伴侣: ${gameState.partner.name} 💕`;
        showEnding('victory', endingText);
        return true;
    }
    if (gameState.floor >= 3 && gameState.mapNodes.every(n => n.visited)) {
        showEnding('defeat', '💀 你完成了冒险，但没有达成财富自由目标...\n\n继续努力吧！');
        return true;
    }
    return false;
}

function showEnding(type, message) {
    // 使用 DOM API 直接操作，避免循环依赖
    const modal = document.getElementById('ending-modal');
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-description');
    if (modal && title && desc) {
        if (type === 'victory') { title.textContent = '🎉 财富自由！'; title.className = 'victory'; }
        else { title.textContent = '💀 游戏结束'; title.className = 'defeat'; }
        desc.innerHTML = message.replace(/\n/g, '<br>');
        modal.classList.remove('hidden');
    }
}
