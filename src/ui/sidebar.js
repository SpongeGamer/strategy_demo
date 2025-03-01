import { GameState } from '../engine/state.js';

const sidebarButtons = {
    starport: {
        title: 'Starport',
        icon: '🚀',
        cost: { metal: 200, gold: 100 }
    },
    turret: {
        title: 'Turret',
        icon: '🎯',
        cost: { metal: 150, gold: 50 }
    },
    scouttank: {
        title: 'Scout Tank',
        icon: '🛸',
        cost: { metal: 100, gold: 30 }
    },
    heavytank: {
        title: 'Heavy Tank',
        icon: '🛡️',
        cost: { metal: 200, gold: 80 }
    },
    harvester: {
        title: 'Harvester',
        icon: '🤖',
        cost: { metal: 30, gold: 10 }
    }
};

export function initSidebar() {
    const sidebar = createSidebar();
    document.getElementById('gameinterface').appendChild(sidebar);
    
    // Обновляем состояние кнопок при изменении ресурсов
    updateButtonStates();
}

function createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebarbuttons';
    
    Object.entries(sidebarButtons).forEach(([id, data]) => {
        const button = createSidebarButton(id, data);
        sidebar.appendChild(button);
    });
    
    return sidebar;
}

function createSidebarButton(id, data) {
    const button = document.createElement('button');
    button.className = 'sidebar-button';
    button.dataset.id = id;
    button.title = `${data.title} (M:${data.cost.metal} G:${data.cost.gold})`;
    
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = data.icon;
    button.appendChild(icon);
    
    button.addEventListener('click', () => handleSidebarButtonClick(id, data));
    
    return button;
}

function handleSidebarButtonClick(id, data) {
    if (GameState.hasEnoughResources(data.cost)) {
        GameState.deductResources(data.cost);
        // Здесь будет создание выбранного объекта
        console.log(`Creating ${id}`);
    } else {
        console.log('Not enough resources');
    }
}

function updateButtonStates() {
    const sidebar = document.getElementById('sidebarbuttons');
    if (!sidebar) return;
    
    Object.entries(sidebarButtons).forEach(([id, data]) => {
        const button = sidebar.querySelector(`[data-id="${id}"]`);
        if (button) {
            button.disabled = !GameState.hasEnoughResources(data.cost);
        }
    });
    
    // Обновляем состояние каждый раз при изменении ресурсов
    requestAnimationFrame(updateButtonStates);
} 