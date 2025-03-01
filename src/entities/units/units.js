// units.js
import { unitStats, units, game, mapWidth, tileSize, weather } from './game.js';
import { attackBuilding } from './buildings.js';

export function initializeUnits(ctx, unitsArray, stats) {
    console.log('Инициализация юнитов...');
}

export function spawnUnit(x, y, type, color) {
    const unit = { x, y, type, hp: unitStats[type].hp, color, path: [] };
    units.push(unit);
    drawUnit(unit, document.getElementById('map').getContext('2d'));
    console.log(`Создан юнит: ${type} на (${x}, ${y})`);
}

export function drawUnit(unit, ctx) {
    ctx.fillStyle = unit.color;
    ctx.fillRect(unit.x * tileSize, unit.y * tileSize, tileSize, tileSize);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(unit.x * tileSize, unit.y * tileSize, tileSize, tileSize);
    if (unit.hp !== undefined) drawHealthBar(unit, ctx);
}

export function drawHealthBar(entity, ctx) {
    if (entity.hp === undefined) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(entity.x * tileSize, entity.y * tileSize - 10, tileSize, 6);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(entity.x * tileSize, entity.y * tileSize - 10, tileSize * (entity.hp / (unitStats[entity.type]?.hp || 100)), 6);
}

export function drawUnits(ctx) {
    units.forEach(unit => {
        const x = Math.round(unit.x * tileSize);
        const y = Math.round(unit.y * tileSize);
        
        // Рисуем тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + tileSize/2, y + tileSize - 4, tileSize/3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Рисуем юнит
        ctx.fillStyle = unit.color;
        const unitSize = tileSize * 0.8;
        const offset = (tileSize - unitSize) / 2;
        ctx.fillRect(x + offset, y + offset, unitSize, unitSize);

        // Рисуем иконку типа юнита
        const icon = unitIcons[unit.type];
        if (icon) {
            ctx.drawImage(icon, x + offset, y + offset, unitSize, unitSize);
        }

        // Рисуем полоску здоровья
        const healthBarWidth = tileSize * 0.8;
        const healthBarHeight = 4;
        const healthBarX = x + (tileSize - healthBarWidth) / 2;
        const healthBarY = y - 6;

        // Фон полоски здоровья
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // Заполнение полоски здоровья
        const healthPercent = unit.hp / 100;
        const gradient = ctx.createLinearGradient(healthBarX, 0, healthBarX + healthBarWidth, 0);
        gradient.addColorStop(0, `hsl(${120 * healthPercent}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${120 * healthPercent}, 70%, 40%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    });
}

export function updateUnits(ctx, grid, finder) {
    units.forEach(unit => {
        if (unit.path && unit.path.length > 0) {
            const next = unit.path[0];
            const dist = distance(unit, { x: next[0], y: next[1] });
            if (dist < unitStats[unit.type].speed) {
                unit.x = next[0];
                unit.y = next[1];
                unit.path.shift();
            } else {
                const dx = (next[0] - unit.x) * unitStats[unit.type].speed / dist;
                const dy = (next[1] - unit.y) * unitStats[unit.type].speed / dist;
                unit.x += dx;
                unit.y += dy;
            }
            drawUnit(unit, ctx);
        }
        if (weather === 'rain') unit.speed *= 0.8;
        if (unit.type === 'medic') healNearbyUnits(unit, ctx);
    });
}

export function attackUnit(attacker, target) {
    if (distance(attacker, target) <= unitStats[attacker.type].range) {
        target.hp -= unitStats[attacker.type].damage || 0;
        const ctx = document.getElementById('map').getContext('2d');
        drawUnit(target, ctx);
        if (target.hp <= 0) {
            units.splice(units.indexOf(target), 1);
            createDebris(target.x, target.y);
            playSound('soldier-yell');
            console.log(`Юнит ${target.type} уничтожен`);
        }
    } else {
        const path = finder.findPath(attacker.x, attacker.y, target.x, target.y, grid.clone());
        if (path && path.length > 0) attacker.path = path;
        console.log(`Юнит ${attacker.type} движется к цели для атаки`);
    }
}

function healNearbyUnits(medic, ctx) {
    units.forEach(unit => {
        if (unit.color === '#4a9eff' && unit !== medic && distance(medic, unit) <= unitStats.medic.range) {
            unit.hp = Math.min(unitStats[unit.type].hp, unit.hp + unitStats.medic.heal);
            drawUnit(unit, ctx);
            console.log(`Медик лечит ${unit.type}, HP: ${unit.hp}`);
        }
    });
}

function distance(entity1, entity2) {
    return Math.sqrt((entity1.x - entity2.x) ** 2 + (entity1.y - entity2.y) ** 2);
}

function createDebris(x, y) {
    const debris = document.createElement('div');
    debris.className = 'resource-node stone';
    debris.style.left = `${x * tileSize}px`;
    debris.style.top = `${y * tileSize}px`;
    document.getElementById('map').appendChild(debris);
}

function playSound(sound) {
    const audio = document.getElementById(sound);
    audio.play();
}

export { attackBuilding };

export function moveUnit(unit, targetX, targetY) {
    if (!unit) return;

    // Находим путь с помощью A*
    const startX = Math.floor(unit.x);
    const startY = Math.floor(unit.y);
    const endX = Math.floor(targetX);
    const endY = Math.floor(targetY);

    // Проверяем, не занята ли целевая клетка
    if (isOccupied(endX, endY)) {
        showMessage('Клетка занята', 'error');
        return;
    }

    const path = finder.findPath(startX, startY, endX, endY, grid.clone());
    
    if (path.length > 0) {
        // Удаляем первую точку, так как это текущая позиция
        path.shift();
        unit.path = path;
        
        // Анимация движения
        const angle = Math.atan2(targetY - unit.y, targetX - unit.x);
        unit.rotation = angle;
        
        showMessage(`Юнит движется к (${endX}, ${endY})`, 'info');
    } else {
        showMessage('Путь не найден', 'error');
    }
}

export function updateUnitInfo(unit) {
    const unitInfo = document.getElementById('unit-info');
    if (!unit) {
        unitInfo.innerHTML = '';
        return;
    }

    const stats = unitStats[unit.type];
    const healthPercent = Math.round((unit.hp / 100) * 100);
    
    unitInfo.innerHTML = `
        <h3>${stats.name}</h3>
        <div class="unit-stats">
            <div>Здоровье: ${healthPercent}%</div>
            <div class="health-bar">
                <div class="fill" style="width: ${healthPercent}%; background: hsl(${120 * (unit.hp/100)}, 100%, 50%)"></div>
            </div>
            <div>Урон: ${stats.damage}</div>
            <div>Броня: ${stats.armor}</div>
            <div>Скорость: ${stats.speed}</div>
        </div>
    `;
}

function showMessage(text, type = 'info') {
    const messages = document.getElementById('game-messages');
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    messages.appendChild(message);

    // Удаляем сообщение через 3 секунды
    setTimeout(() => {
        message.remove();
    }, 3000);

    // Ограничиваем количество сообщений
    while (messages.children.length > 5) {
        messages.removeChild(messages.firstChild);
    }
}