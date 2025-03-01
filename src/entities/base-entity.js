export class BaseEntity {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.hp = 100;
        this.maxHp = 100;
        this.selected = false;
    }

    update() {
        // Базовая логика обновления
    }

    draw(ctx) {
        // Базовая логика отрисовки
    }

    damage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        return this.hp <= 0;
    }

    heal(amount) {
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