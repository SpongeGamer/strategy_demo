export class BaseEntity {
    constructor(x, y, type, color = '#3498db') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.selected = false;
        this.hp = 100;
        this.maxHp = 100;
    }

    update() {
        // Базовая логика обновления
    }

    draw(ctx, tileSize) {
        // Базовая отрисовка - переопределяется в наследниках
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        
        if (this.selected) {
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x * tileSize, this.y * tileSize, tileSize, tileSize);
        }
    }

    damage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    repair(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
    }

    isAlive() {
        return this.hp > 0;
    }
} 