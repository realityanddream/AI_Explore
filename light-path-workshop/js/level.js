// ============================================================
// 光路工坊 - 关卡数据
// ============================================================

const LEVELS = [
    // ---- 关卡 1: 光之初学 ----
    {
        id: 1,
        name: '光之初学',
        description: '学习使用反射镜引导激光照射敌人路径',
        gridSize: { cols: 12, rows: 10 },
        terrain: [
            [0,0,0,0,0,3,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,4,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        enemyPath: [
            {col:5,row:0},{col:5,row:1},{col:5,row:2},
            {col:6,row:2},{col:7,row:2},{col:8,row:2},
            {col:8,row:3},{col:8,row:4},{col:8,row:5},
            {col:7,row:5},{col:6,row:5},{col:5,row:5},{col:4,row:5},
            {col:4,row:6},{col:4,row:7},{col:4,row:8},
            {col:5,row:8},{col:6,row:8},{col:7,row:8}
        ],
        preplacedElements: [
            { type: 'LASER_SOURCE', col: 0, row: 4, direction: 'RIGHT', color: {r:1,g:0,b:0} }
        ],
        availableElements: {
            MIRROR: 5,
            PRISM: 0,
            COLOR_FILTER: 0,
            FOCUS_LENS: 0,
            ENERGY_CRYSTAL: 0
        },
        waves: [
            {
                enemies: [
                    { type: 'BASIC', count: 5, interval: 2.0, delay: 0 }
                ]
            },
            {
                enemies: [
                    { type: 'BASIC', count: 8, interval: 1.5, delay: 0 }
                ]
            }
        ],
        lives: 20,
        tutorial: [
            { trigger: 'LEVEL_START', message: '将反射镜放在网格上，引导红色激光照射敌人路径！' },
            { trigger: 'FIRST_PLACE', message: '右键点击反射镜可以旋转方向（/ 和 \\ 切换）' }
        ]
    },

    // ---- 关卡 2: 分光之术 ----
    {
        id: 2,
        name: '分光之术',
        description: '用棱镜将光束分裂，覆盖分叉路径',
        gridSize: { cols: 14, rows: 10 },
        terrain: [
            [0,0,0,0,0,0,3,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,4,0,0,0,0,0,4,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        enemyPaths: [
            [
                {col:6,row:0},{col:6,row:1},{col:6,row:2},{col:6,row:3},
                {col:5,row:3},{col:4,row:3},{col:3,row:3},
                {col:3,row:4},{col:3,row:5},{col:3,row:6},{col:3,row:7}
            ],
            [
                {col:6,row:0},{col:6,row:1},{col:6,row:2},{col:6,row:3},
                {col:7,row:3},{col:8,row:3},{col:9,row:3},
                {col:9,row:4},{col:9,row:5},{col:9,row:6},{col:9,row:7}
            ]
        ],
        preplacedElements: [
            { type: 'LASER_SOURCE', col: 0, row: 5, direction: 'RIGHT', color: {r:1,g:0,b:0} }
        ],
        availableElements: {
            MIRROR: 4,
            PRISM: 2,
            COLOR_FILTER: 0,
            FOCUS_LENS: 0,
            ENERGY_CRYSTAL: 0
        },
        waves: [
            {
                enemies: [
                    { type: 'BASIC', count: 6, interval: 1.8, delay: 0 }
                ]
            },
            {
                enemies: [
                    { type: 'BASIC', count: 5, interval: 1.5, delay: 0 },
                    { type: 'FAST', count: 3, interval: 1.0, delay: 6 }
                ]
            },
            {
                enemies: [
                    { type: 'FAST', count: 6, interval: 0.8, delay: 0 },
                    { type: 'BASIC', count: 4, interval: 1.2, delay: 3 }
                ]
            }
        ],
        lives: 20,
        tutorial: [
            { trigger: 'LEVEL_START', message: '敌人路径分叉了！用棱镜分裂光束来覆盖两条路。' }
        ]
    },

    // ---- 关卡 3: 三原色 ----
    {
        id: 3,
        name: '三原色',
        description: '不同颜色的敌人需要对应颜色的光束才能有效打击',
        gridSize: { cols: 14, rows: 10 },
        terrain: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,3,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,4,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        enemyPath: [
            {col:4,row:1},{col:4,row:2},
            {col:5,row:2},{col:6,row:2},{col:7,row:2},{col:8,row:2},{col:9,row:2},
            {col:9,row:3},{col:9,row:4},{col:9,row:5},
            {col:8,row:5},{col:7,row:5},{col:6,row:5},{col:5,row:5},{col:4,row:5},
            {col:4,row:6},{col:4,row:7},
            {col:5,row:7},{col:6,row:7},{col:7,row:7},{col:8,row:7}
        ],
        preplacedElements: [
            { type: 'LASER_SOURCE', col: 0, row: 2, direction: 'RIGHT', color: {r:1,g:0,b:0} },
            { type: 'LASER_SOURCE', col: 0, row: 5, direction: 'RIGHT', color: {r:0,g:1,b:0} },
            { type: 'LASER_SOURCE', col: 13, row: 4, direction: 'LEFT', color: {r:0,g:0,b:1} }
        ],
        availableElements: {
            MIRROR: 5,
            PRISM: 1,
            COLOR_FILTER: 2,
            FOCUS_LENS: 0,
            ENERGY_CRYSTAL: 0
        },
        waves: [
            {
                enemies: [
                    { type: 'COLOR_SHIELDED', count: 4, interval: 2.0, delay: 0, colorWeakness: {r:1,g:0,b:0} },
                    { type: 'BASIC', count: 3, interval: 1.5, delay: 5 }
                ]
            },
            {
                enemies: [
                    { type: 'COLOR_SHIELDED', count: 3, interval: 2.0, delay: 0, colorWeakness: {r:0,g:1,b:0} },
                    { type: 'COLOR_SHIELDED', count: 3, interval: 2.0, delay: 4, colorWeakness: {r:0,g:0,b:1} }
                ]
            },
            {
                enemies: [
                    { type: 'COLOR_SHIELDED', count: 2, interval: 2.0, delay: 0, colorWeakness: {r:1,g:0,b:0} },
                    { type: 'COLOR_SHIELDED', count: 2, interval: 2.0, delay: 3, colorWeakness: {r:0,g:1,b:0} },
                    { type: 'COLOR_SHIELDED', count: 2, interval: 2.0, delay: 6, colorWeakness: {r:0,g:0,b:1} },
                    { type: 'FAST', count: 4, interval: 0.8, delay: 9 }
                ]
            }
        ],
        lives: 15,
        tutorial: [
            { trigger: 'LEVEL_START', message: '带色盾的敌人只能被对应颜色的光束伤害！用滤镜改变光束颜色。' }
        ]
    },

    // ---- 关卡 4: 聚能攻防 ----
    {
        id: 4,
        name: '聚能攻防',
        description: '用聚焦透镜合束对抗装甲敌人，用蓄能晶体清理小怪群',
        gridSize: { cols: 14, rows: 10 },
        terrain: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,3,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,1,1,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,4,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        enemyPath: [
            {col:3,row:1},{col:3,row:2},
            {col:4,row:2},{col:5,row:2},
            {col:5,row:3},{col:5,row:4},
            {col:6,row:4},{col:7,row:4},{col:8,row:4},
            {col:8,row:5},{col:8,row:6},
            {col:9,row:6},{col:10,row:6},
            {col:10,row:7},{col:10,row:8},{col:11,row:8}
        ],
        preplacedElements: [
            { type: 'LASER_SOURCE', col: 0, row: 3, direction: 'RIGHT', color: {r:1,g:0,b:0} },
            { type: 'LASER_SOURCE', col: 0, row: 7, direction: 'RIGHT', color: {r:0,g:1,b:0} }
        ],
        availableElements: {
            MIRROR: 5,
            PRISM: 1,
            COLOR_FILTER: 1,
            FOCUS_LENS: 1,
            ENERGY_CRYSTAL: 1
        },
        waves: [
            {
                enemies: [
                    { type: 'BASIC', count: 6, interval: 1.5, delay: 0 }
                ]
            },
            {
                enemies: [
                    { type: 'ARMORED', count: 3, interval: 3.0, delay: 0 },
                    { type: 'BASIC', count: 4, interval: 1.0, delay: 4 }
                ]
            },
            {
                enemies: [
                    { type: 'ARMORED', count: 4, interval: 2.5, delay: 0 },
                    { type: 'FAST', count: 6, interval: 0.6, delay: 5 }
                ]
            },
            {
                enemies: [
                    { type: 'ARMORED', count: 5, interval: 2.0, delay: 0 },
                    { type: 'FAST', count: 8, interval: 0.5, delay: 3 },
                    { type: 'ARMORED', count: 2, interval: 2.0, delay: 8 }
                ]
            }
        ],
        lives: 15,
        tutorial: [
            { trigger: 'LEVEL_START', message: '装甲敌人很厚！用聚焦透镜合并多条光束增强威力。蓄能晶体充满后会自动释放范围爆炸。' }
        ]
    },

    // ---- 关卡 5: 影之迷宫 ----
    {
        id: 5,
        name: '影之迷宫',
        description: '暗影敌人会阻断光路！需要设计冗余光路来应对',
        gridSize: { cols: 16, rows: 12 },
        terrain: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0],
            [0,0,0,0,1,0,0,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ],
        enemyPath: [
            {col:5,row:1},{col:5,row:2},
            {col:6,row:2},{col:7,row:2},{col:8,row:2},{col:9,row:2},{col:10,row:2},
            {col:10,row:3},{col:10,row:4},{col:10,row:5},{col:10,row:6},
            {col:9,row:6},{col:8,row:6},{col:7,row:6},{col:7,row:5},
            {col:7,row:4},{col:6,row:4},{col:5,row:4},{col:4,row:4},
            {col:4,row:5},{col:4,row:6},{col:4,row:7},{col:4,row:8},
            {col:5,row:8},{col:6,row:8},{col:7,row:8},{col:8,row:8},
            {col:8,row:9},{col:8,row:10}
        ],
        preplacedElements: [
            { type: 'LASER_SOURCE', col: 0, row: 3, direction: 'RIGHT', color: {r:1,g:0,b:0} },
            { type: 'LASER_SOURCE', col: 15, row: 6, direction: 'LEFT', color: {r:0,g:0,b:1} }
        ],
        availableElements: {
            MIRROR: 6,
            PRISM: 2,
            COLOR_FILTER: 2,
            FOCUS_LENS: 1,
            ENERGY_CRYSTAL: 1
        },
        waves: [
            {
                enemies: [
                    { type: 'BASIC', count: 6, interval: 1.5, delay: 0 },
                    { type: 'FAST', count: 3, interval: 1.0, delay: 5 }
                ]
            },
            {
                enemies: [
                    { type: 'COLOR_SHIELDED', count: 4, interval: 2.0, delay: 0, colorWeakness: {r:1,g:0,b:0} },
                    { type: 'COLOR_SHIELDED', count: 4, interval: 2.0, delay: 4, colorWeakness: {r:0,g:0,b:1} }
                ]
            },
            {
                enemies: [
                    { type: 'SHADOW', count: 3, interval: 3.0, delay: 0 },
                    { type: 'BASIC', count: 6, interval: 1.0, delay: 3 }
                ]
            },
            {
                enemies: [
                    { type: 'ARMORED', count: 3, interval: 2.5, delay: 0 },
                    { type: 'SHADOW', count: 4, interval: 2.0, delay: 3 },
                    { type: 'FAST', count: 5, interval: 0.6, delay: 7 }
                ]
            },
            {
                enemies: [
                    { type: 'SHADOW', count: 5, interval: 1.5, delay: 0 },
                    { type: 'ARMORED', count: 3, interval: 2.0, delay: 3 },
                    { type: 'COLOR_SHIELDED', count: 3, interval: 2.0, delay: 5, colorWeakness: {r:1,g:0,b:1} },
                    { type: 'FAST', count: 8, interval: 0.4, delay: 8 }
                ]
            }
        ],
        lives: 15,
        tutorial: [
            { trigger: 'LEVEL_START', message: '暗影敌人会阻断光路！设计多条光路作为备用方案。' }
        ]
    }
];

class LevelManager {
    constructor() {
        this.progress = this.loadProgress();
    }

    getLevel(index) {
        return LEVELS[index] || null;
    }

    getLevelCount() {
        return LEVELS.length;
    }

    isUnlocked(index) {
        if (index === 0) return true;
        return this.progress.completed.includes(index);
    }

    completeLevel(index) {
        if (!this.progress.completed.includes(index + 1)) {
            // 解锁下一关
        }
        if (!this.progress.completed.includes(index)) {
            this.progress.completed.push(index);
        }
        this.saveProgress();
    }

    saveProgress() {
        try {
            localStorage.setItem('lightpath_progress', JSON.stringify(this.progress));
        } catch (e) {}
    }

    loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem('lightpath_progress'));
            if (data && data.completed) return data;
        } catch (e) {}
        return { completed: [0] };
    }
}
