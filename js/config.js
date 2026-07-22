/* ========================================
   config.js — 游戏配置常量（纯数据，零依赖）
   ======================================== */

export const INITIAL_RESOURCES = {
    hp: 100, maxHp: 100, mp: 100, maxMp: 100,
    gold: 5000, skill: 0, achievement: 0, authority: 0
};

export const BATTLE_CONFIG = {
    cardsPerTurn: 5, maxCardsPerTurn: 5,
    playerDiceMin: 1, playerDiceMax: 6,
    enemyDiceMin: 1, enemyDiceMax: 6,
    actionsPerTurn: 1,
};

export const RTWP_CONFIG = {
    LOGICAL_TICK_MS: 50,
    PAUSE_KEY: 'Space',
    FAST_FORWARD_KEY: 'KeyF',
};

export const GAUGE_CONFIG = {
    MAX_GAUGE: 100, BASE_REGEN_PER_SEC: 20, SKILL_REGEN_BONUS: 0.005,
    CARD_COST_FAST: 30, CARD_COST_MEDIUM: 45, CARD_COST_SLOW: 60,
    MIN_GAUGE_TO_ACT: 20, ACHIEVEMENT_GAUGE_SCALE: 0.1, MAX_GAUGE_CAP: 150,
};

export const HAND_CONFIG = {
    MAX_HAND_SIZE: 7, DRAW_INTERVAL_SEC: 4.0,
    SKILL_DRAW_BONUS: 0.02, MIN_DRAW_INTERVAL: 1.0,
};

export const CAST_TIME = { fast: 200, medium: 500, slow: 1000 };

export const CARD_SPEEDS = {
    atk1: 'medium', atk2: 'medium', atk3: 'slow', atk4: 'slow', atk5: 'fast',
    def1: 'fast', def2: 'medium', def3: 'slow', def4: 'medium', def5: 'fast',
    func1: 'medium', func2: 'fast', func3: 'medium', func4: 'slow', func5: 'fast',
    work1: 'slow', work2: 'slow', work3: 'slow', work4: 'slow', work5: 'slow',
};

export const ENEMY_AI_PROFILES = {
    default: {
        gaugeRegenPerSec: 25, actionThreshold: 100,
        actions: [
            { type: 'attack', weight: 70, windupMs: 1500, damageMul: 1.0 },
            { type: 'defend', weight: 20, windupMs: 500,  shieldAmount: 10 },
            { type: 'special', weight: 10, windupMs: 2000 },
        ],
    },
    multiHit: {
        gaugeRegenPerSec: 30, actionThreshold: 100,
        actions: [
            { type: 'attack_multi', weight: 60, windupMs: 800,  hits: 3, damageMul: 0.4 },
            { type: 'attack',       weight: 30, windupMs: 1200, damageMul: 1.0 },
            { type: 'howl',         weight: 10, windupMs: 2500 },
        ],
    },
    damageEscalate: {
        gaugeRegenPerSec: 22, actionThreshold: 100,
        actions: [
            { type: 'attack', weight: 80, windupMs: 2000, damageMul: 1.0 },
            { type: 'defend', weight: 20, windupMs: 800,  shieldAmount: 15 },
        ],
    },
    debuffStack: {
        gaugeRegenPerSec: 28, actionThreshold: 100,
        actions: [
            { type: 'attack_debuff', weight: 60, windupMs: 1500, damageMul: 1.0 },
            { type: 'attack',        weight: 25, windupMs: 1200, damageMul: 0.8 },
            { type: 'defend',        weight: 15, windupMs: 600,  shieldAmount: 12 },
        ],
    },
    shieldBreak: {
        gaugeRegenPerSec: 26, actionThreshold: 100,
        actions: [
            { type: 'attack_shield_break', weight: 50, windupMs: 1400, damageMul: 1.2 },
            { type: 'attack',              weight: 40, windupMs: 1000, damageMul: 0.9 },
            { type: 'defend',              weight: 10, windupMs: 700,  shieldAmount: 8 },
        ],
    },
    reduceShield: {
        gaugeRegenPerSec: 24, actionThreshold: 100,
        actions: [
            { type: 'attack_reduce_shield', weight: 50, windupMs: 1200, damageMul: 1.0 },
            { type: 'attack',               weight: 30, windupMs: 1000, damageMul: 0.8 },
            { type: 'defend',               weight: 20, windupMs: 600,  shieldAmount: 15 },
        ],
    },
    boss: {
        gaugeRegenPerSec: 35, actionThreshold: 100,
        actions: [
            { type: 'attack',      weight: 60, windupMs: 1800, damageMul: 1.2 },
            { type: 'attack_heavy',weight: 25, windupMs: 3000, damageMul: 2.0 },
            { type: 'defend',      weight: 15, windupMs: 800,  shieldAmount: 25 },
        ],
    },
    boss_debuffStack: {
        gaugeRegenPerSec: 35, actionThreshold: 100,
        actions: [
            { type: 'attack_debuff', weight: 50, windupMs: 1800, damageMul: 1.0 },
            { type: 'attack',        weight: 30, windupMs: 1500, damageMul: 1.0 },
            { type: 'special',       weight: 20, windupMs: 2500 },
        ],
    },
};

export const FLOW_CONFIG = {
    deckSizeMax: 25, nodesPerFloor: 15, totalFloors: 3, victoryGold: 10000000,
};

export const SAVE_KEY = 'careerCardGame_save';
export const SAVE_VERSION = '2.0-demonstration';

export const CARDS = {
    attackCards: [
        { id: 'atk1', name: '英勇冲锋', type: 'attack', costMp: 5,  description: 'MP 5，骑枪直刺，以气势力压对手，造成 15 伤害', damage: 15, attributes: ['achievement'] },
        { id: 'atk2', name: '长剑斩击', type: 'attack', costMp: 8,  description: 'MP 8，双手握剑全力劈砍，造成 22 伤害', damage: 22, attributes: ['authority'] },
        { id: 'atk3', name: '双手重击', type: 'attack', costMp: 10, description: 'MP 10，沉肩坠肘，重劈而下，造成 30 伤害', damage: 30, attributes: ['achievement', 'authority'] },
        { id: 'atk4', name: '战斧猛劈', type: 'attack', costHp: 15, description: 'HP 15（高阶卡），战斧高举蓄力劈下，造成 40 伤害', damage: 40, attributes: ['authority'] },
        { id: 'atk5', name: '骑枪冲刺', type: 'attack', costMp: 7,  description: 'MP 7，策马挺枪贯穿敌阵，造成 18 伤害', damage: 18, attributes: ['achievement', 'authority'] }
    ],
    defenseCards: [
        { id: 'def1', name: '举盾防御', type: 'defense', costMp: 5,  description: 'MP 5，竖起盾牌抵御攻击，获得 12 护盾', shield: 12 },
        { id: 'def2', name: '格挡架势', type: 'defense', costMp: 8,  description: 'MP 8，摆出格挡姿势减少伤害，获得 18 护盾', shield: 18 },
        { id: 'def3', name: '坚守阵地', type: 'defense', costMp: 12, description: 'MP 12，坚守阵地寸步不让，获得 25 护盾', shield: 25 },
        { id: 'def4', name: '意志坚定', type: 'defense', costMp: 10, description: 'MP 10，骑士意志坚定，本回合免疫小额伤害', shield: 0, immuneSmall: true },
        { id: 'def5', name: '短暂休整', type: 'defense', costMp: 6,  description: 'MP 6，趁机休整恢复体力，获得 8 护盾且 +3 HP', shield: 8, healHp: 3 }
    ],
    functionCards: [
        { id: 'func1', name: '冥想恢复', type: 'function', costGold: 200,      description: '金币 200，冥想恢复身心，+15 HP +10 MP', healHp: 15, healMp: 10 },
        { id: 'func2', name: '呼唤援军', type: 'function', costSkill: 5,       description: '技能 5，呼唤同伴前来助战，额外抽 2 张牌', drawCards: 2 },
        { id: 'func3', name: '战斗怒吼', type: 'function', costMp: 8,           description: 'MP 8，发出战吼鼓舞士气，本回合所有伤害 +30%', damageBoost: 0.3 },
        { id: 'func4', name: '战术复盘', type: 'function', costHp: 5,           description: 'HP 5，战后复盘优化战术，行动槽回复速度 +100%，持续 2 个循环', gaugeRegenBoost: 1 },
        { id: 'func5', name: '贵族庇护', type: 'function', costAuthority: 10,   description: '影响力 10，利用贵族身份抵挡一次敌人大招', blockNext: true }
    ],
    workCards: [
        { id: 'work1', name: '完成悬赏', type: 'work', costHp: 5,  costMp: 5,  description: 'HP 5 + MP 5，完成领主悬赏任务，获得 800 金币', gold: 800,  skill: 2, achievement: 2, authority: 1 },
        { id: 'work2', name: '护送商队', type: 'work', costHp: 8,  costMp: 8,  description: 'HP 8 + MP 8，护送商队安全到达，获得 1500 金币', gold: 1500, skill: 4, achievement: 4, authority: 2 },
        { id: 'work3', name: '探索遗迹', type: 'work', costHp: 10, costMp: 10, description: 'HP 10 + MP 10，探索古老遗迹宝藏，获得 3000 金币', gold: 3000, skill: 6, achievement: 6, authority: 3 },
        { id: 'work4', name: '讨伐恶龙', type: 'work', costHp: 12, costMp: 12, description: 'HP 12 + MP 12，接受讨伐恶龙任务，获得 5000 金币', gold: 5000, skill: 8, achievement: 8, authority: 5 },
        { id: 'work5', name: '清理地城', type: 'work', costHp: 6,  costMp: 6,  description: 'HP 6 + MP 6，清理地下城小怪，获得 600 金币 +3 技能', gold: 600, skill: 3, achievement: 1, authority: 1 }
    ]
};

export const CARD_UPGRADES = {
    variation_pierce:   { id: 'variation_pierce',   name: '变招·穿刺', kind: 'variation', trigger: 'usage_2', effect: '第 2 次使用变为穿透形态，无视敌方护盾', color: '#c0504d', apply: ctx => ({ ignoreShield: true }) },
    variation_chain:    { id: 'variation_chain',    name: '变招·连斩', kind: 'variation', trigger: 'usage_2', effect: '第 2 次使用追加 50% 伤害', color: '#c0504d', apply: ctx => ({ damageBonus: 0.5 }) },
    variation_cleave:   { id: 'variation_cleave',   name: '变招·裂地', kind: 'variation', trigger: 'usage_2', effect: '第 2 次使用变为群攻形态，伤害降至 50% 但附加溅射', color: '#c0504d', apply: ctx => ({ damageMul: 0.5, splash: true }) },
    variation_execute:  { id: 'variation_execute',  name: '变招·终结', kind: 'variation', trigger: 'hp_le_20', effect: '终结态下伤害 +100%（与终结属性加成叠加）', color: '#c0504d', apply: ctx => ({ damageBonus: 1.0, requiresFinisher: true }) },
    pursuit_strike:     { id: 'pursuit_strike',     name: '追击·连携', kind: 'pursuit', trigger: 'dupe_2', effect: '手牌同名 ≥2 张时，打出追加 50% 伤害', color: '#4a7a8a', apply: ctx => ({ damageBonus: 0.5 }) },
    pursuit_bleed:      { id: 'pursuit_bleed',      name: '追击·流血', kind: 'pursuit', trigger: 'dupe_2', effect: '手牌同名 ≥2 张时，打出追加 50% 伤害 + 目标流血 3 回合', color: '#4a7a8a', apply: ctx => ({ damageBonus: 0.5, bleed: 3 }) },
    pursuit_armor_break:{ id: 'pursuit_armor_break',name: '追击·破甲', kind: 'pursuit', trigger: 'dupe_2', effect: '手牌同名 ≥2 张时，打出追加 50% 伤害 + 破甲（怪物下回合护盾 -25%）', color: '#4a7a8a', apply: ctx => ({ damageBonus: 0.5, armorBreak: true }) },
    variation_momentum: { id: 'variation_momentum', name: '变招·蓄势', kind: 'variation', trigger: 'per_use', effect: '每次使用：若上回合已出过同名牌，本回合费用 -20%（不低于 1）', color: '#c0504d', apply: ctx => ({ costReduction: 0.2 }) },
    pursuit_echo:       { id: 'pursuit_echo',       name: '追击·回响', kind: 'pursuit', trigger: 'per_use', effect: '每次使用：本张牌结算后立即免费追加 1 次（不消耗行动点）', color: '#4a7a8a', apply: ctx => ({ echo: true }) }
};

export const CARD_UPGRADE_EVENTS = {
    'knight_mentor':  { title: '老骑士的指点', description: '剑招不止一种，看你悟性。', pool: ['variation_pierce', 'pursuit_strike', 'pursuit_armor_break'], choices: 2, weight: 1 },
    'ancient_scroll': { title: '古武残卷',     description: '山洞里捡到一本残破剑谱，记载"连斩"心法。', pool: ['variation_chain', 'pursuit_strike'], choices: 2, weight: 1 },
    'black_market':   { title: '黑市商人',     description: '"这张追击符贴在你的剑上，保证一剑三连。"', pool: ['pursuit_bleed', 'pursuit_armor_break', 'variation_execute'], choices: 3, weight: 1, cost: 1000 },
    'secret_vault':   { title: '宗门密藏',     description: '藏经阁中有一式"裂地"，可将剑气化为群攻。', pool: ['variation_cleave', 'variation_execute'], choices: 1, weight: 0.5 }
};

export const RANDOM_EVENTS = {
    positive: [
        { title: '发现宝藏', description: '你发现了前人埋藏的宝藏——等等，这是你自己埋的', effect: { goldPercent: 10 } },
        { title: '获得祝福', description: '神秘老人给你祝福——"记得带礼物回去"', effect: { skill: 5 } },
        { title: '捕获猎物', description: '你捕获了一只会下金蛋的史莱姆——它其实只会吐泡泡', effect: { gold: 1200 } },
        { title: '王室分红', description: '领主说你表现不错——"这是股息，不是奖金"', effect: { goldPercent: 7 } },
        { title: '领主赏赐', description: '领主赏赐你——条件是帮他写三封情书', effect: { gold: 2000 } },
        { title: '成就感爆发', description: '完成重要项目，成就感满满', effect: { achievement: 10 } },
        { title: '授予爵位', description: '你被授予骑士称号——"恭喜成为骑士老爷"', effect: { authority: 5 } }
    ],
    negative: [
        { title: '遭遇陷阱', description: '你踩到了自己之前埋的陷阱——"防贼防到底"', effect: { goldPercent: -10 } },
        { title: '遭遇盗贼', description: '盗贼说"此路是我开"——你反问他执照', effect: { gold: -500 } },
        { title: '迷失方向', description: '你自信地往东走了三小时——地图显示你在原地转圈', effect: { goldPercent: -8 } },
        { title: '中毒受伤', description: '你吃了野生蘑菇——恭喜解锁"拉肚子"debuff', effect: { gold: -800, hp: -5 } },
        { title: '疲惫不堪', description: '你连续战斗了三天——马都比你精神', effect: { hp: -10 } },
        { title: '士气低落', description: '你听到有人说"这骑士好像不太行"', effect: { mp: -10 } }
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

export const PARTNERS = {
    normal: [
        { name: '小雪', personality: '温柔体贴', familyBackground: '良好', initialSatisfaction: 75, darkThreshold: 30, blessing: { damageBoost: 0.1, shieldBoost: 0.1 } },
        { name: '小林', personality: '独立自信', familyBackground: '中等', initialSatisfaction: 70, darkThreshold: 35, blessing: { skillBoost: 0.15, achievementBoost: 0.1 } },
        { name: '阿华', personality: '活泼开朗', familyBackground: '普通', initialSatisfaction: 65, darkThreshold: 40, blessing: { goldBoost: 0.1, authorityBoost: 0.1 } }
    ],
    dark: [
        { name: '神秘人X', personality: '神秘莫测', familyBackground: '不明', initialSatisfaction: 50, darkThreshold: 50, blessing: { damageBoost: 0.25, skillBoost: 0.2 }, darkBlessing: true },
        { name: '黑影',   personality: '难以捉摸', familyBackground: '未知', initialSatisfaction: 45, darkThreshold: 55, blessing: { damageBoost: 0.3, authorityBoost: 0.2 }, darkBlessing: true }
    ]
};

export const NODE_TYPES = {
    BATTLE: 'battle', ELITE: 'elite', BOSS: 'boss',
    EVENT: 'event',   REST: 'rest',   SHOP: 'shop'
};

export const ENEMIES = {
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
        { name: '远古巨龙',   hp: 180, damage: 18, skill: 10, gold: 1500, exp: 18, flavor: '自称永恒之王——其实大部分时间在睡觉' },
        { name: '深渊领主',   hp: 160, damage: 15, skill: 8,  gold: 1300, exp: 15, flavor: '持续削弱来访者的心智', debuffStack: true },
        { name: '魔兽之王',   hp: 200, damage: 20, skill: 12, gold: 1800, exp: 22, flavor: '攻防双高，奖励丰厚' },
        { name: '霜焰凤凰',   hp: 170, damage: 16, skill: 10, gold: 1600, exp: 20, flavor: '冰火双属性伤害，每两回合叠加' },
        { name: '诅咒石像鬼', hp: 210, damage: 14, skill: 9,  gold: 1500, exp: 18, flavor: '反弹部分物理伤害' },
        { name: '暗影巫王',   hp: 180, damage: 18, skill: 11, gold: 1700, exp: 22, flavor: '诅咒使你每回合少抽 1 张牌' },
        { name: '混沌之主',   hp: 280, damage: 25, skill: 18, gold: 3000, exp: 40, flavor: '终极挑战——通关可获最高评价' },
        { name: '虚空领航者', hp: 240, damage: 22, skill: 16, gold: 2800, exp: 35, flavor: '命中后剥夺你的行动力' },
        { name: '远古梦魇',   hp: 260, damage: 24, skill: 17, gold: 3200, exp: 42, flavor: '每回合召唤 1 个普通小怪助战' }
    ]
};
