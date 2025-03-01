// units.js
import { BaseEntity } from '../base-entity.js';

export class Unit extends BaseEntity {
    constructor(x, y, type) {
        super(x, y, type, '#2ecc71');
        this.speed = 2;
        this.targetX = x;
        this.targetY = y;
    }
}

export const units = {
    types: {
        worker: {
            name: 'Worker',
            cost: { metal: 50, gold: 25 },
            buildTime: 10,
            hp: 100,
            speed: 2
        },
        soldier: {
            name: 'Soldier',
            cost: { metal: 100, gold: 50 },
            buildTime: 15,
            hp: 200,
            speed: 1.5
        },
        engineer: {
            name: 'Engineer',
            cost: { metal: 75, gold: 50 },
            buildTime: 12,
            hp: 150,
            speed: 1.8
        }
    },
    
    create(type, x, y) {
        return new Unit(x, y, type);
    },
    
    // Массив для хранения созданных юнитов
    list: []
};

// Вспомогательные функции
export function drawHealthBar(entity, ctx, tileSize) {
    if (!entity || !entity.hp) return;
    
    const healthBarWidth = tileSize * 0.8;
    const healthBarHeight = 4;
    const x = entity.x * tileSize;
    const y = entity.y * tileSize;
    const healthBarX = x + (tileSize - healthBarWidth) / 2;
    const healthBarY = y - 6;
    
    // Фон полоски здоровья
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Заполнение полоски здоровья
    const healthPercent = entity.hp / entity.maxHp;
    ctx.fillStyle = `hsl(${120 * healthPercent}, 100%, 50%)`;
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
}

export function spawnUnit(type, x, y) {
    const unit = units.create(type, x, y);
    units.list.push(unit);
    return unit;
}

export function drawUnits(ctx, tileSize) {
    units.list.forEach(unit => {
        // Рисуем юнит
        ctx.fillStyle = unit.color;
        ctx.fillRect(
            unit.x * tileSize, 
            unit.y * tileSize, 
            tileSize, 
            tileSize
        );
        
        // Рисуем полоску здоровья
        drawHealthBar(unit, ctx, tileSize);
    });
}

export function moveUnit(unit, targetX, targetY) {
    if (!unit) return;
    
    unit.targetX = targetX;
    unit.targetY = targetY;
    
    // Здесь будет логика движения юнита
    console.log(`Юнит движется к (${targetX}, ${targetY})`);
}

function distance(entity1, entity2) {
    return Math.sqrt(
        Math.pow(entity1.x - entity2.x, 2) + 
        Math.pow(entity1.y - entity2.y, 2)
    );
}