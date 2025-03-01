// buildings.js
import { BaseEntity } from '../base-entity.js';

const tileSize = 32; // Определяем размер тайла локально

export class Building extends BaseEntity {
    constructor(x, y, type) {
        super(x, y, type, '#4a9eff');
        this.constructionProgress = 0;
        this.isConstructing = true;
    }
}

export const buildings = {
    types: {
        commandCenter: {
            name: 'Command Center',
            cost: { metal: 200, gold: 100 },
            buildTime: 30,
            hp: 1000
        },
        barracks: {
            name: 'Barracks',
            cost: { metal: 150, gold: 50 },
            buildTime: 20,
            hp: 800
        },
        factory: {
            name: 'Factory',
            cost: { metal: 300, gold: 150 },
            buildTime: 40,
            hp: 1200
        }
    },
    
    create(type, x, y) {
        return new Building(x, y, type);
    }
};

export function initializeBuildings(ctx, buildingsArray) {
    console.log('Инициализация зданий...');
}

export function createBuilding(x, y, type, color, buildingsArray) {
    const building = { 
        x, 
        y, 
        type, 
        hp: buildings.types[type].hitpoints,
        size: buildings.types[type].size,
        color 
    };
    buildingsArray.push(building);
    console.log(`Создано здание: ${type} на (${x}, ${y})`);
    return building;
}

export function drawBuilding(building, ctx) {
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x * tileSize, building.y * tileSize, tileSize * building.size, tileSize * building.size);
    ctx.strokeStyle = '#aaa';
    ctx.strokeRect(building.x * tileSize, building.y * tileSize, tileSize * building.size, tileSize * building.size);
    drawHealthBar(building, ctx);
}

export function drawHealthBar(entity, ctx) {
    if (entity.hp === undefined) return;
    const width = tileSize * entity.size;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(entity.x * tileSize, entity.y * tileSize - 10, width, 6);
    ctx.fillStyle = '#2ecc71';
    const maxHp = buildings.types[entity.type].hitpoints;
    ctx.fillRect(entity.x * tileSize, entity.y * tileSize - 10, width * (entity.hp / maxHp), 6);
}

export function drawBuildings(ctx, buildingsArray) {
    buildingsArray.forEach(building => drawBuilding(building, ctx));
}

export function updateBuildings(ctx) {
    buildings.forEach(building => drawBuilding(building, ctx));
    console.log('Здания обновлены');
}

export function attackBuilding(attacker, building) {
    if (distance({ x: attacker.x, y: attacker.y }, building) <= unitStats[attacker.type].range) {
        building.hp -= unitStats[attacker.type].damage || 0;
        const ctx = document.getElementById('map').getContext('2d');
        drawBuilding(building, ctx);
        if (building.hp <= 0) {
            buildings.splice(buildings.indexOf(building), 1);
            createExplosion(building.x + 1, building.y + 1);
            playSound('tank-sound');
            console.log(`Здание ${building.type} уничтожено`);
        }
    } else {
        const grid = new PF.Grid(mapWidth, mapHeight);
        const finder = new PF.AStarFinder();
        const path = finder.findPath(attacker.x, attacker.y, building.x, building.y, grid.clone());
        if (path && path.length > 0) attacker.path = path;
        console.log(`Юнит ${attacker.type} движется к зданию для атаки`);
    }
}

function distance(entity1, entity2) {
    return Math.sqrt((entity1.x - entity2.x) ** 2 + (entity1.y - entity2.y) ** 2);
}

function createExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${(x + 0.5) * tileSize - 16}px`;
    explosion.style.top = `${(y + 0.5) * tileSize - 16}px`;
    document.getElementById('map').appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

function playSound(sound) {
    const audio = document.getElementById(sound);
    audio.play();
}

export function updateBuildingInfo(building) {
    const buildingInfo = document.getElementById('building-info');
    if (!building) {
        buildingInfo.innerHTML = '';
        return;
    }

    const stats = buildingStats[building.type];
    const healthPercent = Math.round((building.hp / stats.maxHp) * 100);
    
    buildingInfo.innerHTML = `
        <h3>${stats.name}</h3>
        <div class="building-stats">
            <div>Здоровье: ${healthPercent}%</div>
            <div class="health-bar">
                <div class="fill" style="width: ${healthPercent}%; background: hsl(${120 * (building.hp/stats.maxHp)}, 100%, 50%)"></div>
            </div>
            <div>Броня: ${stats.armor}</div>
            ${building.constructionProgress < 100 ? 
                `<div>Строительство: ${Math.round(building.constructionProgress)}%</div>
                <div class="progress-bar">
                    <div class="fill" style="width: ${building.constructionProgress}%"></div>
                </div>` : 
                ''
            }
        </div>
    `;
}

export function placeBuilding(type, x, y, color = '#4a9eff') {
    const stats = buildingStats[type];
    if (!stats) {
        showMessage('Неверный тип здания', 'error');
        return null;
    }

    // Проверяем наличие ресурсов
    if (!hasEnoughResources(stats.cost)) {
        showMessage('Недостаточно ресурсов', 'error');
        return null;
    }

    // Проверяем возможность размещения
    if (!canPlaceBuilding(x, y, stats.size)) {
        showMessage('Невозможно разместить здание здесь', 'error');
        return null;
    }

    // Списываем ресурсы
    deductResources(stats.cost);

    // Создаем здание
    const building = {
        type,
        x,
        y,
        color,
        size: stats.size,
        hp: stats.maxHp,
        constructionProgress: 0
    };

    buildings.push(building);
    showMessage(`Начато строительство ${stats.name}`, 'success');
    return building;
}

function hasEnoughResources(cost) {
    return (
        wood >= (cost.wood || 0) &&
        metal >= (cost.metal || 0) &&
        gold >= (cost.gold || 0)
    );
}

function deductResources(cost) {
    wood -= cost.wood || 0;
    metal -= cost.metal || 0;
    gold -= cost.gold || 0;
    updateResourceDisplay();
}

function canPlaceBuilding(x, y, size) {
    // Проверяем каждую клетку, которую займет здание
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const checkX = x + i;
            const checkY = y + j;

            // Проверяем границы карты
            if (checkX < 0 || checkX >= mapWidth || checkY < 0 || checkY >= mapHeight) {
                return false;
            }

            // Проверяем наличие других зданий
            if (buildings.some(b => 
                checkX >= b.x && checkX < b.x + b.size &&
                checkY >= b.y && checkY < b.y + b.size
            )) {
                return false;
            }

            // Проверяем наличие юнитов
            if (units.some(u => Math.floor(u.x) === checkX && Math.floor(u.y) === checkY)) {
                return false;
            }
        }
    }
    return true;
}