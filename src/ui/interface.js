import { GameState } from '../engine/state.js';

const contextMenuTemplate = {
    units: {
        harvester: {
            icon: '🤖',
            name: 'Harvester Bot',
            description: 'Собирает ресурсы',
            cost: { metal: 30, gold: 10 }
        }
    },
    buildings: {
        powerplant: {
            icon: '⚡',
            name: 'Power Plant',
            description: 'Производит энергию',
            cost: { metal: 50, gold: 20 }
        },
        barracks: {
            icon: '🏛️',
            name: 'Barracks',
            description: 'Тренирует пехоту',
            cost: { metal: 100, gold: 30 }
        },
        factory: {
            icon: '🏭',
            name: 'Factory',
            description: 'Производит технику',
            cost: { metal: 150, gold: 50 }
        }
    }
};

export function initInterface() {
    const gameInterface = document.getElementById('gameinterface');
    
    // Создаем контекстное меню
    const contextMenu = createContextMenu();
    gameInterface.appendChild(contextMenu);
    
    // Обработчики событий через делегирование
    gameInterface.addEventListener('click', handleInterfaceClick);
}

function createContextMenu() {
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.display = 'none';
    
    // Создаем группы меню
    Object.entries(contextMenuTemplate).forEach(([group, items]) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'context-menu-group';
        
        Object.entries(items).forEach(([id, item]) => {
            const itemElement = createMenuItem(id, item);
            groupElement.appendChild(itemElement);
        });
        
        menu.appendChild(groupElement);
    });
    
    return menu;
}

function createMenuItem(id, item) {
    const element = document.createElement('div');
    element.className = 'context-menu-item';
    element.dataset.id = id;
    
    element.innerHTML = `
        <div class="icon">${item.icon}</div>
        <div class="info">
            <div class="name">${item.name}</div>
            <div class="description">${item.description}</div>
        </div>
        <div class="cost">M:${item.cost.metal} G:${item.cost.gold}</div>
    `;
    
    return element;
}

function handleInterfaceClick(e) {
    // Обработка клика по кнопкам команд
    if (e.target.closest('.command-button')) {
        const button = e.target.closest('.command-button');
        const action = button.dataset.action;
        handleCommand(action);
    }
    
    // Обработка клика по пунктам контекстного меню
    if (e.target.closest('.context-menu-item')) {
        const item = e.target.closest('.context-menu-item');
        const id = item.dataset.id;
        handleMenuItemClick(id);
    }
}

function handleCommand(action) {
    const contextMenu = document.getElementById('context-menu');
    
    switch (action) {
        case 'buildings':
            showContextMenu(contextMenu, 'buildings');
            break;
        case 'defenses':
            // Реализовать
            break;
        case 'infantry':
            // Реализовать
            break;
        case 'vehicles':
            // Реализовать
            break;
        case 'aircraft':
            // Реализовать
            break;
    }
}

function showContextMenu(menu, group) {
    const button = document.querySelector(`[data-action="${group}"]`);
    const rect = button.getBoundingClientRect();
    
    menu.style.display = 'block';
    menu.style.left = `${rect.left}px`;
    menu.style.bottom = `${window.innerHeight - rect.top}px`;
    
    // Показываем только нужную группу
    menu.querySelectorAll('.context-menu-group').forEach(groupElement => {
        groupElement.style.display = groupElement.classList.contains(group) ? 'block' : 'none';
    });
    
    // Закрываем меню при клике вне его
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && !button.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    };
    
    document.addEventListener('click', closeMenu);
}

function handleMenuItemClick(id) {
    const item = contextMenuTemplate.buildings[id] || contextMenuTemplate.units[id];
    if (item && GameState.hasEnoughResources(item.cost)) {
        GameState.deductResources(item.cost);
        // Здесь будет создание выбранного юнита или здания
    }
} 