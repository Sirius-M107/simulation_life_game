/* ========================================
   骑士卡牌冒险者：财富自由之路 - 游戏核心逻辑
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
    enemyDiceMax: 6,
    // 每个节点允许的玩家行动点数（本 demo 内每回合=1 次出牌，5 张手牌可选）
    actionsPerTurn: 1,
};

// 卡组与流程
const FLOW_CONFIG = {
    deckSizeMax: 25,             // 卡组硬上限（防止商店无限膨胀）
    nodesPerFloor: 15,           // 每层节点数（00-总览 §1.5）
    totalFloors: 3,              // 总层数
    victoryGold: 10000000,       // 通关所需财富（00 §1.2 / 00 §1.4）
};

// 存档键名
const SAVE_KEY = 'careerCardGame_save';
const SAVE_VERSION = '2.0-demonstration';

// 卡牌定义（按 01-卡牌系统.md §2-5 骑士版本）
// 攻击卡大多改为 MP 消耗（战斧猛劈为高阶，唯一保留 HP 消耗）
// 属性徽章：成就感 = 🎖️ / 影响力 = 👑（与 05 §4.3 配色一致：金/紫）
const CARDS = {
    // 攻击卡 - 冷兵器命名，造成伤害
    attackCards: [
        { id: 'atk1', name: '英勇冲锋', type: 'attack', costMp: 5,  description: 'MP 5，骑枪直刺，以气势力压对手，造成 15 伤害', damage: 15, attributes: ['achievement'] },
        { id: 'atk2', name: '长剑斩击', type: 'attack', costMp: 8,  description: 'MP 8，双手握剑全力劈砍，造成 22 伤害', damage: 22, attributes: ['authority'] },
        { id: 'atk3', name: '双手重击', type: 'attack', costMp: 10, description: 'MP 10，沉肩坠肘，重劈而下，造成 30 伤害', damage: 30, attributes: ['achievement', 'authority'] },
        { id: 'atk4', name: '战斧猛劈', type: 'attack', costHp: 15, description: 'HP 15（高阶卡），战斧高举蓄力劈下，造成 40 伤害', damage: 40, attributes: ['authority'] },
        { id: 'atk5', name: '骑枪冲刺', type: 'attack', costMp: 7,  description: 'MP 7，策马挺枪贯穿敌阵，造成 18 伤害', damage: 18, attributes: ['achievement', 'authority'] }
    ],
    // 防御卡 - MP 消耗，获得护盾或免疫效果
    defenseCards: [
        { id: 'def1', name: '举盾防御', type: 'defense', costMp: 5,  description: 'MP 5，竖起盾牌抵御攻击，获得 12 护盾', shield: 12 },
        { id: 'def2', name: '格挡架势', type: 'defense', costMp: 8,  description: 'MP 8，摆出格挡姿势减少伤害，获得 18 护盾', shield: 18 },
        { id: 'def3', name: '坚守阵地', type: 'defense', costMp: 12, description: 'MP 12，坚守阵地寸步不让，获得 25 护盾', shield: 25 },
        { id: 'def4', name: '意志坚定', type: 'defense', costMp: 10, description: 'MP 10，骑士意志坚定，本回合免疫小额伤害', shield: 0, immuneSmall: true },
        { id: 'def5', name: '短暂休整', type: 'defense', costMp: 6,  description: 'MP 6，趁机休整恢复体力，获得 8 护盾且 +3 HP', shield: 8, healHp: 3 }
    ],
    // 功能卡 - 各种资源消耗 + 机制效果
    functionCards: [
        { id: 'func1', name: '冥想恢复', type: 'function', costGold: 200,      description: '金币 200，冥想恢复身心，+15 HP +10 MP', healHp: 15, healMp: 10 },
        { id: 'func2', name: '呼唤援军', type: 'function', costSkill: 5,       description: '技能 5，呼唤同伴前来助战，额外抽 2 张牌', drawCards: 2 },
        { id: 'func3', name: '战斗怒吼', type: 'function', costMp: 8,           description: 'MP 8，发出战吼鼓舞士气，本回合所有伤害 +30%', damageBoost: 0.3 },
        { id: 'func4', name: '战术复盘', type: 'function', costHp: 5,           description: 'HP 5，战后复盘优化战术，下回合行动点 +1', nextTurnBonus: 1 },
        { id: 'func5', name: '贵族庇护', type: 'function', costAuthority: 10,   description: '影响力 10，利用贵族身份抵挡一次敌人大招', blockNext: true }
    ],
    // 委托卡 - HP + MP 双重消耗，换取金币 + 四维度
    workCards: [
        { id: 'work1', name: '完成悬赏', type: 'work', costHp: 5,  costMp: 5,  description: 'HP 5 + MP 5，完成领主悬赏任务，获得 800 金币', gold: 800,  skill: 2, achievement: 2, authority: 1 },
        { id: 'work2', name: '护送商队', type: 'work', costHp: 8,  costMp: 8,  description: 'HP 8 + MP 8，护送商队安全到达，获得 1500 金币', gold: 1500, skill: 4, achievement: 4, authority: 2 },
        { id: 'work3', name: '探索遗迹', type: 'work', costHp: 10, costMp: 10, description: 'HP 10 + MP 10，探索古老遗迹宝藏，获得 3000 金币', gold: 3000, skill: 6, achievement: 6, authority: 3 },
        { id: 'work4', name: '讨伐恶龙', type: 'work', costHp: 12, costMp: 12, description: 'HP 12 + MP 12，接受讨伐恶龙任务，获得 5000 金币', gold: 5000, skill: 8, achievement: 8, authority: 5 },
        { id: 'work5', name: '清理地城', type: 'work', costHp: 6,  costMp: 6,  description: 'HP 6 + MP 6，清理地下城小怪，获得 600 金币 +3 技能', gold: 600, skill: 3, achievement: 1, authority: 1 }
    ]
};

// 敌人定义（按 02-怪物与战斗.md §1 骑士主题怪物）
// 普通怪 4 只 + 精英怪 4 只 + BOSS 9 只（3 层 × 每层 3 选 1）
const ENEMIES = {
    common: [
        { name: '哥布林掠夺者', hp: 30, damage: 8,  skill: 1, gold: 150, exp: 2, flavor: '喜欢偷窃——这年头生意难做' },
        { name: '史莱姆沼泽妖', hp: 40, damage: 5,  skill: 2, gold: 200, exp: 3, flavor: '自称沼泽诗人，其实只会吐泡泡' },
        { name: '森林地精',     hp: 35, damage: 10, skill: 2, gold: 180, exp: 2, flavor: '藏在草丛中突袭过路旅人' },
        { name: '荒野野狼',     hp: 25, damage: 3,  skill: 1, gold: 120, exp: 1, flavor: '成群结队，降低玩家收益', reduceReward: true }
    ],
    elite: [
        { name: '堕落骑士', hp: 70, damage: 15, skill: 4, gold: 400, exp: 5, flavor: '被荣誉击倒的同袍——剑术依然凌厉', shieldBreak: true },
        { name: '黑暗法师', hp: 55, damage: 12, skill: 5, gold: 350, exp: 4, flavor: '心灵压制，削减你的护盾', reduceShield: true },
        { name: '狼人',     hp: 60, damage: 8,  skill: 3, gold: 380, exp: 4, flavor: '群攻特性，爪如刀', multiHit: true },
        { name: '食人魔',   hp: 80, damage: 10, skill: 6, gold: 500, exp: 6, flavor: '越拖越强——伤害随回合递增', damageEscalate: true }
    ],
    boss: [
        // 第一层 BOSS
        { name: '远古巨龙',   hp: 180, damage: 18, skill: 10, gold: 1500, exp: 18, flavor: '自称永恒之王——其实大部分时间在睡觉' },
        { name: '深渊领主',   hp: 160, damage: 15, skill: 8,  gold: 1300, exp: 15, flavor: '持续削弱来访者的心智', debuffStack: true },
        { name: '魔兽之王',   hp: 200, damage: 20, skill: 12, gold: 1800, exp: 22, flavor: '攻防双高，奖励丰厚' },
        // 第二层 BOSS
        { name: '霜焰凤凰',   hp: 170, damage: 16, skill: 10, gold: 1600, exp: 20, flavor: '冰火双属性伤害，每两回合叠加' },
        { name: '诅咒石像鬼', hp: 210, damage: 14, skill: 9,  gold: 1500, exp: 18, flavor: '反弹部分物理伤害' },
        { name: '暗影巫王',   hp: 180, damage: 18, skill: 11, gold: 1700, exp: 22, flavor: '诅咒使你每回合少抽 1 张牌' },
        // 第三层 BOSS（最终层）
        { name: '混沌之主',   hp: 280, damage: 25, skill: 18, gold: 3000, exp: 40, flavor: '终极挑战——通关可获最高评价' },
        { name: '虚空领航者', hp: 240, damage: 22, skill: 16, gold: 2800, exp: 35, flavor: '命中后剥夺你的行动力' },
        { name: '远古梦魇',   hp: 260, damage: 24, skill: 17, gold: 3200, exp: 42, flavor: '每回合召唤 1 个普通小怪助战' }
    ]
};

// 卡牌升级事件（变招/追击，按 01 §6.4 + 03 §6）
// 触发器：
//   usage_2   : 本场战斗该卡累计使用次数 ≥ 2
//   dupe_2    : 出牌时手牌中同名卡（不含本张）≥ 2
//   hp_le_20  : 怪物处于终结态（currentHp/maxHp ≤ 0.2）
//   per_use   : 每次使用都触发（适合防御 / 功能）
const CARD_UPGRADES = {
    // —— 变招类（variation） ——
    variation_pierce:   { id: 'variation_pierce',   name: '变招·穿刺', kind: 'variation', trigger: 'usage_2',
                         effect: '第 2 次使用变为穿透形态，无视敌方护盾', color: '#c0504d',
                         apply: ctx => ({ ignoreShield: true }) },
    variation_chain:    { id: 'variation_chain',    name: '变招·连斩', kind: 'variation', trigger: 'usage_2',
                         effect: '第 2 次使用追加 50% 伤害', color: '#c0504d',
                         apply: ctx => ({ damageBonus: 0.5 }) },
    variation_cleave:   { id: 'variation_cleave',   name: '变招·裂地', kind: 'variation', trigger: 'usage_2',
                         effect: '第 2 次使用变为群攻形态，伤害降至 50% 但附加溅射', color: '#c0504d',
                         apply: ctx => ({ damageMul: 0.5, splash: true }) },
    variation_execute:  { id: 'variation_execute',  name: '变招·终结', kind: 'variation', trigger: 'hp_le_20',
                         effect: '终结态下伤害 +100%（与终结属性加成叠加）', color: '#c0504d',
                         apply: ctx => ({ damageBonus: 1.0, requiresFinisher: true }) },

    // —— 追击类（pursuit） ——
    pursuit_strike:     { id: 'pursuit_strike',     name: '追击·连携', kind: 'pursuit', trigger: 'dupe_2',
                         effect: '手牌同名 ≥2 张时，打出追加 50% 伤害', color: '#4a7a8a',
                         apply: ctx => ({ damageBonus: 0.5 }) },
    pursuit_bleed:      { id: 'pursuit_bleed',      name: '追击·流血', kind: 'pursuit', trigger: 'dupe_2',
                         effect: '手牌同名 ≥2 张时，打出追加 50% 伤害 + 目标流血 3 回合', color: '#4a7a8a',
                         apply: ctx => ({ damageBonus: 0.5, bleed: 3 }) },
    pursuit_armor_break:{ id: 'pursuit_armor_break',name: '追击·破甲', kind: 'pursuit', trigger: 'dupe_2',
                         effect: '手牌同名 ≥2 张时，打出追加 50% 伤害 + 破甲（怪物下回合护盾 -25%）', color: '#4a7a8a',
                         apply: ctx => ({ damageBonus: 0.5, armorBreak: true }) },

    // —— 新增：通配变招（per_use） ——
    // 你这次明确要求"大部分动作可变招"。下面两个变招对所有动作牌（含防御/功能）每次有效。
    variation_momentum: { id: 'variation_momentum', name: '变招·蓄势', kind: 'variation', trigger: 'per_use',
                         effect: '每次使用：若上回合已出过同名牌，本回合费用 -20%（不低于 1）', color: '#c0504d',
                         apply: ctx => ({ costReduction: 0.2 }) },
    pursuit_echo:       { id: 'pursuit_echo',       name: '追击·回响', kind: 'pursuit', trigger: 'per_use',
                         effect: '每次使用：本张牌结算后立即免费追加 1 次（不消耗行动点）', color: '#4a7a8a',
                         apply: ctx => ({ echo: true }) }
};

// 4 个卡牌升级事件池（03 §6.3）
const CARD_UPGRADE_EVENTS = {
    'knight_mentor':    { title: '老骑士的指点',  description: '剑招不止一种，看你悟性。',
                          pool: ['variation_pierce', 'pursuit_strike', 'pursuit_armor_break'],
                          choices: 2, weight: 1 },
    'ancient_scroll':   { title: '古武残卷',      description: '山洞里捡到一本残破剑谱，记载"连斩"心法。',
                          pool: ['variation_chain', 'pursuit_strike'],
                          choices: 2, weight: 1 },
    'black_market':     { title: '黑市商人',      description: '"这张追击符贴在你的剑上，保证一剑三连。"',
                          pool: ['pursuit_bleed', 'pursuit_armor_break', 'variation_execute'],
                          choices: 3, weight: 1, cost: 1000 },
    'secret_vault':     { title: '宗门密藏',      description: '藏经阁中有一式"裂地"，可将剑气化为群攻。',
                          pool: ['variation_cleave', 'variation_execute'],
                          choices: 1, weight: 0.5 }
};

// 随机事件（按 03 §2-5 骑士主题事件）
const RANDOM_EVENTS = {
    positive: [
        { title: '发现宝藏',  description: '你发现了前人埋藏的宝藏——等等，这是你自己埋的', effect: { goldPercent: 10 } },
        { title: '获得祝福',  description: '神秘老人给你祝福——"记得带礼物回去"', effect: { skill: 5 } },
        { title: '捕获猎物',  description: '你捕获了一只会下金蛋的史莱姆——它其实只会吐泡泡', effect: { gold: 1200 } },
        { title: '王室分红',  description: '领主说你表现不错——"这是股息，不是奖金"', effect: { goldPercent: 7 } },
        { title: '领主赏赐',  description: '领主赏赐你——条件是帮他写三封情书', effect: { gold: 2000 } },
        { title: '成就感爆发', description: '完成重要项目，成就感满满', effect: { achievement: 10 } },
        { title: '授予爵位',  description: '你被授予骑士称号——"恭喜成为骑士老爷"', effect: { authority: 5 } }
    ],
    negative: [
        { title: '遭遇陷阱',  description: '你踩到了自己之前埋的陷阱——"防贼防到底"', effect: { goldPercent: -10 } },
        { title: '遭遇盗贼',  description: '盗贼说"此路是我开"——你反问他执照', effect: { gold: -500 } },
        { title: '迷失方向',  description: '你自信地往东走了三小时——地图显示你在原地转圈', effect: { goldPercent: -8 } },
        { title: '中毒受伤',  description: '你吃了野生蘑菇——恭喜解锁"拉肚子"debuff', effect: { gold: -800, hp: -5 } },
        { title: '疲惫不堪',  description: '你连续战斗了三天——马都比你精神', effect: { hp: -10 } },
        { title: '士气低落',  description: '你听到有人说"这骑士好像不太行"', effect: { mp: -10 } }
    ],
    risk: [
        { title: '进入未知洞穴', description: '洞穴里可能有宝藏——也可能有宝藏形状的怪物', effect: { risk: true, win: { goldPercent: 20 }, lose: { goldPercent: -20 } } },
        { title: '挑战守卫',     description: '守卫说"打赢我就让你过"——他没说你打不赢怎么办', effect: { risk: true, win: { goldPercent: 30 }, lose: { goldPercent: -15 } } },
        { title: '接受委托',     description: '委托人说"肯定赚钱"——他说的货币单位是"未来"', effect: { risk: true, win: { gold: 800 }, lose: { hp: -5 } } }
    ],
    neutral: [
        { title: '狩猎训练', description: '你练习狩猎技术——射中了一只路过的兔子', effect: { gold: 500, hp: -3 } },
        { title: '探索废墟', description: '废墟里可能有宝藏——也可能有"惊喜"', effect: { gold: 0, risk: true, win: { goldPercent: 15 }, lose: { gold: -200 } } }
    ]
};

// 伴侣定义
//
// TODO(07-JKQ同伴体系设计): 当前 5 NPC（3 正常 + 2 黑化）来自 04-伴侣系统.md，
//      将在 [07-JKQ同伴体系设计.md §1.5 / §4.5] 重写为 12 花牌（4J + 4K + 4Q，
//      法式扑克牌历史原型：查理曼 / 大卫 / 朱迪思 / 奥杰尔 / 拉结 / 雅典娜…）
//      + 内雅（杜尔西内娅致敬，梦幻位） + 隐藏玩家（Meta 位）。
//      本 demo 内暂保留 04 体系，已通过黑化阈值和赐福类型组（4 类：
//      抽牌 / 减伤 / debuff / 重抽）保留与 07 的接口兼容。
//
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
    nodesPerFloor: FLOW_CONFIG.nodesPerFloor,

    // 战斗状态
    inBattle: false,
    currentEnemy: null,
    playerShield: 0,
    playerDiceResult: 0,
    enemyDiceResult: 0,
    turnCount: 0,
    actionsUsedThisTurn: 0,
    damageBoost: 0,
    blockNextEnemyAttack: false,
    isFinisherState: false,         // 当前怪物是否处于终结态（02 / 05 §4.2）

    // 卡组
    deck: [],
    hand: [],
    drawPile: [],
    discardPile: [],
    cardUsageCount: {},             // 变招触发器：本场战斗每张基础卡的累计使用次数

    // 伴侣
    partner: null,
    partnerStage: 0, // 0: 无伴侣, 1: 确定关系, 2: 结婚, 3: 家庭赐福
    partnerSatisfaction: 0,
    partnerDarkMode: false,

    // 地图
    mapNodes: [],
    layerBossSeed: 0,               // 每层 BOSS 随机种子（05 §5.1，存档兼容）

    // 战斗增益
    tempDamageBoost: 0,
    nextTurnBonus: 0,
    immuneSmallAttack: false,

    // 已触发事件 / 完美终结记录（05 §5.1）
    triggeredEvents: [],
    perfectFinishers: [],

    saveVersion: SAVE_VERSION,
    saveTime: 0
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
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_atk_${Math.random().toString(36).slice(2, 8)}` });
    });

    // 添加初始防御卡
    CARDS.defenseCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_def_${Math.random().toString(36).slice(2, 8)}` });
    });

    // 添加初始功能卡
    CARDS.functionCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_fun_${Math.random().toString(36).slice(2, 8)}` });
    });

    // 添加初始工作卡
    CARDS.workCards.forEach(card => {
        gameState.deck.push({ ...card, upgrades: [], instanceId: `inst_wor_${Math.random().toString(36).slice(2, 8)}` });
    });
}

// 为一张卡挂载变招/追击
// targetCard: 卡牌对象（必须已在 gameState.deck 或 gameState.hand 中）
// upgradeId: CARD_UPGRADES 中的 key
function attachUpgradeToCard(targetCard, upgradeId) {
    if (!targetCard) return false;
    if (!CARD_UPGRADES[upgradeId]) return false;
    if (!targetCard.upgrades) targetCard.upgrades = [];
    if (targetCard.upgrades.includes(upgradeId)) return false; // 同一卡不重复挂
    targetCard.upgrades.push(upgradeId);
    const def = CARD_UPGRADES[upgradeId];
    updateBattleLog(`📜 卡牌 [${targetCard.name}] 习得 [${def.name}]！${def.effect}`);
    return true;
}

// 触发器判定
// ctx = { card, usageCount, dupesInHand, inFinisherState }
function shouldTriggerUpgrade(upgrade, ctx) {
    if (!upgrade) return false;
    switch (upgrade.trigger) {
        case 'usage_2':  return ctx.usageCount >= 2;
        case 'dupe_2':   return ctx.dupesInHand >= 2;
        case 'hp_le_20': return ctx.inFinisherState;
        case 'per_use':  return true;
        default:         return false;
    }
}

// 触发管线：在 executeCardEffect 攻击/防御/功能分支结算前调用
// 返回 { bonusMul, bonusFlat, ignoreShield, echo, costReduction, ... } 聚合效果
function aggregateUpgradeEffects(card) {
    if (!card.upgrades || card.upgrades.length === 0) return null;
    const upgrades = card.upgrades.map(uid => CARD_UPGRADES[uid]).filter(Boolean);
    if (upgrades.length === 0) return null;

    // 触发器各自需要的数据
    const usageCount = gameState.cardUsageCount[card.id] || 0;
    const dupesInHand = gameState.hand.filter(c => c.id === card.id && c !== card).length;
    const inFinisherState = gameState.isFinisherState === true;

    // 攻击牌只允许 attack 类的升级被触发；防御牌允许 variation/pursuit（per_use 类总是允许）
    // 通用规则：每张升级独立判定自身 trigger
    const fired = [];
    for (const u of upgrades) {
        if (shouldTriggerUpgrade(u, { usageCount, dupesInHand, inFinisherState })) {
            fired.push(u);
        }
    }
    if (fired.length === 0) return null;

    // 聚合效果
    const agg = {
        damageBonus: 0,           // 百分比加成（+0.5 表示 +50%）
        damageMul: 1,             // 百分比倍率（独立，例如裂地的 0.5）
        ignoreShield: false,
        splash: false,
        bleed: 0,
        armorBreak: false,
        echo: false,
        costReduction: 0,
        labels: []
    };
    for (const u of fired) {
        const eff = u.apply({});
        agg.labels.push(u.name);
        if (eff.damageBonus) agg.damageBonus += eff.damageBonus;
        if (eff.damageMul && eff.damageMul !== 1) agg.damageMul *= eff.damageMul;
        if (eff.ignoreShield) agg.ignoreShield = true;
        if (eff.splash) agg.splash = true;
        if (eff.bleed) agg.bleed = Math.max(agg.bleed, eff.bleed);
        if (eff.armorBreak) agg.armorBreak = true;
        if (eff.echo) agg.echo = true;
        if (eff.costReduction) agg.costReduction = Math.max(agg.costReduction, eff.costReduction);
    }
    return agg;
}

// 判定一张牌是否被升级弹窗视为"动作牌"（可挂载目标）
function isActionCard(card) {
    if (!card) return false;
    return ['attack', 'defense', 'function'].includes(card.type);
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

        // 属性徽章（05 §4.1：成就感/影响力），右上角已有消耗圆，下方角放属性
        const attrBadges = (card.attributes || [])
            .map(a => a === 'achievement' ? '<span class="attr-badge attr-achievement" title="成就感">🎖️</span>'
                                          : a === 'authority' ? '<span class="attr-badge attr-authority" title="影响力">👑</span>'
                                                               : '')
            .join('');

        // 变招/追击徽章（最多 2 个，溢出折叠为 +N）
        const upgradesChips = renderUpgradeChips(card);

        cardElement.innerHTML = `
            <div class="card-cost">${getCardCostText(card)}</div>
            ${attrBadges ? `<div class="card-attrs">${attrBadges}</div>` : ''}
            <div class="card-name">${card.name}</div>
            <div class="card-type">${getCardTypeName(card.type)}</div>
            <div class="card-description">${card.description}</div>
            ${upgradesChips ? `<div class="upgrade-chips">${upgradesChips}</div>` : ''}
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
    const isEcho = card._isEcho === true;

    // 每回合 1 次行动点（追击·回响产生的 echo 牌不计行动点）
    if (!isEcho && gameState.actionsUsedThisTurn >= BATTLE_CONFIG.actionsPerTurn) {
        updateBattleLog('⏳ 本回合行动点已耗尽，请点"结束回合"。');
        return;
    }

    // 消耗资源（echo 牌免费，但若挂了变招·蓄势仍享受减费）
    const costReduction = (() => {
        const probe = aggregateUpgradeEffects(card);
        return probe?.costReduction || 0;
    })();
    const applyReduced = (val) => Math.max(1, Math.floor(val * (1 - costReduction)));

    if (card.costHp && !isEcho) gameState.hp = Math.max(0, gameState.hp - applyReduced(card.costHp));
    if (card.costMp && !isEcho) gameState.mp = Math.max(0, gameState.mp - applyReduced(card.costMp));
    if (card.costGold && !isEcho) gameState.gold -= Math.max(1, Math.floor(card.costGold * (1 - costReduction)));
    if (card.costSkill && !isEcho) gameState.skill -= Math.max(1, Math.floor(card.costSkill * (1 - costReduction)));
    if (card.costAuthority && !isEcho) gameState.authority -= Math.max(1, Math.floor(card.costAuthority * (1 - costReduction)));

    // 从手牌移除
    gameState.hand.splice(index, 1);
    gameState.discardPile.push(card);
    if (!isEcho) gameState.actionsUsedThisTurn++;

    // 执行卡牌效果
    executeCardEffect(card);

    // 更新UI
    updateUI();
    renderHand();

    // 检查游戏结束条件
    if (checkGameOver()) return;
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
            // 玩家投骰（双方独立投骰制）
            const playerDice = rollDice(BATTLE_CONFIG.playerDiceMin, BATTLE_CONFIG.playerDiceMax);
            gameState.playerDiceResult = playerDice;
            const enemyDice = rollDice(BATTLE_CONFIG.enemyDiceMin, BATTLE_CONFIG.enemyDiceMax);
            gameState.enemyDiceResult = enemyDice;

            // 技能伤害加成：skillBonus = 1 + skill/200（05 §7.1 / 02 §3.2 合并公式）
            const skillBonus = 1 + gameState.skill / 200;
            // 骰子倍率：1→0.5x、2/3→1x、4→1.5x、5→2x、6→3x（杀戮尖塔风格近似公式）
            const diceMul = ({1: 0.5, 2: 1, 3: 1, 4: 1.5, 5: 2, 6: 3})[playerDice] || 1;
            // 综合倍率：赐福 + 本回合功能卡伤害 buff
            const totalMult = damageMultiplier * skillBonus * (1 + gameState.tempDamageBoost) * diceMul;
            let damage = Math.floor(card.damage * totalMult);

            // 变招/追击聚合效果（attack 分支专属）
            const upgradeAgg = aggregateUpgradeEffects(card);
            if (upgradeAgg) {
                if (upgradeAgg.damageMul !== 1) damage = Math.floor(damage * upgradeAgg.damageMul);
                if (upgradeAgg.damageBonus > 0) damage = Math.floor(damage * (1 + upgradeAgg.damageBonus));
                logMessages.push(`🔄 ${upgradeAgg.labels.join(' + ')} 发动！${upgradeAgg.damageBonus > 0 ? `伤害 +${Math.round(upgradeAgg.damageBonus * 100)}%` : ''}${upgradeAgg.ignoreShield ? '（无视护盾）' : ''}${upgradeAgg.splash ? '（溅射）' : ''}${upgradeAgg.armorBreak ? '（破甲）' : ''}`);
            }

            // 成就感应：成就 /20 概率暴击（双倍）
            const critChance = gameState.achievement / 20;
            if (Math.random() < critChance) damage = Math.floor(damage * 2);

            // 终结态：进入终结态时伤害 ≥ 当前 HP 才算"完美终结"（02 §3 / 05 §4.2）
            if (gameState.currentEnemy && gameState.currentEnemy.currentHp > 0) {
                const hpPercent = gameState.currentEnemy.currentHp / gameState.currentEnemy.hp;
                if (hpPercent <= 0.2) {
                    gameState.isFinisherState = true;
                }
            }

            const enemyWasAlive = gameState.currentEnemy && gameState.currentEnemy.currentHp > 0;
            if (gameState.currentEnemy) {
                gameState.currentEnemy.currentHp = Math.max(0, gameState.currentEnemy.currentHp - damage);
            }

            // 追击·流血 debuff 落地
            if (upgradeAgg && upgradeAgg.bleed > 0 && gameState.currentEnemy && gameState.currentEnemy.currentHp > 0) {
                gameState.currentEnemy.bleed = (gameState.currentEnemy.bleed || 0) + upgradeAgg.bleed;
                logMessages.push(`🩸 目标被挂上流血（${upgradeAgg.bleed} 回合）`);
            }
            // 追击·破甲落地
            if (upgradeAgg && upgradeAgg.armorBreak && gameState.currentEnemy) {
                gameState.currentEnemy.armorBroken = (gameState.currentEnemy.armorBroken || 0) + 1;
                logMessages.push(`🛡️‍💥 目标被破甲（${gameState.currentEnemy.armorBroken} 层）`);
            }

            logMessages.push(`🎲 你的骰子: ${playerDice}（×${diceMul}），敌人骰子: ${enemyDice}`);
            logMessages.push(`⚔️ ${card.name}！对敌人造成 ${damage} 点伤害！${critChance > 0 && Math.random() < critChance ? '（暴击）' : ''}`);

            // 终结态击杀判定（05 §4.2 完美终结）
            if (enemyWasAlive && gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0 && gameState.isFinisherState) {
                logMessages.push(`✨ 完美终结！`);
                gameState.perfectFinishers.push({ name: gameState.currentEnemy.name, at: Date.now() });
            }

            // 记录本场卡牌使用次数（变招触发器数据来源）
            gameState.cardUsageCount[card.id] = (gameState.cardUsageCount[card.id] || 0) + 1;

            // 追击·回响：免费追加 1 次（本回合）
            if (upgradeAgg && upgradeAgg.echo && !gameState._echoedThisTurn) {
                gameState._echoedThisTurn = (gameState._echoedThisTurn || {});
                gameState._echoedThisTurn[card.id] = true;
                // 把这张牌重新加回手牌（变种版本：标记为"可再使用一次"）
                gameState.hand.push({ ...card, _isEcho: true });
                renderHand();
                logMessages.push(`🔁 追击·回响：${card.name} 可再使用 1 次（不消耗行动点）`);
            }

            // 检查敌人是否死亡
            if (gameState.currentEnemy && gameState.currentEnemy.currentHp <= 0) {
                endBattle(true);
            }
            break;

        case 'defense':
            // 变招/追击聚合（defense 也可能有 per_use / dupe_2 升级）
            const defUpg = aggregateUpgradeEffects(card);
            if (defUpg) {
                logMessages.push(`🔄 ${defUpg.labels.join(' + ')} 发动！`);
            }
            let shield = card.shield ? Math.floor(card.shield * shieldMultiplier) : 0;
            if (defUpg && defUpg.damageBonus > 0) {
                shield = Math.floor(shield * (1 + defUpg.damageBonus));
            }
            gameState.playerShield += shield;

            if (card.immuneSmall) {
                logMessages.push(`🛡️ 意志坚定！本回合免疫小额伤害！`);
                gameState.immuneSmallAttack = true;
            }

            if (card.healHp) {
                gameState.hp = Math.min(gameState.hp + card.healHp, gameState.maxHp);
                logMessages.push(`❤️ 恢复 ${card.healHp} 点血条！`);
            }

            logMessages.push(`🛡️ 获得 ${shield} 点护盾！`);
            // 追击·回响：免费追加 1 次
            if (defUpg && defUpg.echo && !gameState._echoedThisTurn?.[card.id]) {
                gameState._echoedThisTurn = (gameState._echoedThisTurn || {});
                gameState._echoedThisTurn[card.id] = true;
                gameState.hand.push({ ...card, _isEcho: true });
                renderHand();
                logMessages.push(`🔁 追击·回响：${card.name} 可再使用 1 次`);
            }
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
// 管线：原始伤害 → 影响力百分比减伤（05 §7.1） → 护盾吸收 → 小额免疫 → 扣 HP
function applyDamageToPlayer(rawDamage) {
    let damage = rawDamage;

    // 影响力百分比减伤：damage *= (1 - min(0.5, authority/1500))，上限 50%
    const authorityReduction = Math.min(0.5, gameState.authority / 1500);
    const reducedDamage = damage * (1 - authorityReduction);
    const absorbedByAuthority = damage - reducedDamage;
    if (absorbedByAuthority > 0) {
        const log = document.getElementById('battle-log');
        if (log) log.innerHTML += `<br>👑 影响力抵消 ${Math.round(absorbedByAuthority)} 点伤害（${(authorityReduction * 100).toFixed(1)}% 减伤）`;
    }
    damage = reducedDamage;

    // 防御牌 · 意志坚定 · 小额免疫（immuneSmallAttack 标志由对应防御卡置位）
    if (damage > 0 && gameState.immuneSmallAttack && damage <= 5) {
        updateBattleLog(`🛡️ 意志坚定！免疫了 ${Math.ceil(damage)} 点小额伤害！`);
        gameState.immuneSmallAttack = false;
        damage = 0;
    }

    // 护盾吸收剩余伤害
    if (damage > 0 && gameState.playerShield > 0) {
        const shieldAbsorb = Math.min(gameState.playerShield, damage);
        gameState.playerShield -= shieldAbsorb;
        damage -= shieldAbsorb;
    }

    if (damage > 0) {
        gameState.hp = Math.max(0, gameState.hp - Math.ceil(damage));
    }

    updateUI();
    checkGameOver();
}

// ==========================================
// 卡牌升级事件弹窗（变招/追击，二段式选择）
// stage 1: 选升级标签（限制 choices）
// stage 2: 从手牌中选动作牌（attack / defense / function）
// 完成后调用 attachUpgradeToCard + continueAfterNonBattle
// ==========================================
let _pendingUpgrade = null; // { eventDef, pickedTagId }

function showCardUpgradeEvent(eventKey) {
    const evt = CARD_UPGRADE_EVENTS[eventKey];
    if (!evt) { continueAfterNonBattle(); return; }

    // 消耗金币（如果有）
    if (evt.cost && gameState.gold < evt.cost) {
        updateBattleLog(`💰 金币不足以听取密藏（需 ${evt.cost}）`);
        continueAfterNonBattle();
        return;
    }
    if (evt.cost) gameState.gold -= evt.cost;

    const modal = document.getElementById('card-upgrade-modal');
    const title = document.getElementById('card-upgrade-title');
    const desc = document.getElementById('card-upgrade-desc');
    title.textContent = `🗡️ ${evt.title}`;
    desc.innerHTML = `${evt.description}<br><span style="color:#888; font-size:11px;">第一步：选择 ${evt.choices} 个升级中的 1 个</span>`;

    _pendingUpgrade = { eventDef: evt, pickedTagId: null };
    renderUpgradeStage1();
    modal.classList.remove('hidden');
}

function renderUpgradeStage1() {
    const stage = document.getElementById('card-upgrade-stage');
    stage.innerHTML = '';
    const evt = _pendingUpgrade.eventDef;

    evt.pool.forEach(uid => {
        const def = CARD_UPGRADES[uid];
        if (!def) return;
        const btn = document.createElement('div');
        btn.className = 'upgrade-tag-option';
        btn.innerHTML = `
            <span class="tag-name ${def.kind}">${def.name}</span>
            <span class="tag-desc">${def.effect}</span>
            <span class="tag-desc" style="color:#666;">触发器：${triggerLabel(def.trigger)}</span>
        `;
        btn.onclick = () => {
            _pendingUpgrade.pickedTagId = uid;
            renderUpgradeStage2();
        };
        stage.appendChild(btn);
    });
}

function triggerLabel(t) {
    return ({
        usage_2:  '本场战斗内累计使用 ≥ 2 次',
        dupe_2:   '出牌时手牌同名 ≥ 2 张',
        hp_le_20: '怪物进入终结态（HP ≤ 20%）',
        per_use:  '每次使用都生效'
    })[t] || t;
}

function renderUpgradeStage2() {
    const stage = document.getElementById('card-upgrade-stage');
    stage.innerHTML = '';
    const desc = document.getElementById('card-upgrade-desc');
    const def = CARD_UPGRADES[_pendingUpgrade.pickedTagId];
    desc.innerHTML = `已选：<span class="tag-name ${def.kind}" style="display:inline-block;padding:2px 10px;border-radius:12px;font-weight:bold;color:#fff;background:${def.color}">${def.name}</span><br>第二步：从手牌中选一张动作牌挂载`;

    const handActionCards = gameState.hand.filter(isActionCard);
    if (handActionCards.length === 0) {
        // 边界处理（03 §6.5）：手牌无动作牌 → 下一场战斗开始时随机抽
        const deckActionCards = gameState.deck.filter(isActionCard);
        if (deckActionCards.length === 0) {
            // 卡组也没有动作牌：跳过
            desc.innerHTML += '<br><span style="color:#e74c3c">卡组中没有任何动作牌，本次升级跳过。</span>';
            finishCardUpgrade();
            return;
        }
        const target = randomChoice(deckActionCards);
        if (attachUpgradeToCard(target, _pendingUpgrade.pickedTagId)) {
            desc.innerHTML += `<br><span style="color:#aaa">手牌无可挂载目标，已自动挂到卡组 [${target.name}]</span>`;
        }
        finishCardUpgrade();
        return;
    }

    handActionCards.forEach(card => {
        const idx = gameState.hand.indexOf(card);
        const upgradesChips = renderUpgradeChips(card);
        const btn = document.createElement('div');
        btn.className = 'upgrade-target-option';
        btn.innerHTML = `
            <strong>${card.name}</strong>
            <span class="target-meta">${getCardCostText(card)} · ${getCardTypeName(card.type)}</span>
            ${upgradesChips ? `<div style="margin-top:6px;">${upgradesChips}</div>` : ''}
        `;
        btn.onclick = () => {
            if (attachUpgradeToCard(card, _pendingUpgrade.pickedTagId)) {
                finishCardUpgrade();
            } else {
                updateBattleLog('该卡已挂载此升级，请选其他卡。');
            }
        };
        stage.appendChild(btn);
    });

    // 取消 / 跳过按钮
    const skipBtn = document.createElement('button');
    skipBtn.className = 'btn';
    skipBtn.textContent = '放弃本次升级';
    skipBtn.onclick = () => finishCardUpgrade(true);
    stage.appendChild(skipBtn);
}

function finishCardUpgrade(skipContinue) {
    _pendingUpgrade = null;
    closeModal('card-upgrade-modal');
    if (!skipContinue) {
        // 继续推进下一节点
        const currentNode = gameState.mapNodes[gameState.nodeIndex];
        if (currentNode && !currentNode.visited) currentNode.visited = true;
        saveGame();
        if (checkVictory()) return;
        if (checkFloorComplete()) {
            advanceFloor();
        } else {
            showNextNode();
        }
    }
}

// 生成升级徽章 HTML（手牌 / 卡组视图复用）
function renderUpgradeChips(card) {
    if (!card.upgrades || card.upgrades.length === 0) return '';
    const visible = card.upgrades.slice(0, 2);
    const overflow = card.upgrades.length - visible.length;
    let html = visible.map(uid => {
        const u = CARD_UPGRADES[uid];
        if (!u) return '';
        return `<span class="upgrade-chip ${u.kind}">${u.name.replace(/^(变招|追击)·/, '')}</span>`;
    }).join('');
    if (overflow > 0) html += `<span class="upgrade-chip upgrade-chip-more">+${overflow}</span>`;
    return html;
}

// 开始战斗
function startBattle(enemy) {
    gameState.inBattle = true;
    gameState.currentEnemy = { ...enemy, currentHp: enemy.hp };
    gameState.playerShield = 0;
    gameState.turnCount = 0;
    gameState.actionsUsedThisTurn = 0;
    gameState.tempDamageBoost = 0;
    gameState.immuneSmallAttack = false;
    gameState.blockNextEnemyAttack = false;
    gameState.isFinisherState = false;
    gameState.cardUsageCount = {};

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
    gameState.actionsUsedThisTurn = 0;

    // 弃牌
    discardHand();

    // 新回合
    gameState.turnCount++;

    // 下回合额外行动点 → 多抽牌的近似实现（保留 5 张上限）
    const bonusCards = gameState.nextTurnBonus > 0 ? gameState.nextTurnBonus : 0;
    gameState.nextTurnBonus = 0;

    // 抽牌
    drawCards(BATTLE_CONFIG.cardsPerTurn + bonusCards);

    updateUI();
}

// 敌人回合
// 管线：敌人基础伤害 → 影响百分比减伤 → 护盾 / 免疫 / HP
// 影响百分比减伤由 applyDamageToPlayer 统一处理，这里只算 rawDamage。
function enemyTurn() {
    if (!gameState.currentEnemy) return;

    const enemy = gameState.currentEnemy;

    // 检查是否能抵挡（贵族庇护等 card 效果）
    if (gameState.blockNextEnemyAttack) {
        updateBattleLog(`🛡️ 贵族庇护！抵挡了 ${enemy.name} 的攻击！`);
        gameState.blockNextEnemyAttack = false;
        return;
    }

    let rawDamage = enemy.damage;

    // 特殊敌人效果（多层中按设计文档分别扩展；本 demo 内先保留系数）
    if (enemy.multiHit) {
        const hits = randomInt(2, 3);
        let totalDamage = 0;
        for (let i = 0; i < hits; i++) {
            const hitDamage = Math.max(1, Math.floor(rawDamage / 3));
            applyDamageToPlayer(hitDamage);
            totalDamage += hitDamage;
        }
        updateBattleLog(`💢 ${enemy.name} 发动多重攻击！共受到 ${totalDamage} 点伤害！`);
        return;
    } else if (enemy.damageEscalate) {
        rawDamage += gameState.turnCount * 3;
    } else if (enemy.debuffStack) {
        rawDamage += gameState.turnCount * 2;
        gameState.authority = Math.max(0, gameState.authority - 1);
        updateBattleLog(`🔮 ${enemy.name} 心灵压制！权威-1！`);
    }

    applyDamageToPlayer(rawDamage);
    updateBattleLog(`💢 ${enemy.name} 攻击！准备造成 ${rawDamage} 点伤害。`);

    // 追击·流血 debuff tick
    if (enemy.bleed && enemy.bleed > 0) {
        const dotDmg = 3 + gameState.turnCount; // 随回合递增的流血伤害
        enemy.currentHp = Math.max(0, enemy.currentHp - dotDmg);
        enemy.bleed -= 1;
        updateBattleLog(`🩸 流血生效：${enemy.name} 受到 ${dotDmg} 点伤害（剩余 ${enemy.bleed} 回合）`);
        if (enemy.currentHp <= 0) {
            updateBattleLog(`💀 ${enemy.name} 因流血倒下！`);
            endBattle(true);
            updateUI();
            return;
        }
    }
    updateUI();
}

// 结束战斗
// 胜利：结算奖励 + 自动存档 + 标记节点 visited → 玩家关闭弹窗后由 continueAfterBattle() 推进
// 失败：直接显示结局模态（HP/MP/Bankrupt）
function endBattle(victory) {
    if (gameState.inBattle === false) return;
    gameState.inBattle = false;

    if (victory) {
        const enemy = gameState.currentEnemy;

        // 获得奖励（00 §2 四维度）
        const goldReward = (enemy.gold || 0) + Math.floor(gameState.floor * 50);
        const skillReward = enemy.skill || 0;
        const achievementReward = enemy.exp || 0;
        const authorityReward = Math.floor((enemy.exp || 0) / 2);

        gameState.gold += goldReward;
        gameState.skill += skillReward;
        gameState.achievement += achievementReward;
        gameState.authority += authorityReward;

        // 成就感回血（00 §2.3）
        const healFromAchievement = Math.floor(gameState.achievement / 10);
        if (healFromAchievement > 0) {
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + healFromAchievement);
        }

        // 当前节点标记已访问（流程推进关键）
        const currentNode = gameState.mapNodes[gameState.nodeIndex];
        if (currentNode && !currentNode.visited) currentNode.visited = true;

        // 弹窗显示奖励；关闭按钮绑定 continueAfterBattle()
        showBattleResult(true, {
            gold: goldReward,
            skill: skillReward,
            achievement: achievementReward,
            authority: authorityReward,
            healFromAchievement,
            enemyName: enemy.name
        });

        // 自动存档（05 §5.2）
        saveGame();
    } else {
        // 失败由 checkGameOver 统一处理
        checkGameOver();
        return;
    }

    // 清理战斗状态
    gameState.currentEnemy = null;
    gameState.playerShield = 0;

    updateUI();
}

// 战斗结算后玩家点"继续"时调用：检查楼层 / 通关 / 下一节点
function continueAfterBattle() {
    closeModal('battle-result-modal');
    if (checkVictory()) return;       // 通关判定
    if (checkFloorComplete()) {
        advanceFloor();
        return;
    }
    showNextNode();
}

// 类似地，事件 / 驿站 / 商店之后也走这条推进路线
function continueAfterNonBattle() {
    // 关闭可能打开的模态
    ['event-modal', 'partner-modal', 'investment-modal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && !m.classList.contains('hidden')) m.classList.add('hidden');
    });
    // 标记当前节点 visited
    const currentNode = gameState.mapNodes[gameState.nodeIndex];
    if (currentNode && !currentNode.visited) currentNode.visited = true;
    saveGame();
    if (checkVictory()) return;
    if (checkFloorComplete()) {
        advanceFloor();
        return;
    }
    showNextNode();
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
            <p>击败了 <strong>${rewards.enemyName}</strong></p>
            <p>💰 金币 <strong>+${rewards.gold}</strong></p>
            <p>⚡ 技能 <strong>+${rewards.skill}</strong></p>
            <p>✨ 成就感 <strong>+${rewards.achievement}</strong></p>
            <p>👑 权威 <strong>+${rewards.authority}</strong></p>
            ${rewards.healFromAchievement > 0 ? `<p>❤️ 成就感回血 +${rewards.healFromAchievement}</p>` : ''}
            <p style="color:#aaa; margin-top:14px; font-size:12px;">点 "继续" 进入下一节点</p>
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
    // 增加 cardUpgrade 类别（按 03 §6.6：与现有四类共用触发机制，30% 触发一次）
    const eventCategories = ['positive', 'negative', 'risk', 'neutral', 'cardUpgrade'];
    // 5 类分布：4 类常规各 22.5%，卡牌升级 10%（稀有）
    const weights = [0.225, 0.225, 0.225, 0.225, 0.10];
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

    // 卡牌升级事件：按权重从 CARD_UPGRADE_EVENTS 抽取一个
    if (category === 'cardUpgrade') {
        const keys = Object.keys(CARD_UPGRADE_EVENTS);
        const keyPool = [];
        keys.forEach(k => {
            const w = CARD_UPGRADE_EVENTS[k].weight || 1;
            for (let i = 0; i < w * 10; i++) keyPool.push(k);
        });
        const pickedKey = keyPool[Math.floor(Math.random() * keyPool.length)];
        showCardUpgradeEvent(pickedKey);
        return;
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
            continueAfterNonBattle();
        };

        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'event-option';
        rejectBtn.textContent = '拒绝（无损失）';
        rejectBtn.onclick = () => {
            continueAfterNonBattle();
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
            continueAfterNonBattle();
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
// 每层生成 nodesPerFloor 个节点，结构化布局：第 7 个节点强制为精英（休息前挑战），
// 最后第 14 个节点为 ELITE 之前的"RAMP"模式（事件 / 休息 / 商店 出现概率递增），
// 第 15 个固定 BOSS。
// 节点权重：随节点顺序调整（Boss 前更多休息/商店作为补给）。
function initMap() {
    gameState.mapNodes = [];
    gameState.nodeIndex = 0;

    const total = FLOW_CONFIG.nodesPerFloor;
    const nodeTypesByIndex = (i) => {
        // 强制：第一个节点和最后一个节点
        if (i === 0) return NODE_TYPES.BATTLE;     // 开场战
        if (i === total - 1) return NODE_TYPES.BOSS; // BOSS
        if (i === Math.floor(total / 2)) return NODE_TYPES.ELITE; // 中段精英

        // 概率权重，随位置变化
        const rand = Math.random();
        const nearBoss = (i >= total - 3); // 末 3 节点更倾向补给
        const battleWeight = nearBoss ? 0.35 : 0.55;
        const eventWeight = 0.18;
        const restWeight = nearBoss ? 0.25 : 0.12;
        const shopWeight = nearBoss ? 0.15 : 0.10;
        const eliteExtra = 0.05;

        if (rand < battleWeight) return NODE_TYPES.BATTLE;
        if (rand < battleWeight + eliteExtra) return NODE_TYPES.ELITE;
        if (rand < battleWeight + eliteExtra + eventWeight) return NODE_TYPES.EVENT;
        if (rand < battleWeight + eliteExtra + eventWeight + restWeight) return NODE_TYPES.REST;
        return NODE_TYPES.SHOP;
    };

    for (let i = 0; i < total; i++) {
        gameState.mapNodes.push({
            index: i,
            type: nodeTypesByIndex(i),
            visited: false,
            floor: gameState.floor
        });
    }
}

// 显示地图总览（保留用于 debug / 查看进度）
// 线性流程下不再作为主推进入口，进推进由 showNextNode() 完成。
function showMapModal() {
    const modal = document.getElementById('map-modal');
    const nodesContainer = document.getElementById('map-nodes');
    nodesContainer.innerHTML = '';

    gameState.mapNodes.forEach((node, index) => {
        const marker = node.visited ? '✓' : (index === gameState.nodeIndex ? '→' : '·');
        const typeName = {
            [NODE_TYPES.BATTLE]: '战斗',
            [NODE_TYPES.ELITE]: '精英',
            [NODE_TYPES.BOSS]: 'BOSS',
            [NODE_TYPES.EVENT]: '事件',
            [NODE_TYPES.REST]: '驿站',
            [NODE_TYPES.SHOP]: '商店'
        }[node.type] || '?';

        const div = document.createElement('div');
        div.className = 'event-option';
        div.style.textAlign = 'left';
        div.style.cursor = 'default';
        div.innerHTML = `<strong>${marker} 第 ${index + 1} 节点</strong> <span style="color:#aaa">${typeName}</span>`;
        nodesContainer.appendChild(div);
    });

    modal.classList.remove('hidden');
}

// 显示"下一节点"单步确认（线性流程）
function showNextNode() {
    const nextIndex = gameState.mapNodes.findIndex(n => !n.visited);
    if (nextIndex === -1) {
        // 没有未访问节点 → 楼层通关
        if (checkFloorComplete()) advanceFloor();
        return;
    }
    gameState.nodeIndex = nextIndex;
    const node = gameState.mapNodes[nextIndex];

    const modal = document.getElementById('map-modal');
    const titleEl = modal.querySelector('h2');
    const nodesContainer = document.getElementById('map-nodes');
    titleEl.textContent = `第 ${gameState.floor} 层 · 第 ${nextIndex + 1} 节点`;

    const typeName = {
        [NODE_TYPES.BATTLE]: '⚔️ 普通战斗',
        [NODE_TYPES.ELITE]: '💀 精英战斗',
        [NODE_TYPES.BOSS]: '👹 BOSS 战斗',
        [NODE_TYPES.EVENT]: '❓ 随机事件',
        [NODE_TYPES.REST]: '🏕️ 驿站休息',
        [NODE_TYPES.SHOP]: '🏪 商店补给'
    }[node.type] || '未知节点类型';

    nodesContainer.innerHTML = '';

    const desc = document.createElement('p');
    desc.style.marginBottom = '14px';
    desc.innerHTML = `即将进入：<strong>${typeName}</strong>`;
    nodesContainer.appendChild(desc);

    const goBtn = document.createElement('button');
    goBtn.className = 'btn btn-primary';
    goBtn.textContent = '前往节点';
    goBtn.onclick = () => {
        closeModal('map-modal');
        handleNodeSelection(nextIndex);
    };
    nodesContainer.appendChild(goBtn);

    modal.classList.remove('hidden');
}

// 处理节点选择
// 注意：节点 visited 标记由 endBattle / continueAfterNonBattle 处理，
// 这里不再无脑 visited=true，避免事件 / 商店 / 驿站被算作"已过关"。
function handleNodeSelection(index) {
    const node = gameState.mapNodes[index];
    if (!node) return;
    gameState.nodeIndex = index;

    switch (node.type) {
        case NODE_TYPES.BATTLE:
            startBattle(randomChoice(ENEMIES.common));
            break;
        case NODE_TYPES.ELITE:
            startBattle(randomChoice(ENEMIES.elite));
            break;
        case NODE_TYPES.BOSS:
            startBattle(randomChoice(ENEMIES.boss));
            break;
        case NODE_TYPES.EVENT:
            triggerRandomEvent();
            // 事件通过 continueAfterNonBattle 推进
            break;
        case NODE_TYPES.REST:
            // 驿站休息：回血回蓝 + 伴侣陪伴
            const restHeal = 25;
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + restHeal);
            gameState.mp = Math.min(gameState.maxMp, gameState.mp + restHeal);
            // 驿站同时：可升级一张卡牌或完成伴侣任务
            updateBattleLog(`🏕️ 驿站休息！HP/MP 各恢复 ${restHeal} 点。`);
            showPartnerModal();
            break;
        case NODE_TYPES.SHOP:
            showShopModal();
            break;
    }

    updateUI();
}

// 检查楼层是否完成
function checkFloorComplete() {
    return gameState.mapNodes.length > 0 && gameState.mapNodes.every(node => node.visited);
}

// 进入下一层
function advanceFloor() {
    if (gameState.floor >= FLOW_CONFIG.totalFloors) {
        // 通关全部楼层 → 通关判定
        updateBattleLog(`🏆 你已征服全部 ${FLOW_CONFIG.totalFloors} 层！`);
        checkVictory();
        return;
    }

    gameState.floor++;
    initMap();
    updateBattleLog(`🏰 进入第 ${gameState.floor} 层！`);
    updateUI();
    saveGame();

    // 短暂延迟后展示下一节点
    setTimeout(() => showNextNode(), 600);
}

// ==========================================
// 商店系统
// ==========================================

// 安全向卡组添加一张卡：达到上限时改为金币回收 50%
function addCardToDeck(card) {
    if (gameState.deck.length >= FLOW_CONFIG.deckSizeMax) {
        const refund = Math.floor((card.gold || 0) * 0.5);
        gameState.gold += refund;
        updateBattleLog(`⚠️ 卡组已达上限 ${FLOW_CONFIG.deckSizeMax} 张，回收 ${refund} 金币。`);
        return false;
    }
    gameState.deck.push({ ...card });
    return true;
}

function showShopModal() {
    const modal = document.getElementById('investment-modal');
    const title = document.getElementById('investment-title');
    const desc = document.getElementById('investment-description');
    const options = document.getElementById('investment-options');

    title.textContent = '🏪 商店';
    desc.innerHTML = `购买强力卡牌和道具！<br><span style="color:#aaa; font-size:12px;">当前卡组 ${gameState.deck.length} / ${FLOW_CONFIG.deckSizeMax} 张</span>`;

    options.innerHTML = '';

    const deckFull = gameState.deck.length >= FLOW_CONFIG.deckSizeMax;

    // 攻击卡购买
    const atkCard = CARDS.attackCards[randomInt(0, CARDS.attackCards.length - 1)];
    const atkBtn = document.createElement('button');
    atkBtn.className = 'investment-option';
    atkBtn.textContent = `攻击卡: ${atkCard.name} - 💰800${deckFull ? '（卡组满）' : ''}`;
    atkBtn.disabled = deckFull;
    atkBtn.onclick = () => {
        if (gameState.gold >= 800) {
            gameState.gold -= 800;
            gameState.deck.push({ ...atkCard });
            updateBattleLog(`购买了 ${atkCard.name}！`);
            updateUI();
            showShopModal(); // 刷新剩余选项
        } else {
            updateBattleLog('金币不足！');
        }
    };
    options.appendChild(atkBtn);

    // 防御卡购买
    const defCard = CARDS.defenseCards[randomInt(0, CARDS.defenseCards.length - 1)];
    const defBtn = document.createElement('button');
    defBtn.className = 'investment-option';
    defBtn.textContent = `防御卡: ${defCard.name} - 💰800${deckFull ? '（卡组满）' : ''}`;
    defBtn.disabled = deckFull;
    defBtn.onclick = () => {
        if (gameState.gold >= 800) {
            gameState.gold -= 800;
            gameState.deck.push({ ...defCard });
            updateBattleLog(`购买了 ${defCard.name}！`);
            updateUI();
            showShopModal();
        } else {
            updateBattleLog('金币不足！');
        }
    };
    options.appendChild(defBtn);

    // 工作卡购买
    const workCard = CARDS.workCards[randomInt(0, CARDS.workCards.length - 1)];
    const workBtn = document.createElement('button');
    workBtn.className = 'investment-option';
    workBtn.textContent = `工作卡: ${workCard.name} - 💰1000${deckFull ? '（卡组满）' : ''}`;
    workBtn.disabled = deckFull;
    workBtn.onclick = () => {
        if (gameState.gold >= 1000) {
            gameState.gold -= 1000;
            gameState.deck.push({ ...workCard });
            updateBattleLog(`购买了 ${workCard.name}！`);
            updateUI();
            showShopModal();
        } else {
            updateBattleLog('金币不足！');
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
            updateUI();
            showShopModal();
        } else {
            updateBattleLog('金币不足！');
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
            updateUI();
            showShopModal();
        } else {
            updateBattleLog('金币不足！');
        }
    };
    options.appendChild(manaBtn);

    // 离开 → 自动推进
    const closeBtn = document.createElement('button');
    closeBtn.className = 'investment-option';
    closeBtn.textContent = '离开商店（进入下一节点）';
    closeBtn.onclick = () => continueAfterNonBattle();
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
// 完整存档（05 §5.1 完整字段，包括战斗中状态）
function saveGame() {
    try {
        const saveData = {
            // 版本
            saveVersion: SAVE_VERSION,
            saveTime: Date.now(),

            // 资源
            hp: gameState.hp,
            maxHp: gameState.maxHp,
            mp: gameState.mp,
            maxMp: gameState.maxMp,
            gold: gameState.gold,
            skill: gameState.skill,
            achievement: gameState.achievement,
            authority: gameState.authority,

            // 进度
            floor: gameState.floor,
            nodeIndex: gameState.nodeIndex,
            nodesPerFloor: gameState.nodesPerFloor,
            mapNodes: gameState.mapNodes,
            layerBossSeed: gameState.layerBossSeed,

            // 战斗状态（战斗中存档关键字段）
            inBattle: gameState.inBattle,
            currentEnemy: gameState.currentEnemy,
            playerShield: gameState.playerShield,
            playerDiceResult: gameState.playerDiceResult,
            enemyDiceResult: gameState.enemyDiceResult,
            turnCount: gameState.turnCount,
            actionsUsedThisTurn: gameState.actionsUsedThisTurn,
            blockNextEnemyAttack: gameState.blockNextEnemyAttack,
            isFinisherState: gameState.isFinisherState,
            tempDamageBoost: gameState.tempDamageBoost,
            nextTurnBonus: gameState.nextTurnBonus,
            immuneSmallAttack: gameState.immuneSmallAttack,

            // 卡组 / 抽 / 弃 / 手
            deck: gameState.deck,
            hand: gameState.hand,
            drawPile: gameState.drawPile,
            discardPile: gameState.discardPile,
            cardUsageCount: gameState.cardUsageCount,

            // 伴侣
            partner: gameState.partner,
            partnerStage: gameState.partnerStage,
            partnerSatisfaction: gameState.partnerSatisfaction,
            partnerDarkMode: gameState.partnerDarkMode,

            // 事件 / 终结记录
            triggeredEvents: gameState.triggeredEvents,
            perfectFinishers: gameState.perfectFinishers
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error('保存失败：', e);
    }
}

// 是否有存档
function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
}

// 加载游戏
function loadGame() {
    const saveStr = localStorage.getItem(SAVE_KEY);
    if (!saveStr) return false;

    try {
        const saveData = JSON.parse(saveStr);
        // 版本一致性检查：05 §5.1 跨版本忽略存档
        if (saveData.saveVersion && !String(saveData.saveVersion).startsWith(SAVE_VERSION.split('-')[0])) {
            console.warn('存档版本不一致：', saveData.saveVersion, 'vs', SAVE_VERSION);
            return false;
        }
        Object.assign(gameState, saveData);
        gameState.saveVersion = SAVE_VERSION;
        updateUI();
        return true;
    } catch (e) {
        console.error('读取失败：', e);
        return false;
    }
}

// 启动新游戏（不删存档，由 showStartModal 处理"新游戏"是否覆盖）
function resetGame() {
    localStorage.removeItem(SAVE_KEY);

    // 重建初始状态
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
    gameState.turnCount = 0;
    gameState.actionsUsedThisTurn = 0;
    gameState.isFinisherState = false;
    gameState.tempDamageBoost = 0;
    gameState.nextTurnBonus = 0;
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

    initDeck();
    initMap();
    initPartner();
    saveGame();
    updateUI();
}

// 启动屏：有存档显示"继续游戏" + "重新开始"，无存档只显示"开始冒险"
function showStartModal() {
    const modal = document.getElementById('start-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
}

function bindStartModal() {
    const modal = document.getElementById('start-modal');
    if (!modal) return;

    const continueBtn = document.getElementById('btn-continue');
    const newBtn = document.getElementById('btn-new-game');

    if (hasSave()) {
        const saveStr = localStorage.getItem(SAVE_KEY);
        const saveData = JSON.parse(saveStr);
        const summary = document.getElementById('save-summary');
        if (summary) {
            const date = new Date(saveData.saveTime);
            summary.innerHTML = `
                <p>📅 ${date.toLocaleString('zh-CN')}</p>
                <p>🗡️ 第 <strong>${saveData.floor}</strong> 层 / 节点 ${saveData.nodeIndex + 1}</p>
                <p>💰 ${(saveData.gold || 0).toLocaleString()} 金币 · ⚡ ${saveData.skill} 技能</p>
                <p>🃏 卡组 ${(saveData.deck || []).length} 张</p>
            `;
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
            resetGame();
            showNextNode();
        };
    }
    if (continueBtn) {
        continueBtn.onclick = () => {
            if (loadGame()) {
                modal.classList.add('hidden');
                if (gameState.inBattle && gameState.currentEnemy) {
                    showEnemy(gameState.currentEnemy);
                    renderHand();
                } else {
                    showNextNode();
                }
            } else {
                updateBattleLog('❌ 存档损坏，已开始新游戏。');
                modal.classList.add('hidden');
                resetGame();
                showNextNode();
            }
        };
    }
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
            const upgradesHtml = renderUpgradeChips(card);
            const cardDiv = document.createElement('div');
            cardDiv.className = 'deck-card';
            cardDiv.innerHTML = `
                <div style="flex:1;">
                    <span class="deck-card-name">${card.name}</span>
                    ${upgradesHtml ? `<div style="margin-top:4px;">${upgradesHtml}</div>` : ''}
                </div>
                <span class="deck-card-count">${getCardCostText(card)}</span>
            `;
            cardDiv.style.display = 'flex';
            cardDiv.style.alignItems = 'flex-start';
            deckList.appendChild(cardDiv);
        });
    }

    modal.classList.remove('hidden');
}

// ==========================================
// 事件绑定
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 结束回合按钮：战斗中触发回合结束，非战斗 → 推进下一节点
    document.getElementById('btn-end-turn').addEventListener('click', () => {
        if (gameState.inBattle) {
            endTurn();
        } else {
            // 非战斗态：自动推进到下一未访问节点
            showNextNode();
        }
    });

    // 查看卡组按钮
    document.getElementById('btn-view-deck').addEventListener('click', showDeckModal);

    // 保存进度按钮
    document.getElementById('btn-save').addEventListener('click', () => {
        saveGame();
        updateBattleLog('💾 游戏已保存！');
    });

    // 重新开始按钮 → 回到启动屏
    document.getElementById('btn-restart').addEventListener('click', () => {
        if (confirm('确定要回到启动屏吗？当前进度将保留（直到开始新游戏）。')) {
            // 关闭所有弹窗，回到主界面
            document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
            gameState.inBattle = false;
            gameState.currentEnemy = null;
            updateUI();
            showStartModal();
        }
    });

    // 战斗结算弹窗"继续"按钮 → 推进流程
    document.getElementById('btn-close-battle-result').addEventListener('click', continueAfterBattle);

    // 卡组弹窗关闭
    document.getElementById('btn-close-deck').addEventListener('click', () => {
        closeModal('deck-modal');
    });

    // 结局弹窗 - 再玩一次 → 回启动屏
    document.getElementById('btn-play-again').addEventListener('click', () => {
        closeModal('ending-modal');
        localStorage.removeItem(SAVE_KEY);
        showStartModal();
    });

    // 卡牌升级事件弹窗关闭
    document.getElementById('btn-close-card-upgrade').addEventListener('click', () => finishCardUpgrade(true));

    // 启动屏绑定（"开始冒险"/"继续游戏"）
    bindStartModal();
    // 默认进入：若有存档预填启动屏，否则什么都不做等用户点击启动屏
    showStartModal();
    updateUI();
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