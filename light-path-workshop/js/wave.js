// ============================================================
// 光路工坊 - 波次管理
// ============================================================

class WaveManager {
    constructor() {
        this.waves = [];
        this.currentWaveIndex = -1;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.waveActive = false;
        this.paths = []; // 支持多条路径
    }

    loadWaves(waveData, paths) {
        this.waves = waveData;
        // paths 可以是单条路径数组或多条路径的数组
        this.paths = Array.isArray(paths[0]) ? paths : [paths];
        this.currentWaveIndex = -1;
        this.spawnQueue = [];
        this.waveActive = false;
    }

    hasNextWave() {
        return this.currentWaveIndex < this.waves.length - 1;
    }

    startNextWave() {
        this.currentWaveIndex++;
        if (this.currentWaveIndex >= this.waves.length) return false;

        const wave = this.waves[this.currentWaveIndex];
        this.spawnQueue = [];

        for (const group of wave.enemies) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    colorWeakness: group.colorWeakness || null,
                    delay: group.delay + i * group.interval,
                    pathIndex: group.pathIndex !== undefined ? group.pathIndex : (this.paths.length > 1 ? i % this.paths.length : 0)
                });
            }
        }

        // 按 delay 排序
        this.spawnQueue.sort((a, b) => a.delay - b.delay);
        this.spawnTimer = 0;
        this.waveActive = true;
        return true;
    }

    update(dt, enemies) {
        if (!this.waveActive) return;

        this.spawnTimer += dt;

        while (this.spawnQueue.length > 0 && this.spawnQueue[0].delay <= this.spawnTimer) {
            const spawn = this.spawnQueue.shift();
            const pathIdx = spawn.pathIndex || 0;
            const path = this.paths[pathIdx % this.paths.length];
            const enemy = createEnemy(spawn.type, path, spawn.colorWeakness);
            enemies.push(enemy);
        }

        if (this.spawnQueue.length === 0) {
            this.waveActive = false;
        }
    }

    isSpawning() {
        return this.waveActive && this.spawnQueue.length > 0;
    }

    isWaveComplete(enemies) {
        return !this.waveActive &&
               this.spawnQueue.length === 0 &&
               enemies.every(e => !e.alive || e.reachedEnd);
    }

    areAllWavesComplete(enemies) {
        return this.currentWaveIndex >= this.waves.length - 1 &&
               this.isWaveComplete(enemies);
    }

    getWaveNumber() {
        return this.currentWaveIndex + 1;
    }

    getTotalWaves() {
        return this.waves.length;
    }
}
