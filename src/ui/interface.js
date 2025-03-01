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

// Модуль для работы с интерфейсом
export const Interface = {
    // Инициализация интерфейса
    init() {
        console.log('Инициализация интерфейса...');
        
        try {
            // Проверяем наличие элементов интерфейса
            const startScreen = document.getElementById('startscreen');
            if (!startScreen) {
                console.error('Элемент startscreen не найден!');
            }
            
            const gameInterface = document.getElementById('gameinterfacescreen');
            if (!gameInterface) {
                console.error('Элемент gameinterfacescreen не найден!');
            }
            
            // Добавляем обработчик клика по игровому интерфейсу
            gameInterface.addEventListener('click', (e) => {
                this.handleInterfaceClick(e);
            });
            
            // Добавляем обработчик правого клика по игровому интерфейсу
            gameInterface.addEventListener('contextmenu', (e) => {
                this.handleInterfaceRightClick(e);
                e.preventDefault();
            });
            
            console.log('Интерфейс инициализирован');
        } catch (error) {
            console.error('Ошибка при инициализации интерфейса:', error);
        }
    },
    
    // Обработка клика по игровому интерфейсу
    handleInterfaceClick(e) {
        console.log('Клик по игровому интерфейсу');
        
        // Закрываем контекстное меню, если оно открыто
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu && contextMenu.style.display === 'block') {
            contextMenu.style.display = 'none';
        }
    },
    
    // Обработка правого клика по игровому интерфейсу
    handleInterfaceRightClick(e) {
        console.log('Правый клик по игровому интерфейсу');
        
        // Получаем координаты клика
        const x = e.clientX;
        const y = e.clientY;
        
        // Показываем контекстное меню
        this.showContextMenu(x, y);
    },
    
    // Отображение контекстного меню
    showContextMenu(x, y) {
        console.log('Контекстное меню отключено');
    },
    
    // Обработка действий из контекстного меню
    handleContextMenuAction(action, x, y) {
        console.log('Обработка контекстного меню отключена');
    },
    
    // Создание контекстного меню для базы
    createBaseContextMenu(base) {
        console.log('Контекстное меню базы отключено');
    },
    
    // Создание контекстного меню для юнита
    createUnitContextMenu(unit) {
        console.log('Контекстное меню юнита отключено');
    }
};

function initContextMenu() {
    const menu = document.getElementById('context-menu');
    if (!menu) {
        console.error('Элемент context-menu не найден!');
        return;
    }
    
    menu.style.display = 'none';
    
    // Очищаем содержимое меню
    menu.innerHTML = '';
    
    // Создаем группы меню
    Object.entries(contextMenuTemplate).forEach(([group, items]) => {
        const groupElement = document.createElement('div');
        groupElement.className = `context-menu-group ${group}`;
        
        Object.entries(items).forEach(([id, item]) => {
            const itemElement = createMenuItem(id, item);
            groupElement.appendChild(itemElement);
        });
        
        menu.appendChild(groupElement);
    });
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

function handleCommand(action) {
    console.log('Обработка команды:', action);
    
    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) {
        console.error('Элемент context-menu не найден!');
        return;
    }
    
    // Проверяем, что контекстное меню видимо
    console.log('Текущее состояние контекстного меню:', contextMenu.style.display);
    
    // Проверяем наличие группы в шаблоне
    const groupExists = Object.keys(contextMenuTemplate).includes(action);
    console.log(`Группа ${action} ${groupExists ? 'найдена' : 'не найдена'} в шаблоне`);
    
    // Если группа не найдена, используем buildings по умолчанию
    const group = groupExists ? action : 'buildings';
    
    // Выводим содержимое группы
    console.log(`Содержимое группы ${group}:`, contextMenuTemplate[group]);
    
    switch (action) {
        case 'buildings':
            console.log('Показываем меню зданий');
            showContextMenu(contextMenu, 'buildings');
            break;
        case 'defenses':
            console.log('Показываем меню обороны');
            showContextMenu(contextMenu, 'defenses');
            break;
        case 'infantry':
            console.log('Показываем меню пехоты');
            showContextMenu(contextMenu, 'infantry');
            break;
        case 'vehicles':
            console.log('Показываем меню техники');
            showContextMenu(contextMenu, 'vehicles');
            break;
        case 'aircraft':
            console.log('Показываем меню авиации');
            showContextMenu(contextMenu, 'aircraft');
            break;
        default:
            console.log('Неизвестная команда:', action);
    }
}

function showContextMenu(menu, group) {
    console.log(`Показываем контекстное меню для группы: ${group}`);
    
    const button = document.querySelector(`[data-action="${group}"]`);
    if (!button) {
        console.error(`Кнопка с действием ${group} не найдена!`);
        return;
    }
    
    const rect = button.getBoundingClientRect();
    console.log('Позиция кнопки:', rect);
    
    // Проверяем, есть ли группа в шаблоне
    const groupExists = Object.keys(contextMenuTemplate).includes(group);
    if (!groupExists) {
        console.error(`Группа ${group} не найдена в шаблоне меню!`);
        return;
    }
    
    // Очищаем меню перед заполнением
    menu.innerHTML = '';
    
    // Создаем группу меню
    const groupElement = document.createElement('div');
    groupElement.className = `context-menu-group ${group}`;
    
    // Заполняем группу элементами
    Object.entries(contextMenuTemplate[group] || {}).forEach(([id, item]) => {
        const itemElement = createMenuItem(id, item);
        groupElement.appendChild(itemElement);
    });
    
    menu.appendChild(groupElement);
    
    // Устанавливаем позицию меню
    menu.style.display = 'block';
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 5}px`; // Размещаем под кнопкой
    
    console.log('Меню отображено:', menu.style.display, menu.style.left, menu.style.top);
    
    // Закрываем меню при клике вне его
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && !button.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
            console.log('Меню закрыто');
        }
    };
    
    // Удаляем предыдущий обработчик, если он был
    document.removeEventListener('click', closeMenu);
    
    // Добавляем обработчик с небольшой задержкой, чтобы избежать немедленного закрытия
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

function handleMenuItemClick(id) {
    const item = contextMenuTemplate.buildings[id] || contextMenuTemplate.units[id];
    if (!item) {
        console.error(`Неизвестный ID: ${id}`);
        return;
    }
    
    if (GameState.hasEnoughResources(item.cost)) {
        GameState.deductResources(item.cost);
        console.log(`Создаю: ${item.name}`);
        // Здесь будет создание выбранного юнита или здания
    } else {
        console.log('Недостаточно ресурсов');
    }
} 