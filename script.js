/* ========================================
   职场卡牌冒险者：财富自由之路 - 游戏核心逻辑
   ======================================== */

// ==========================================
// 配置常量区 - 卡牌、怪物、事件配置
// ==========================================

// 初始资源
const INITIAL_RESOURCES = {
    hp: 100,
    maxHp: 100,
    mp: 100,
    maxMp: 100,
    gold: 5000,
    skill: 0,
    achievement: 0,
    authority: 0
};

// 战斗配置
const BATTLE_CONFIG = {
    cardsPerTurn: 5,
    maxCardsPerTurn: 5,
    playerDiceMin: 1,
    playerDiceMax: 6,
    enemyDiceMin: 1,
    enemyDiceMax: 6
};

// 卡牌定义
const CARDS = {
    // 攻击卡 - 消耗血条，造成伤害
    attackCards: [
        { id: 'atk1', name: '有效沟通', type: 'attack', costHp: 5, description: '消耗5血条，对敌人造成15点伤害', damage: 15 },
        { id: 'atk2', name: '高效执行', type: 'attack', costHp: 8, description: '消耗8血条，对敌人造成22点伤害', damage: 22 },
        { id: 'atk3', name: '逻辑说服', type: 'attack', costHp: 10, description: '消耗10血条，对敌人造成30点伤害', damage: 30 },
        { id: 'atk4', name: '专业硬刚', type: 'attack', costHp: 15, description: '消耗15血条，对敌人造成40点伤害', damage: 40 },
        { id: 'atk5', name: '方案落地', type: 'attack', costHp: 7, description: '消耗7血条，造成18点伤害，+2技能', damage: 18 }
    ],
    // 防御卡 - 消耗蓝条，获得护盾
    defenseCards: [
        { id: 'def1', name: '心态稳住', type: 'defense', costMp: 5, description: '消耗5蓝条，获得12点护盾', shield: 12 },
        { id: 'def2', name: '划水防御', type: 'defense', costMp: 8, description: '消耗8蓝条，获得18点护盾', shield: 18 },
        { id: 'def3', name: '加班硬扛', type: 'defense', costMp: 12, description: '消耗12蓝条，获得25点护盾', shield: 25 },
        { id: 'def4', name: '情绪脱敏', type: 'defense', costMp: 10, description: '消耗10蓝条，本回合免疫小额伤害', shield: 0, immuneSmall: true },
        { id: 'def5', name: '短暂摸鱼', type: 'defense', costMp: 6, description: '消耗6蓝条，获得8护盾，+3血条', shield: 8, healHp: 3 }
    ],
    // 功能卡 - 消耗金币/技能，产生特殊效果
    functionCards: [
        { id: 'func1', name: '摸鱼充电', type: 'function', costGold: 200, description: '消耗200金币，+15血条+10蓝条', healHp: 15, healMp: 10 },
        { id: 'func2', name: '求助同事', type: 'function', costSkill: 5, description: '消耗5技能，额外抽2张牌', drawCards: 2 },
        { id: 'func3', name: '职场buff', type: 'function', costMp: 8, description: '消耗8蓝条，本回合所有伤害+30%', damageBoost: 0.3 },
        { id: 'func4', name: '复盘优化', type: 'function', costHp: 5, description: '消耗5血条，下回合行动点+1', nextTurnBonus: 1 },
        { id: 'func5', name: '人脉借力', type: 'function', costAuthority: 10, description: '消耗10权威，抵挡一次敌人大招', blockNext: true }
    ],
    // 工作卡 - 消耗血条/蓝条，获取金币+技能+成就感+权威
    workCards: [
        { id: 'work1', name: '领取月薪', type: 'work', costHp: 5, costMp: 5, description: '消耗5血条+5蓝条，获得800金币', gold: 800, skill: 2, achievement: 2, authority: 1 },
        { id: 'work2', name: '项目奖金', type: 'work', costHp: 8, costMp: 8, description: '消耗8血条+8蓝条，获得1500金币', gold: 1500, skill: 4, achievement: 4, authority: 2 },
        { id: 'work3', name: '年终奖', type: 'work', costHp: 10, costMp: 10, description: '消耗10血条+10蓝条，获得3000金币', gold: 3000, skill: 6, achievement: 6, authority: 3 },
        { id: 'work4', name: '超额绩效', type: 'work', costHp: 12, costMp: 12, description: '消耗12血条+12蓝条，获得5000金币', gold: 5000, skill: 8, achievement: 8, authority: 5 },
        { id: 'work5', name: '快速完成任务', type: 'work', costHp: 6, costMp: 6, description: '消耗6血条+6蓝条，获得600金币，+3技能', gold: 600, skill: 3, achievement: 1, authority: 1 }
    ]
};

// 敌人定义
const ENEMIES = {
    common: [
        { name: '甩锅同事', hp: 30, damage: 8, skill: 1, gold: 150, exp: 2 },
        { name: '无尽会议', hp: 40, damage: 5, skill: 2, gold: 200, exp: 3 },
        { name: '改不完的BUG', hp: 35, damage: 10, skill: 2, gold: 180, exp: 2 },
        { name: '划水队友', hp: 25, damage: 3, skill: 1, gold: 120, exp: 1, reducePlayer收益: true }
    ],
    elite: [
        { name: '临时需求变更', hp: 60, damage: 15, skill: 4, gold: 400, exp: 5 },
        { name: '领导PUA', hp: 50, damage: 12, skill: 5, gold: 350, exp: 4, reduceShield: true },
        { name: '客户无理刁难', hp: 55, damage: 8, skill: 3, gold: 380, exp: 4, multiHit: true },
        { name: '季度绩效压力', hp: 70, damage: 10, skill: 6, gold: 500, exp: 6, damageEscalate: true }
    ],
    boss: [
        { name: '996加班深渊', hp: 120, damage: 18, skill: 10, gold: 1000, exp: 15 },
        { name: '职场内耗', hp: 100, damage: 15, skill: 8, gold: 800, exp: 12, debuffStack: true },
        { name: '中年职业危机', hp: 150, damage: 20, skill: 12, gold: 1500, exp: 20 },
        { name: '行业裁员潮', hp: 200, damage: 25, skill: 15, gold: 3000, exp: 30 }
    ]
};

// 随机事件
const RANDOM_EVENTS = {
    positive: [
        { title: '基金大涨', description: '你的投资基金收益不错！', effect: { goldPercent: 10 } },
        { title: '贵人带路', description: '前辈给你指点，获得技能提升！', effect: { skill: 5 } },
        { title: '副业爆单', description: '副业接单成功！', effect: { gold: 1200 } },
        { title: '理财分红', description: '理财产品分红到账！', effect: { goldPercent: 7 } },
        { title: '年终奖', description: '公司发放年终奖！', effect: { gold: 2000 } },
        { title: '成就感爆发', description: '完成重要项目，成就感满满！', effect: { achievement: 10 } },
        { title: '权威提升', description: '你在团队中的影响力提升了！', effect: { authority: 5 } }
    ],
    negative: [
        { title: '投资暴雷', description: '投资亏损严重！', effect: { goldPercent: -10 } },
        { title: '意外消费', description: '突发支出！', effect: { gold: -500 } },
        { title: '股市熊市', description: '股市大跌！', effect: { goldPercent: -8 } },
        { title: '被骗踩坑', description: '上当受骗了！', effect: { gold: -800, hp: -5 } },
        { title: '身体报警', description: '加班太狠，身体出问题！', effect: { hp: -10 } },
        { title: '精神压力', description: '压力太大，精神状态不佳！', effect: { mp: -10 } }
    ],
    risk: [
        { title: '创业机会', description: '有人邀请你一起创业，是否尝试？', effect: { risk: true, win: { goldPercent: 20 }, lose: { goldPercent: -20 } } },
        { title: '重仓炒股', description: '有个内幕消息，要不要梭哈？', effect: { risk: true, win: { goldPercent: 30 }, lose: { goldPercent: -15 } } },
        { title: '兼职试水', description: '有个兼职机会，收益未知', effect: { risk: true, win: { gold: 800 }, lose: { hp: -5 } } }
    ],
    neutral: [
        { title: '专注加班', description: '选择加班工作，获得稳定收益', effect: { gold: 500, hp: -3 } },
        { title: '请假调研', description: '请假去做市场调研，有机会获得高回报', effect: { gold: 0, risk: true, win: { goldPercent: 15 }, lose: { gold: -200 } } }
    ]
};

// 伴侣定义
const PARTNERS = {
    normal: [
        { name: '小雪',性格: '温柔体贴',家庭条件: '良好',初始满意度: 75,黑化阈值: 30,赐福效果: { damageBoost: 0.1, shieldBoost: 0.1 } },
        { name: '小林',性格: '独立自信',家庭条件: '中等',初始满意度: 70,黑化阈值: 35,赐福效果: { skillBoost: 0.15, achievementBoost: 0.1 } },
        { name: '阿华',性格: '活泼开朗',家庭条件: '普通',初始满意度: 65,黑化阈值: 40,赐福效果: { goldBoost: 0.1, authorityBoost: 0.1 } }
    ],
    dark: [
        { name: '神秘人X',性格: '神秘莫测',家庭条件: '不明',初始满意度: 50,黑化阈值: 50,赐福效果: { damageBoost: 0.25, skillBoost: 0.2 }, darkBlessing: true },
        { name: '黑影',性格: '难以捉摸',家庭条件: '未知',初始满意度: 45,黑化阈值: 55,赐福效果: { damageBoost: 0.3, authorityBoost: 0.2 }, darkBlessing: true }
    ]
};

// 节点类型
const NODE_TYPES = {
    BATTLE: 'battle',
    ELITE: 'elite',
    BOSS: 'boss',
    EVENT: 'event',
    REST: 'rest',
    SHOP: 'shop'
};

// ==========================================
// 游戏状态
// ==========================================

let gameState = {
    // 资源
    hp: INITIAL_RESOURCES.hp,
    maxHp: INITIAL_RESOURCES.maxHp,
    mp: INITIAL_RESOURCES.mp,
    maxMp: INITIAL_RESOURCES.maxMp,
    gold: INITIAL_RESOURCES.gold,
    skill: INITIAL_RESOURCES.skill,
    achievement: INITIAL_RESOURCES.achievement,
    authority: INITIAL_RESOURCES.authority,

    // 游戏进度
    floor: 1,
    nodeIndex: 0,
    totalNodes: 15,

    // 战斗状态
    inBattle: false,
    currentEnemy: null,
    playerShield: 0,
    playerDiceResult: 0,
    enemyDiceResult: 0,
    turnCount: 0,
    damageBoost: 0,
    blockNextEnemyAttack: false,

    // 卡组
    deck: [],
    hand: [],
    drawPile: [],
    discardPile: [],

    // 伴侣
    partner: null,
    partnerStage: 0, // 0: 无伴侣, 1: 确定关系, 2: 结婚, 3: 家庭赐福
    partnerSatisfaction: 0,
    partnerDarkMode: false,

    // 地图
    mapNodes: [],

    // 战斗增益
    tempDamageBoost: 0,
    nextTurnBonus: 0
};

// ==========================================
// 工具函数
// ==========================================

// 随机数生成
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机选择数组元素
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 掷骰子
function rollDice(min = 1, max = 6) {
    return randomInt(min, max);
}

// 更新UI显示
function updateUI() {
    // 资源显示
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

// 更新战斗日志
function updateBattleLog(message) {
    const log = document.getElementById('battle-log');
    log.innerHTML = message;
}

// 显示敌人信息
function showEnemy(enemy) {
    const enemyName = document.getElementById('enemy-name');
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const enemyHpText = document.getElementById('enemy-hp-text');
    const enemyIntent = document.getElementById('enemy-intent');

    enemyName.textContent = enemy.name;
    enemyHpBar.style.width = `${(enemy.currentHp / enemy.hp) * 100}%`;
    enemyHpText.textContent = `${enemy.currentHp}/${enemy.hp}`;

    // 敌人意图
    const intentText = enemyIntentCalculator(enemy);
    enemyIntent.textContent = `敌人意图: ${intentText}`;
}

// 计算敌人意图
function enemyIntentCalculator(enemy) {
    const damage = enemy.damage + Math.floor(gameState.authority / 10);
    return `准备造成 ${damage} 点伤害`;
}

// ==========================================
// 卡牌系统
// ==========================================

// 初始化卡组
function initDeck() {
    gameState.deck = [];

    // 添加初始攻击卡
    CARDS.attackCards.forEach(card => {
        gameState.deck.push({ ...card });
    });

    // 添加初始防御卡
    CARDS.defenseCards.forEach(card => {
        gameState.deck.push({ ...card });
    });

    // 添加初始功能卡
    CARDS.functionCards.forEach(card => {
        gameState.deck.push({ ...card });
    });

    // 添加初始工作卡
    CARDS.workCards.forEach(card => {
        gameState.deck.push({ ...card });
    });
}

// 抽卡
function drawCards(count) {
    for (let i = 0; i < count; i++) {
        if (gameState.drawPile.length === 0) {
            // 弃牌堆洗牌
            gameState.drawPile = [...gameState.discardPile];
            gameState.discardPile = [];
            shuffleArray(gameState.drawPile);
        }

        if (gameState.drawPile.length > 0) {
            const card = gameState.drawPile.pop();
            gameState.hand.push(card);
        }
    }

    renderHand();
}

// 弃牌
function discardHand() {
    gameState.discardPile.push(...gameState.hand);
    gameState.hand = [];
    renderHand();
}

// 打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 渲染手牌
function renderHand() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    gameState.hand.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = `card card-${card.type}`;

        // 检查是否能使用
        const canUse = canUseCard(card);

        if (!canUse) {
            cardElement.classList.add('disabled');
        }

        cardElement.innerHTML = `
            <div class="card-cost">${getCardCostText(card)}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${getCardTypeName(card.type)}</div>
            <div class="card-description">${card.description}</div>
        `;

        if (canUse) {
            cardElement.addEventListener('click', () => playCard(index));
        }

        container.appendChild(cardElement);
    });
}

// 获取卡牌消耗文本
function getCardCostText(card) {
    const costs = [];
    if (card.costHp) costs.push(`❤️${card.costHp}`);
    if (card.costMp) costs.push(`💙${card.costMp}`);
    if (card.costGold) costs.push(`💰${card.costGold}`);
    if (card.costSkill) costs.push(`⚡${card.costSkill}`);
    if (card.costAuthority) costs.push(`👑${card.costAuthority}`);
    if (costs.length === 0) return '0';
    return costs.join(' ');
}

// 获取卡牌类型名称
function getCardTypeName(type) {
    const names = {
        attack: '攻击',
        defense: '防御',
        function: '功能',
        work: '工作'
    };
    return names[type] || type;
}

// 检查卡牌是否能使用
function canUseCard(card) {
    if (card.costHp && gameState.hp < card.costHp) return false;
    if (card.costMp && gameState.mp < card.costMp) return false;
    if (card.costGold && gameState.gold < card.costGold) return false;
    if (card.costSkill && gameState.skill < card.costSkill) return false;
    if (card.costAuthority && gameState.authority < card.costAuthority) return false;
    return true;
}

// 出牌
function playCard(index) {
    const card = gameState.hand[index];

    // 消耗资源
    if (card.costHp) {
        gameState.hp -= card.costHp;
    }
    if (card.costMp) {
        gameState.mp -= card.costMp;
    }
    if (card.costGold) {
        gameState.gold -= card.costGold;
    }
    if (card.costSkill) {
        gameState.skill -= card.costSkill;
    }
    if (card.costAuthority) {
        gameState.authority -= card.costAuthority;
    }

    // 从手牌移除
    gameState.hand.splice(index, 1);
    gameState.discardPile.push(card);

    // 执行卡牌效果
    executeCardEffect(card);

    // 更新UI
    updateUI();
    renderHand();

    // 检查游戏结束条件
    checkGameOver();
}

// 执行卡牌效果
function executeCardEffect(card) {
    const logMessages = [];

    // 应用伴侣赐福效果
    let damageMultiplier = 1;
    let shieldMultiplier = 1;
    if (gameState.partner && gameState.partnerStage === 3) {
        const blessing = gameState.partner.赐福效果;
        if (blessing.damageBoost) damageMultiplier += blessing.damageBoost;
        if (blessing.shieldBoost) shieldMultiplier += blessing.shieldBoost;
        if (gameState.partnerDarkMode && blessing.damageBoost) damageMultiplier += blessing.damageBoost; // 黑化面加成
    }

    // 应用临时增益
    if (gameState.tempDamageBoost > 0) {
        damageMultiplier += gameState.tempDamageBoost;
    }

    switch (card.type) {
        case 'attack':
            // 计算玩家骰子点数
            const playerDice = rollDice(BATTLE_CONFIG.playerDiceMin, BATTLE_CONFIG.playerDiceMax) + Math.floor(gameState.skill / 5);
            gameState.playerDiceResult = playerDice;

            // 计算敌人骰子点数
            const enemyDice = rollDice(BATTLE_CONFIG.enemyDiceMin, BATTLE_CONFIG.enemyDiceMax);
            gameState.enemyDiceResult = enemyDice;

            // 计算伤害
            let damage = Math.floor(card.damage * damageMultiplier);
            const diceDiff = playerDice - enemyDice;

            if (diceDiff > 0) {
                // 玩家点数大，造成差值伤害
                damage += diceDiff * 2;
                gameState.currentEnemy.currentHp -= damage;
                logMessages.push(`🎲 你的点数: ${playerDice} vs 敌人点数: ${enemyDice}`);
                logMessages.push(`⚔️ ${card.name}！对敌人造成 ${damage} 点伤害！`);
            } else if (diceDiff < 0) {
                // 敌人点数大，玩家受到差值伤害
                const playerDamage = Math.abs(diceDiff) * 2;
                applyDamageToPlayer(playerDamage);
                logMessages.push(`🎲 你的点数: ${playerDice} vs 敌人点数: ${enemyDice}`);
                logMessages.push(`💔 被敌人反击，受到 ${playerDamage} 点伤害！`);
            } else {
                logMessages.push(`🎲 平局！点数都是 ${playerDice}`);
            }

            // 检查敌人是否死亡
            if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) {
                endBattle(true);
            }
            break;

        case 'defense':
            let shield = card.shield ? Math.floor(card.shield * shieldMultiplier) : 0;
            gameState.playerShield += shield;

            if (card.immuneSmall) {
                logMessages.push(`🛡️ 情绪脱敏！本回合免疫小额伤害！`);
                gameState.immuneSmallAttack = true;
            }

            if (card.healHp) {
                gameState.hp = Math.min(gameState.hp + card.healHp, gameState.maxHp);
                logMessages.push(`❤️ 恢复 ${card.healHp} 点血条！`);
            }

            logMessages.push(`🛡️ 获得 ${shield} 点护盾！`);
            break;

        case 'function':
            if (card.drawCards) {
                drawCards(card.drawCards);
                logMessages.push(`📚 额外抽 ${card.drawCards} 张牌！`);
            }

            if (card.healHp) {
                gameState.hp = Math.min(gameState.hp + card.healHp, gameState.maxHp);
                logMessages.push(`❤️ 恢复 ${card.healHp} 点血条！`);
            }

            if (card.healMp) {
                gameState.mp = Math.min(gameState.mp + card.healMp, gameState.maxMp);
                logMessages.push(`💙 恢复 ${card.healMp} 点蓝条！`);
            }

            if (card.damageBoost) {
                gameState.tempDamageBoost += card.damageBoost;
                logMessages.push(`⚡ 本回合伤害 +${Math.floor(card.damageBoost * 100)}%！`);
            }

            if (card.nextTurnBonus) {
                gameState.nextTurnBonus += card.nextTurnBonus;
                logMessages.push(`📈 下回合行动点 +${card.nextTurnBonus}！`);
            }

            if (card.blockNext) {
                gameState.blockNextEnemyAttack = true;
                logMessages.push(`🛡️ 抵挡一次敌人大招！`);
            }
            break;

        case 'work':
            // 工作卡：消耗血蓝，获取金币+技能+成就感+权威
            let goldGain = card.gold || 0;
            let skillGain = card.skill || 0;
            let achievementGain = card.achievement || 0;
            let authorityGain = card.authority || 0;

            // 应用伴侣赐福中的金币加成
            if (gameState.partner && gameState.partnerStage === 3 && gameState.partner.赐福效果.goldBoost) {
                goldGain = Math.floor(goldGain * (1 + gameState.partner.赐福效果.goldBoost));
            }

            gameState.gold += goldGain;
            gameState.skill += skillGain;
            gameState.achievement += achievementGain;
            gameState.authority += authorityGain;

            logMessages.push(`💼 ${card.name}！`);
            logMessages.push(`💰 +${goldGain} 金币 | ⚡ +${skillGain} 技能 | ✨ +${achievementGain} 成就感 | 👑 +${authorityGain} 权威`);

            // 额外骰子判定
            const workPlayerDice = rollDice() + Math.floor(gameState.skill / 10);
            const workEnemyDice = rollDice();

            if (workPlayerDice > workEnemyDice) {
                const bonusDamage = (workPlayerDice - workEnemyDice) * 3;
                if (gameState.currentEnemy) {
                    gameState.currentEnemy.currentHp -= bonusDamage;
                    logMessages.push(`🎲 工作判定胜利！额外造成 ${bonusDamage} 点伤害！`);
                }
            }

            // 检查敌人是否死亡
            if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) {
                endBattle(true);
            }
            break;
    }

    updateBattleLog(logMessages.join('<br>'));
}

// 对玩家造成伤害
function applyDamageToPlayer(damage) {
    // 先扣护盾
    if (gameState.playerShield > 0) {
        const shieldAbsorb = Math.min(gameState.playerShield, damage);
        gameState.playerShield -= shieldAbsorb;
        damage -= shieldAbsorb;
    }

    // 扣血条
    if (damage > 0) {
        // 检查是否有情绪脱敏
        if (gameState.immuneSmallAttack && damage <= 5) {
            updateBattleLog(`🛡️ 情绪脱敏！免疫了 ${damage} 点小额伤害！`);
            gameState.immuneSmallAttack = false;
            damage = 0;
        }
    }

    if (damage > 0) {
        gameState.hp -= damage;
    }

    updateUI();
}

// ==========================================
// 战斗系统
// ==========================================

// 开始战斗
function startBattle(enemy) {
    gameState.inBattle = true;
    gameState.currentEnemy = { ...enemy, currentHp: enemy.hp };
    gameState.playerShield = 0;
    gameState.turnCount = 0;
    gameState.tempDamageBoost = 0;
    gameState.immuneSmallAttack = false;
    gameState.blockNextEnemyAttack = false;

    // 重置抽牌堆
    gameState.drawPile = [...gameState.deck];
    shuffleArray(gameState.drawPile);
    gameState.hand = [];
    gameState.discardPile = [];

    // 抽初始手牌
    drawCards(BATTLE_CONFIG.cardsPerTurn);

    // 显示敌人
    showEnemy(gameState.currentEnemy);
    updateBattleLog(`⚔️ 遭遇 ${enemy.name}！开始战斗！`);

    updateUI();
}

// 结束回合
function endTurn() {
    if (!gameState.inBattle) return;

    // 敌人回合
    enemyTurn();

    // 检查游戏结束
    if (checkGameOver()) return;

    // 清理本回合状态
    gameState.tempDamageBoost = 0;
    gameState.immuneSmallAttack = false;

    // 弃牌
    discardHand();

    // 新回合
    gameState.turnCount++;

    // 下回合额外行动点
    const bonusCards = gameState.nextTurnBonus > 0 ? gameState.nextTurnBonus : 0;
    gameState.nextTurnBonus = 0;

    // 抽牌
    drawCards(BATTLE_CONFIG.cardsPerTurn + bonusCards);

    updateUI();
}

// 敌人回合
function enemyTurn() {
    if (!gameState.currentEnemy) return;

    const enemy = gameState.currentEnemy;
    const enemyDamage = enemy.damage + Math.floor(gameState.authority / 10);

    // 检查是否能抵挡
    if (gameState.blockNextEnemyAttack) {
        updateBattleLog(`🛡️ 人脉借力！抵挡了 ${enemy.name} 的攻击！`);
        gameState.blockNextEnemyAttack = false;
        return;
    }

    // 敌人骰子
    const enemyDice = rollDice(BATTLE_CONFIG.enemyDiceMin, BATTLE_CONFIG.enemyDiceMax);

    // 特殊敌人效果
    if (enemy.multiHit) {
        // 多次小额攻击
        const hits = randomInt(2, 3);
        let totalDamage = 0;
        for (let i = 0; i < hits; i++) {
            const hitDamage = Math.floor(enemyDamage / 3);
            applyDamageToPlayer(hitDamage);
            totalDamage += hitDamage;
        }
        updateBattleLog(`💢 ${enemy.name} 发动多重攻击！共受到 ${totalDamage} 点伤害！`);
    } else if (enemy.damageEscalate) {
        // 递增伤害
        const escalateDamage = enemyDamage + (gameState.turnCount * 3);
        applyDamageToPlayer(escalateDamage);
        updateBattleLog(`📈 ${enemy.name} 压力递增！造成 ${escalateDamage} 点伤害！`);
    } else if (enemy.debuffStack) {
        // 叠加debuff
        const debuffDamage = enemyDamage + (gameState.turnCount * 2);
        applyDamageToPlayer(debuffDamage);
        gameState.authority = Math.max(0, gameState.authority - 1); // 降低权威
        updateBattleLog(`🔮 ${enemy.name} 叠加内耗！受到 ${debuffDamage} 伤害，权威-1！`);
    } else {
        // 普通攻击
        applyDamageToPlayer(enemyDamage);
        updateBattleLog(`💢 ${enemy.name} 攻击！造成 ${enemyDamage} 点伤害！`);
    }

    updateUI();
}

// 结束战斗
function endBattle(victory) {
    gameState.inBattle = false;

    if (victory) {
        const enemy = gameState.currentEnemy;

        // 获得奖励
        const goldReward = enemy.gold + Math.floor(gameState.floor * 50);
        const skillReward = enemy.skill || 0;
        const achievementReward = enemy.exp || 0;
        const authorityReward = Math.floor(enemy.exp / 2) || 0;

        gameState.gold += goldReward;
        gameState.skill += skillReward;
        gameState.achievement += achievementReward;
        gameState.authority += authorityReward;

        // 显示结算弹窗
        showBattleResult(true, {
            gold: goldReward,
            skill: skillReward,
            achievement: achievementReward,
            authority: authorityReward
        });

        // 30%概率触发投资事件
        if (Math.random() < 0.3) {
            setTimeout(() => {
                triggerRandomEvent();
            }, 500);
        }
    }

    // 清理战斗状态
    gameState.currentEnemy = null;
    gameState.playerShield = 0;

    updateUI();
}

// 显示战斗结算
function showBattleResult(victory, rewards) {
    const modal = document.getElementById('battle-result-modal');
    const title = document.getElementById('battle-result-title');
    const content = document.getElementById('battle-result-content');

    if (victory) {
        title.textContent = '🎉 战斗胜利！';
        title.className = 'victory';
        content.innerHTML = `
            <p>恭喜你击败了敌人！</p>
            <p>💰 金币 +${rewards.gold}</p>
            <p>⚡ 技能 +${rewards.skill}</p>
            <p>✨ 成就感 +${rewards.achievement}</p>
            <p>👑 权威 +${rewards.authority}</p>
        `;
    } else {
        title.textContent = '💀 战斗失败';
        title.className = 'defeat';
        content.innerHTML = `<p>你被敌人击败了...</p>`;
    }

    modal.classList.remove('hidden');
}

// ==========================================
// 事件系统
// ==========================================

// 触发随机事件
function triggerRandomEvent() {
    const eventCategories = ['positive', 'negative', 'risk', 'neutral'];
    const weights = [0.25, 0.25, 0.25, 0.25]; // 暂时平均分配
    const rand = Math.random();

    let category;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
            category = eventCategories[i];
            break;
        }
    }

    const event = randomChoice(RANDOM_EVENTS[category]);
    showEventModal(event);
}

// 显示事件弹窗
function showEventModal(event) {
    const modal = document.getElementById('event-modal');
    const title = document.getElementById('event-title');
    const desc = document.getElementById('event-description');
    const options = document.getElementById('event-options');

    title.textContent = event.title;
    desc.textContent = event.description;

    // 根据事件类型显示选项
    options.innerHTML = '';

    if (event.effect.risk) {
        // 风险事件：接受/拒绝
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'event-option';
        acceptBtn.textContent = '接受挑战';
        acceptBtn.onclick = () => {
            applyRiskEffect(event.effect);
            closeModal('event-modal');
        };

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'event-option';
        rejectBtn.textContent = '拒绝（无损失）';
        rejectBtn.onclick = () => {
            closeModal('event-modal');
        };

        options.appendChild(acceptBtn);
        options.appendChild(rejectBtn);
    } else {
        // 普通事件：确认
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'event-option';
        confirmBtn.textContent = '确认';
        confirmBtn.onclick = () => {
            applyEffect(event.effect);
            closeModal('event-modal');
        };
        options.appendChild(confirmBtn);
    }

    modal.classList.remove('hidden');
}

// 应用效果
function applyEffect(effect) {
    const messages = [];

    if (effect.gold) {
        gameState.gold += effect.gold;
        messages.push(`💰 金币 ${effect.gold > 0 ? '+' : ''}${effect.gold}`);
    }

    if (effect.goldPercent) {
        const change = Math.floor(gameState.gold * effect.goldPercent / 100);
        gameState.gold += change;
        messages.push(`💰 金币 ${change > 0 ? '+' : ''}${change} (${effect.goldPercent}%)`);
    }

    if (effect.hp) {
        gameState.hp = Math.max(0, Math.min(gameState.maxHp, gameState.hp + effect.hp));
        messages.push(`❤️ 血条 ${effect.hp > 0 ? '+' : ''}${effect.hp}`);
    }

    if (effect.mp) {
        gameState.mp = Math.max(0, Math.min(gameState.maxMp, gameState.mp + effect.mp));
        messages.push(`💙 蓝条 ${effect.mp > 0 ? '+' : ''}${effect.mp}`);
    }

    if (effect.skill) {
        gameState.skill += effect.skill;
        messages.push(`⚡ 技能 +${effect.skill}`);
    }

    if (effect.achievement) {
        gameState.achievement += effect.achievement;
        messages.push(`✨ 成就感 +${effect.achievement}`);
    }

    if (effect.authority) {
        gameState.authority += effect.authority;
        messages.push(`👑 权威 +${effect.authority}`);
    }

    updateBattleLog(messages.join('<br>'));
    updateUI();
    checkGameOver();
}

// 应用风险效果
function applyRiskEffect(effect) {
    const success = Math.random() > 0.5;
    const resultEffect = success ? effect.win : effect.lose;

    if (success) {
        updateBattleLog(`🎲 风险判定成功！`);
    } else {
        updateBattleLog(`🎲 风险判定失败！`);
    }

    applyEffect(resultEffect);
}

// ==========================================
// 伴侣系统
// ==========================================

// 初始化伴侣
function initPartner() {
    // 正常伴侣概率80%，黑化伴侣概率20%
    const isDark = Math.random() < 0.2;
    const partnerPool = isDark ? PARTNERS.dark : PARTNERS.normal;

    const partnerTemplate = randomChoice(partnerPool);

    gameState.partner = { ...partnerTemplate };
    gameState.partnerSatisfaction = partnerTemplate.初始满意度;
    gameState.partnerStage = 1;
    gameState.partnerDarkMode = isDark;

    updateBattleLog(`💕 遇到了 ${partnerTemplate.name}，开始交往吧！`);
}

// 伴侣任务弹窗
function showPartnerModal() {
    const modal = document.getElementById('partner-modal');
    const title = document.getElementById('partner-title');
    const desc = document.getElementById('partner-description');
    const status = document.getElementById('partner-status');
    const options = document.getElementById('partner-options');

    const partner = gameState.partner;

    title.textContent = `💕 伴侣任务 - ${partner.name}`;

    // 根据阶段显示不同内容
    let stageText = '';
    switch (gameState.partnerStage) {
        case 1:
            stageText = '阶段1: 确定关系';
            desc.textContent = `与 ${partner.name} 的关系还在发展中...`;
            break;
        case 2:
            stageText = '阶段2: 结婚';
            desc.textContent = `${partner.name} 对你很满意，可以考虑结婚了！`;
            break;
        case 3:
            stageText = '阶段3: 家庭赐福';
            desc.textContent = `${partner.name} 已成为你的伴侣，持续获得赐福效果！`;
            break;
    }

    status.innerHTML = `
        <p>当前阶段: ${stageText}</p>
        <p>伴侣性格: ${partner.性格}</p>
        <p>满意度: ${gameState.partnerSatisfaction}/100</p>
        ${gameState.partnerDarkMode ? '<p style="color:#9b59b6">⚠️ 黑化模式</p>' : ''}
    `;

    // 选项
    options.innerHTML = '';

    // 阶段1选项
    if (gameState.partnerStage === 1) {
        // 约会 - 消耗金币+蓝条
        const dateBtn = document.createElement('button');
        dateBtn.className = 'partner-option';
        dateBtn.textContent = '约会 💰300 ❤️10💙10';
        dateBtn.onclick = () => {
            if (gameState.gold >= 300 && gameState.hp >= 10 && gameState.mp >= 10) {
                gameState.gold -= 300;
                gameState.hp -= 10;
                gameState.mp -= 10;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 15);
                updatePartnerStage();
                closeModal('partner-modal');
                checkPartnerDarkMode();
            } else {
                updateBattleLog('资源不足，无法约会！');
            }
        };

        // 送礼物 - 消耗金币
        const giftBtn = document.createElement('button');
        giftBtn.className = 'partner-option';
        giftBtn.textContent = '送礼物 💰500';
        giftBtn.onclick = () => {
            if (gameState.gold >= 500) {
                gameState.gold -= 500;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 10);
                updatePartnerStage();
                closeModal('partner-modal');
                checkPartnerDarkMode();
            } else {
                updateBattleLog('金币不足！');
            }
        };

        // 冷落 - 降低满意度
        const neglectBtn = document.createElement('button');
        neglectBtn.className = 'partner-option';
        neglectBtn.textContent = '专注工作（冷落伴侣）';
        neglectBtn.onclick = () => {
            gameState.partnerSatisfaction -= 10;
            closeModal('partner-modal');
            checkPartnerDarkMode();
        };

        options.appendChild(dateBtn);
        options.appendChild(giftBtn);
        options.appendChild(neglectBtn);
    }

    // 阶段2选项
    if (gameState.partnerStage === 2) {
        const marryBtn = document.createElement('button');
        marryBtn.className = 'partner-option';
        marryBtn.textContent = '结婚 💰2000 ❤️20💙20';
        marryBtn.onclick = () => {
            if (gameState.gold >= 2000 && gameState.hp >= 20 && gameState.mp >= 20) {
                gameState.gold -= 2000;
                gameState.hp -= 20;
                gameState.mp -= 20;
                gameState.partnerStage = 3;
                updateBattleLog(`💒 恭喜！你与 ${partner.name} 结婚了！获得赐福效果！`);
                closeModal('partner-modal');
                checkPartnerDarkMode();
            } else {
                updateBattleLog('资源不足，无法结婚！');
            }
        };
        options.appendChild(marryBtn);
    }

    // 阶段3选项 - 维持赐福
    if (gameState.partnerStage === 3) {
        const accompanyBtn = document.createElement('button');
        accompanyBtn.className = 'partner-option';
        accompanyBtn.textContent = '陪伴 💙15';
        accompanyBtn.onclick = () => {
            if (gameState.mp >= 15) {
                gameState.mp -= 15;
                gameState.partnerSatisfaction = Math.min(100, gameState.partnerSatisfaction + 5);
                updateBattleLog(`💕 你陪伴了 ${partner.name}，满意度提升！`);
                closeModal('partner-modal');
                checkPartnerDarkMode();
            }
        };
        options.appendChild(accompanyBtn);

        const workFocusBtn = document.createElement('button');
        workFocusBtn.className = 'partner-option';
        workFocusBtn.textContent = '专注工作（消耗伴侣满意度）';
        workFocusBtn.onclick = () => {
            gameState.partnerSatisfaction -= 8;
            gameState.achievement += 5;
            closeModal('partner-modal');
            checkPartnerDarkMode();
        };
        options.appendChild(workFocusBtn);
    }

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'partner-option';
    closeBtn.textContent = '稍后再说';
    closeBtn.onclick = () => closeModal('partner-modal');
    options.appendChild(closeBtn);

    modal.classList.remove('hidden');
}

// 更新伴侣阶段
function updatePartnerStage() {
    // 根据满意度更新阶段
    if (gameState.partnerStage === 1 && gameState.partnerSatisfaction >= 90) {
        gameState.partnerStage = 2;
        updateBattleLog(`💕 你与 ${gameState.partner.name} 的关系进展顺利！可以结婚了！`);
    }
}

// 检查伴侣黑化
function checkPartnerDarkMode() {
    if (gameState.partnerDarkMode) return; // 已经是黑化

    if (gameState.partnerSatisfaction < gameState.partner.黑化阈值) {
        gameState.partnerDarkMode = true;
        updateBattleLog(`⚠️ ${gameState.partner.name} 进入黑化模式！赐福效果增强，但要求更苛刻！`);
    }

    checkGameOver();
}

// ==========================================
// 地图系统
// ==========================================

// 初始化地图
function initMap() {
    gameState.mapNodes = [];
    gameState.nodeIndex = 0;

    // 生成15个节点
    const nodeTypes = [
        NODE_TYPES.BATTLE, NODE_TYPES.BATTLE, NODE_TYPES.BATTLE,
        NODE_TYPES.ELITE,
        NODE_TYPES.EVENT, NODE_TYPES.EVENT,
        NODE_TYPES.REST,
        NODE_TYPES.SHOP,
        NODE_TYPES.BATTLE, NODE_TYPES.BATTLE, NODE_TYPES.EVENT,
        NODE_TYPES.BOSS // 每层最后一个是BOSS
    ];

    for (let i = 0; i < gameState.totalNodes; i++) {
        let nodeType;
        if (i === gameState.totalNodes - 1) {
            nodeType = NODE_TYPES.BOSS;
        } else {
            nodeType = randomChoice(nodeTypes);
        }

        gameState.mapNodes.push({
            type: nodeType,
            visited: false,
            floor: gameState.floor
        });
    }
}

// 显示地图选择
function showMapModal() {
    const modal = document.getElementById('map-modal');
    const nodesContainer = document.getElementById('map-nodes');

    nodesContainer.innerHTML = '';

    gameState.mapNodes.forEach((node, index) => {
        if (node.visited) return; // 已访问的节点不显示

        const nodeBtn = document.createElement('button');
        nodeBtn.className = 'event-option';

        let nodeText = '';
        switch (node.type) {
            case NODE_TYPES.BATTLE:
                nodeText = `第${index + 1}节点 - 普通战斗`;
                break;
            case NODE_TYPES.ELITE:
                nodeText = `第${index + 1}节点 - 精英战斗`;
                break;
            case NODE_TYPES.BOSS:
                nodeText = `第${index + 1}节点 - BOSS战`;
                break;
            case NODE_TYPES.EVENT:
                nodeText = `第${index + 1}节点 - 随机事件`;
                break;
            case NODE_TYPES.REST:
                nodeText = `第${index + 1}节点 - 休息`;
                break;
            case NODE_TYPES.SHOP:
                nodeText = `第${index + 1}节点 - 商店`;
                break;
        }

        nodeBtn.textContent = nodeText;
        nodeBtn.onclick = () => {
            closeModal('map-modal');
            handleNodeSelection(index);
        };

        nodesContainer.appendChild(nodeBtn);
    });

    modal.classList.remove('hidden');
}

// 处理节点选择
function handleNodeSelection(index) {
    const node = gameState.mapNodes[index];
    node.visited = true;
    gameState.nodeIndex = index;

    switch (node.type) {
        case NODE_TYPES.BATTLE:
            const commonEnemy = randomChoice(ENEMIES.common);
            startBattle(commonEnemy);
            break;

        case NODE_TYPES.ELITE:
            const eliteEnemy = randomChoice(ENEMIES.elite);
            startBattle(eliteEnemy);
            break;

        case NODE_TYPES.BOSS:
            const bossEnemy = randomChoice(ENEMIES.boss);
            startBattle(bossEnemy);
            break;

        case NODE_TYPES.EVENT:
            triggerRandomEvent();
            break;

        case NODE_TYPES.REST:
            // 休息回血
            const restHeal = 20;
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + restHeal);
            gameState.mp = Math.min(gameState.maxMp, gameState.mp + restHeal);
            updateBattleLog(`😴 休息了一下！恢复 ${restHeal} 点血条和蓝条！`);

            // 提供伴侣陪伴选项
            if (gameState.partner) {
                showPartnerModal();
            }
            break;

        case NODE_TYPES.SHOP:
            showShopModal();
            break;
    }

    updateUI();

    // 检查是否通关本层
    if (index >= gameState.totalNodes - 1 || checkFloorComplete()) {
        advanceFloor();
    }
}

// 检查楼层是否完成
function checkFloorComplete() {
    return gameState.mapNodes.every(node => node.visited);
}

// 进入下一层
function advanceFloor() {
    if (gameState.floor >= 3) {
        // 通关全部楼层
        checkVictory();
        return;
    }

    gameState.floor++;
    initMap();
    updateBattleLog(`🏰 进入第 ${gameState.floor} 层！`);
    updateUI();

    // 显示地图选择
    setTimeout(() => {
        showMapModal();
    }, 1000);
}

// ==========================================
// 商店系统
// ==========================================

function showShopModal() {
    const modal = document.getElementById('investment-modal');
    const title = document.getElementById('investment-title');
    const desc = document.getElementById('investment-description');
    const options = document.getElementById('investment-options');

    title.textContent = '🏪 商店';
    desc.textContent = '购买强力卡牌和道具！';

    options.innerHTML = '';

    // 攻击卡购买
    const atkCard = CARDS.attackCards[randomInt(0, CARDS.attackCards.length - 1)];
    const atkBtn = document.createElement('button');
    atkBtn.className = 'investment-option';
    atkBtn.textContent = `攻击卡: ${atkCard.name} - 💰800`;
    atkBtn.onclick = () => {
        if (gameState.gold >= 800) {
            gameState.gold -= 800;
            gameState.deck.push({ ...atkCard });
            updateBattleLog(`购买了 ${atkCard.name}！`);
            closeModal('investment-modal');
        }
    };
    options.appendChild(atkBtn);

    // 防御卡购买
    const defCard = CARDS.defenseCards[randomInt(0, CARDS.defenseCards.length - 1)];
    const defBtn = document.createElement('button');
    defBtn.className = 'investment-option';
    defBtn.textContent = `防御卡: ${defCard.name} - 💰800`;
    defBtn.onclick = () => {
        if (gameState.gold >= 800) {
            gameState.gold -= 800;
            gameState.deck.push({ ...defCard });
            updateBattleLog(`购买了 ${defCard.name}！`);
            closeModal('investment-modal');
        }
    };
    options.appendChild(defBtn);

    // 工作卡购买
    const workCard = CARDS.workCards[randomInt(0, CARDS.workCards.length - 1)];
    const workBtn = document.createElement('button');
    workBtn.className = 'investment-option';
    workBtn.textContent = `工作卡: ${workCard.name} - 💰1000`;
    workBtn.onclick = () => {
        if (gameState.gold >= 1000) {
            gameState.gold -= 1000;
            gameState.deck.push({ ...workCard });
            updateBattleLog(`购买了 ${workCard.name}！`);
            closeModal('investment-modal');
        }
    };
    options.appendChild(workBtn);

    // 回血道具
    const healBtn = document.createElement('button');
    healBtn.className = 'investment-option';
    healBtn.textContent = '回血道具 - 💰300 (恢复30血条)';
    healBtn.onclick = () => {
        if (gameState.gold >= 300) {
            gameState.gold -= 300;
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + 30);
            updateBattleLog('购买了回血道具，恢复30血条！');
            closeModal('investment-modal');
        }
    };
    options.appendChild(healBtn);

    // 回蓝道具
    const manaBtn = document.createElement('button');
    manaBtn.className = 'investment-option';
    manaBtn.textContent = '回蓝道具 - 💰300 (恢复30蓝条)';
    manaBtn.onclick = () => {
        if (gameState.gold >= 300) {
            gameState.gold -= 300;
            gameState.mp = Math.min(gameState.maxMp, gameState.mp + 30);
            updateBattleLog('购买了回蓝道具，恢复30蓝条！');
            closeModal('investment-modal');
        }
    };
    options.appendChild(manaBtn);

    // 关闭
    const closeBtn = document.createElement('button');
    closeBtn.className = 'investment-option';
    closeBtn.textContent = '离开商店';
    closeBtn.onclick = () => closeModal('investment-modal');
    options.appendChild(closeBtn);

    modal.classList.remove('hidden');
}

// ==========================================
// 游戏结束判定
// ==========================================

// 检查游戏结束
function checkGameOver() {
    if (gameState.hp <= 0) {
        showEnding('defeat', '💀 你的身体撑不住了...游戏结束。');
        return true;
    }

    if (gameState.mp <= 0) {
        showEnding('defeat', '💀 你的精神崩溃了...游戏结束。');
        return true;
    }

    if (gameState.gold < -10000) {
        showEnding('defeat', '💀 你彻底破产了...游戏结束。');
        return true;
    }

    // 检查胜利条件：总资产 >= 1000万
    if (gameState.gold >= 10000000) {
        checkVictory();
        return true;
    }

    return false;
}

// 检查胜利
function checkVictory() {
    if (gameState.gold >= 10000000) {
        let endingText = '🏆 恭喜！你达成了财富自由！\n\n';
        endingText += `最终资产: ${gameState.gold.toLocaleString()} 金币\n`;
        endingText += `楼层: ${gameState.floor}\n`;
        endingText += `技能: ${gameState.skill}\n`;
        endingText += `成就感: ${gameState.achievement}\n`;
        endingText += `权威: ${gameState.authority}\n`;

        if (gameState.partner && gameState.partnerStage === 3) {
            endingText += `伴侣: ${gameState.partner.name} 💕`;
        }

        showEnding('victory', endingText);
        return true;
    }

    if (gameState.floor >= 3 && gameState.mapNodes.every(n => n.visited)) {
        // 通关3层但资产不足
        showEnding('defeat', '💀 你完成了冒险，但没有达成财富自由目标...\n\n继续努力吧！');
        return true;
    }

    return false;
}

// 显示结局弹窗
function showEnding(type, message) {
    const modal = document.getElementById('ending-modal');
    const title = document.getElementById('ending-title');
    const desc = document.getElementById('ending-description');

    if (type === 'victory') {
        title.textContent = '🎉 财富自由！';
        title.className = 'victory';
    } else {
        title.textContent = '💀 游戏结束';
        title.className = 'defeat';
    }

    desc.innerHTML = message.replace(/\n/g, '<br>');
    modal.classList.remove('hidden');
}

// ==========================================
// 弹窗控制
// ==========================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ==========================================
// 存档系统
// ==========================================

// 保存游戏
function saveGame() {
    const saveData = {
        hp: gameState.hp,
        mp: gameState.mp,
        gold: gameState.gold,
        skill: gameState.skill,
        achievement: gameState.achievement,
        authority: gameState.authority,
        floor: gameState.floor,
        nodeIndex: gameState.nodeIndex,
        deck: gameState.deck,
        partner: gameState.partner,
        partnerStage: gameState.partnerStage,
        partnerSatisfaction: gameState.partnerSatisfaction,
        partnerDarkMode: gameState.partnerDarkMode,
        mapNodes: gameState.mapNodes
    };

    localStorage.setItem('careerCardGame_save', JSON.stringify(saveData));
    updateBattleLog('💾 游戏已保存！');
}

// 加载游戏
function loadGame() {
    const saveStr = localStorage.getItem('careerCardGame_save');
    if (!saveStr) {
        updateBattleLog('没有找到存档！');
        return false;
    }

    try {
        const saveData = JSON.parse(saveStr);
        Object.assign(gameState, saveData);
        updateUI();
        updateBattleLog('📂 游戏已加载！');
        return true;
    } catch (e) {
        updateBattleLog('读取存档失败！');
        return false;
    }
}

// 重置游戏
function resetGame() {
    localStorage.removeItem('careerCardGame_save');

    gameState = {
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
        totalNodes: 15,
        inBattle: false,
        currentEnemy: null,
        playerShield: 0,
        playerDiceResult: 0,
        enemyDiceResult: 0,
        turnCount: 0,
        damageBoost: 0,
        blockNextEnemyAttack: false,
        deck: [],
        hand: [],
        drawPile: [],
        discardPile: [],
        partner: null,
        partnerStage: 0,
        partnerSatisfaction: 0,
        partnerDarkMode: false,
        mapNodes: [],
        tempDamageBoost: 0,
        nextTurnBonus: 0
    };

    initDeck();
    initMap();
    initPartner();
    updateUI();
    updateBattleLog('🎮 游戏已重新开始！准备好你的职场冒险了吗？');

    // 关闭所有弹窗
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// ==========================================
// 卡组查看
// ==========================================

function showDeckModal() {
    const modal = document.getElementById('deck-modal');
    const deckList = document.getElementById('deck-list');

    deckList.innerHTML = '';

    // 按类型分组
    const cardGroups = {
        attack: [],
        defense: [],
        function: [],
        work: []
    };

    gameState.deck.forEach(card => {
        cardGroups[card.type].push(card);
    });

    const typeNames = {
        attack: '攻击卡',
        defense: '防御卡',
        function: '功能卡',
        work: '工作卡'
    };

    for (const [type, cards] of Object.entries(cardGroups)) {
        if (cards.length === 0) continue;

        const groupTitle = document.createElement('h4');
        groupTitle.textContent = typeNames[type];
        groupTitle.style.color = '#3498db';
        groupTitle.style.marginTop = '15px';
        deckList.appendChild(groupTitle);

        cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'deck-card';
            cardDiv.innerHTML = `
                <span class="deck-card-name">${card.name}</span>
                <span class="deck-card-count">${getCardCostText(card)}</span>
            `;
            deckList.appendChild(cardDiv);
        });
    }

    modal.classList.remove('hidden');
}

// ==========================================
// 事件绑定
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 结束回合按钮
    document.getElementById('btn-end-turn').addEventListener('click', () => {
        if (gameState.inBattle) {
            endTurn();
        } else {
            showMapModal();
        }
    });

    // 查看卡组按钮
    document.getElementById('btn-view-deck').addEventListener('click', showDeckModal);

    // 保存进度按钮
    document.getElementById('btn-save').addEventListener('click', saveGame);

    // 重新开始按钮
    document.getElementById('btn-restart').addEventListener('click', () => {
        if (confirm('确定要重新开始吗？当前进度将丢失。')) {
            resetGame();
        }
    });

    // 战斗结算弹窗关闭
    document.getElementById('btn-close-battle-result').addEventListener('click', () => {
        closeModal('battle-result-modal');
        if (!gameState.inBattle && !gameState.currentEnemy) {
            showMapModal();
        }
    });

    // 卡组弹窗关闭
    document.getElementById('btn-close-deck').addEventListener('click', () => {
        closeModal('deck-modal');
    });

    // 结局弹窗 - 再玩一次
    document.getElementById('btn-play-again').addEventListener('click', () => {
        closeModal('ending-modal');
        resetGame();
    });

    // 初始化游戏
    resetGame();
});

// ==========================================
// 辅助函数
// ==========================================

// 显示状态栏数值
function getCardTypeName(type) {
    const names = {
        attack: '攻击',
        defense: '防御',
        function: '功能',
        work: '工作'
    };
    return names[type] || type;
}