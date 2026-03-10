// ============================================================
// 光路工坊 - 敌人系统（含击杀奖励 & 减速）
// ============================================================

class Enemy {
    constructor(type, path, colorWeakness) {
        const stats = ENEMY_STATS[type];
        this.type = type;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.baseSpeed = stats.speed;
        this.speed = stats.speed;
        this.armor = stats.armor;
        this.radius = stats.radius;
        this.reward = stats.reward;
        this.colorWeakness = colorWeakness || null;

        this.path = path;
        this.pathIndex = 0;
        this.pathProgress = 0;

        this.x = path[0].x;
        this.y = path[0].y;
        this.alive = true;
        this.reachedEnd = false;

        this.hitFlash = 0;
        this.slowTimer = 0; // 减速剩余时间
        this._exploded = false;
    }

    update(dt) {
        if (!this.alive || this.reachedEnd) return;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // 减速处理
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            this.speed = this.baseSpeed * 0.5;
        } else {
            this.speed = this.baseSpeed;
        }

        const moveAmount = this.speed * CELL_SIZE * dt;
        let remaining = moveAmount;

        while (remaining > 0 && this.pathIndex < this.path.length - 1) {
            const curr = this.path[this.pathIndex];
            const next = this.path[this.pathIndex + 1];
            const dx = next.x - curr.x;
            const dy = next.y - curr.y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (segLen === 0) {
                this.pathIndex++;
                continue;
            }

            const remainInSeg = (1 - this.pathProgress) * segLen;

            if (remaining >= remainInSeg) {
                remaining -= remainInSeg;
                this.pathIndex++;
                this.pathProgress = 0;
            } else {
                this.pathProgress += remaining / segLen;
                remaining = 0;
            }
        }

        if (this.pathIndex >= this.path.length - 1) {
            this.x = this.path[this.path.length - 1].x;
            this.y = this.path[this.path.length - 1].y;
            this.reachedEnd = true;
            return;
        }

        const curr = this.path[this.pathIndex];
        const next = this.path[this.pathIndex + 1];
        this.x = curr.x + (next.x - curr.x) * this.pathProgress;
        this.y = curr.y + (next.y - curr.y) * this.pathProgress;
    }

    takeDamage(amount) {
        const actual = Math.max(0, amount - this.armor);
        this.hp -= actual;
        this.hitFlash = 0.1;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
        }
    }

    applySlow(duration) {
        this.slowTimer = Math.max(this.slowTimer, duration);
    }

    isSlowed() {
        return this.slowTimer > 0;
    }
}

function createEnemy(type, path, colorWeakness) {
    return new Enemy(type, path, colorWeakness);
}
