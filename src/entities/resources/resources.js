// resources.js
import { game } from '../../engine/game.js';
import { BaseEntity } from '../base-entity.js';

const tileSize = 32;
const mapWidth = 100;
const mapHeight = 100;

const resourceColors = {
    wood: '#8B4513',
    metal: '#808080',
    gold: '#FFD700'
};

const resourceIcons = {
    wood: '🌲',
    metal: '⛰️',
    gold: '💰'
};

const resourceNodes = [];

export class Resource extends BaseEntity {
    constructor(x, y, type, amount) {
        super(x, y, type, '#f1c40f');
        this.amount = amount;
        this.maxAmount = amount;
    }
}

export const resources = {
    types: {
        trees: {
            name: 'Trees',
            harvestRate: 1,
            harvestAmount: 10
        },
        metal: {
            name: 'Metal',
            harvestRate: 0.8,
            harvestAmount: 15
        },
        gold: {
            name: 'Gold',
            harvestRate: 0.5,
            harvestAmount: 5
        }
    },
    
    create(type, x, y, amount) {
        return new Resource(x, y, type, amount);
    },
    
    wood: 0,
    metal: 0,
    gold: 0,
    
    init: function() {
        this.wood = 50;
        this.metal = 50;
        this.gold = 20;
        this.updateDisplay();
    },
    
    updateDisplay: function() {
        document.getElementById('trees-count').textContent = this.wood;
        document.getElementById('metal-count').textContent = this.metal;
        document.getElementById('gold-count').textContent = this.gold;
    },
    
    add: function(type, amount) {
        if (this[type] !== undefined) {
            this[type] += amount;
            this.updateDisplay();
        }
    },
    
    remove: function(type, amount) {
        if (this[type] !== undefined) {
            this[type] = Math.max(0, this[type] - amount);
            this.updateDisplay();
            return this[type] >= 0;
        }
        return false;
    },
    
    hasEnough: function(type, amount) {
        return this[type] !== undefined && this[type] >= amount;
    }
};

export function initializeResources(grid) {
    console.log('Инициализация ресурсов...');
    clearResources();
    spawnResources(grid);
    updateResourceDisplay();
}

function clearResources() {
    resourceNodes.length = 0;
    const existingNodes = document.querySelectorAll('.resource-node');
    existingNodes.forEach(node => node.remove());
}

export function spawnResources(grid) {
    const resources = {
        wood: { amount: 20, minDistance: 3 },
        metal: { amount: 15, minDistance: 4 },
        gold: { amount: 10, minDistance: 5 }
    };

    // Создаем сетку занятых клеток
    const occupiedCells = Array(mapWidth).fill().map(() => Array(mapHeight).fill(false));

    Object.entries(resources).forEach(([type, data]) => {
        let placed = 0;
        let attempts = 0;
        const maxAttempts = 100;

        while (placed < data.amount && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * (mapWidth - 4)) + 2;
            const y = Math.floor(Math.random() * (mapHeight - 4)) + 2;

            if (canPlaceResource(x, y, data.minDistance, occupiedCells)) {
                placeResource(x, y, type, grid, occupiedCells);
                placed++;
            }
            attempts++;
        }
    });

    createResourceClusters();
}

function canPlaceResource(x, y, minDistance, occupiedCells) {
    // Проверяем границы
    if (x < 2 || x >= mapWidth - 2 || y < 2 || y >= mapHeight - 2) return false;

    // Проверяем минимальное расстояние до других ресурсов
    for (let dx = -minDistance; dx <= minDistance; dx++) {
        for (let dy = -minDistance; dy <= minDistance; dy++) {
            const checkX = x + dx;
            const checkY = y + dy;
            if (checkX >= 0 && checkX < mapWidth && checkY >= 0 && checkY < mapHeight) {
                if (occupiedCells[checkX][checkY]) return false;
            }
        }
    }

    return true;
}

function placeResource(x, y, type, grid, occupiedCells) {
    const node = {
        x,
        y,
        type,
        amount: getInitialResourceAmount(type)
    };

    resourceNodes.push(node);
    occupiedCells[x][y] = true;
    grid.setWalkableAt(x, y, true);

    const element = document.createElement('div');
    element.className = `resource-node ${type}`;
    element.style.left = `${x * tileSize}px`;
    element.style.top = `${y * tileSize}px`;
    element.dataset.type = type;
    element.dataset.amount = node.amount;
    element.innerHTML = `<span class="resource-icon">${resourceIcons[type]}</span>`;
    document.getElementById('map').appendChild(element);
}

function getInitialResourceAmount(type) {
    switch (type) {
        case 'wood': return 100;
        case 'metal': return 75;
        case 'gold': return 50;
        default: return 50;
    }
}

function createResourceClusters() {
    resourceNodes.forEach(node => {
        if (Math.random() < 0.3) { // 30% шанс создания кластера
            const clusterSize = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < clusterSize; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 2 + 1;
                const x = Math.round(node.x + Math.cos(angle) * distance);
                const y = Math.round(node.y + Math.sin(angle) * distance);

                if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                    const smallNode = {
                        x,
                        y,
                        type: node.type,
                        amount: Math.floor(node.amount * 0.5)
                    };
                    resourceNodes.push(smallNode);
                }
            }
        }
    });
}

export function gatherResources(unit) {
    if (!unit || unit.type !== 'worker') return;

    const nearbyNodes = resourceNodes.filter(node => 
        Math.abs(node.x - unit.x) <= 1 && Math.abs(node.y - unit.y) <= 1
    );

    nearbyNodes.forEach(node => {
        const gatherAmount = getGatherAmount(node.type);
        const gathered = Math.min(gatherAmount, node.amount);
        
        if (gathered > 0) {
            node.amount -= gathered;
            addResources(node.type, gathered);

            // Создаем эффект сбора ресурса
            createGatherEffect(node);

            // Обновляем отображение
            updateResourceNode(node);
            updateResourceDisplay();

            // Если ресурс истощен, удаляем его
            if (node.amount <= 0) {
                removeResourceNode(node);
            }
        }
    });
}

function getGatherAmount(type) {
    switch (type) {
        case 'wood': return 5;
        case 'metal': return 3;
        case 'gold': return 2;
        default: return 1;
    }
}

function addResources(type, amount) {
    switch (type) {
        case 'wood': resources.wood += amount; break;
        case 'metal': resources.metal += amount; break;
        case 'gold': resources.gold += amount; break;
    }
}

function createGatherEffect(node) {
    const effect = document.createElement('div');
    effect.className = 'gather-effect';
    effect.style.left = `${node.x * tileSize}px`;
    effect.style.top = `${node.y * tileSize}px`;
    effect.textContent = `+${getGatherAmount(node.type)}`;
    document.getElementById('map').appendChild(effect);

    // Анимация эффекта
    effect.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-20px)', opacity: 0 }
    ], {
        duration: 1000,
        easing: 'ease-out'
    }).onfinish = () => effect.remove();
}

function updateResourceNode(node) {
    const element = document.querySelector(`.resource-node[style*="left: ${node.x * tileSize}px"][style*="top: ${node.y * tileSize}px"]`);
    if (element) {
        element.dataset.amount = node.amount;
        const opacity = 0.3 + (node.amount / getInitialResourceAmount(node.type)) * 0.7;
        element.style.opacity = opacity;
    }
}

function removeResourceNode(node) {
    const index = resourceNodes.indexOf(node);
    if (index !== -1) {
        resourceNodes.splice(index, 1);
        const element = document.querySelector(`.resource-node[style*="left: ${node.x * tileSize}px"][style*="top: ${node.y * tileSize}px"]`);
        if (element) {
            element.remove();
        }
    }
}

export function updateResourceDisplay() {
    document.getElementById('wood-amount').textContent = resources.wood;
    document.getElementById('metal-amount').textContent = resources.metal;
    document.getElementById('gold-amount').textContent = resources.gold;
    
    updateBuildButtons();
}

export function updateBuildButtons() {
    const buttons = {
        'build-starport': { metal: 100, gold: 50 },
        'build-barracks': { metal: 50, gold: 50 },
        'build-factory': { metal: 100, gold: 50 },
        'build-warehouse': { metal: 50 },
        'build-tower': { metal: 50, gold: 50 },
        'build-lab': { gold: 100, metal: 50 }
    };

    Object.entries(buttons).forEach(([id, cost]) => {
        const button = document.getElementById(id);
        if (button) {
            button.disabled = !canAfford(cost);
        }
    });
}

function canAfford(cost) {
    return (!cost.wood || resources.wood >= cost.wood) &&
           (!cost.metal || resources.metal >= cost.metal) &&
           (!cost.gold || resources.gold >= cost.gold);
}

function isValidResourcePosition(x, y, grid) {
    if (!grid.isWalkableAt(x, y)) return false;
    
    const nearby = document.querySelectorAll('.resource-node');
    for (const node of nearby) {
        const nodeX = parseInt(node.style.left) / tileSize;
        const nodeY = parseInt(node.style.top) / tileSize;
        if (Math.abs(x - nodeX) < 2 && Math.abs(y - nodeY) < 2) return false;
    }
    
    return true;
}