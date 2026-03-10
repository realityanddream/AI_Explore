// ============================================================
// 光路工坊 - 粒子系统
// ============================================================

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.color = { r: 1, g: 1, b: 1 };
        this.size = 2;
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
            return;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
}

class ParticleSystem {
    constructor(poolSize) {
        this.pool = [];
        for (let i = 0; i < (poolSize || 500); i++) {
            this.pool.push(new Particle());
        }
    }

    getParticle() {
        for (const p of this.pool) {
            if (!p.active) return p;
        }
        return null;
    }

    update(dt) {
        for (const p of this.pool) {
            p.update(dt);
        }
    }

    spawnExplosion(x, y, color, count) {
        count = count || 20;
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.3 + Math.random() * 0.5;
            p.maxLife = p.life;
            p.color = color || { r: 1, g: 0.5, b: 0 };
            p.size = 2 + Math.random() * 3;
            p.active = true;
        }
    }

    spawnAOE(x, y, radius, color) {
        const count = 30;
        const pixelRadius = radius * CELL_SIZE;
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = pixelRadius / 0.4;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.3 + Math.random() * 0.2;
            p.maxLife = p.life;
            p.color = color || { r: 0.8, g: 0.3, b: 1 };
            p.size = 3 + Math.random() * 2;
            p.active = true;
        }
    }

    spawnHit(x, y, color) {
        for (let i = 0; i < 5; i++) {
            const p = this.getParticle();
            if (!p) break;
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.15 + Math.random() * 0.15;
            p.maxLife = p.life;
            p.color = color || { r: 1, g: 1, b: 1 };
            p.size = 1.5 + Math.random() * 1.5;
            p.active = true;
        }
    }

    render(ctx) {
        for (const p of this.pool) {
            if (!p.active) continue;
            const alpha = (p.life / p.maxLife) * 0.8;
            const size = p.size * (p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colorToCSS(p.color);
            ctx.shadowBlur = 8;
            ctx.shadowColor = colorToCSS(p.color);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
