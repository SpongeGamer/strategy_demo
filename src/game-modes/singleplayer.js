import { GameState } from '../engine/state.js';
import { game } from '../engine/game.js';
import { Maps, TILE_SIZE } from '../engine/maps.js';

class Singleplayer {
    constructor() {
        this.gameMap = null;
        this.mapSize = 'medium';
        this.difficulty = 'normal';
        this.gameLoop = this.gameLoop.bind(this);
        this.lastFrameTime = 0;
        this.isRunning = false;
        this.selectedUnit = null;
        this.resources = []; // Инициализируем массив ресурсов
        this.units = [];
        this.buildings = [];
        this.enemies = [];
        this.playerBase = null;
        this.enemyBase = null;
        this.selectedEntity = null;
    }

    start() {
        console.log('Запуск одиночной игры...');
        
        try {
            // Сбрасываем состояние игры
            GameState.reset();
            
            // Скрываем стартовый экран
            const startScreen = document.getElementById('startscreen');
            if (startScreen) {
                startScreen.style.display = 'none';
            } else {
                console.error('Элемент startscreen не найден!');
            }
            
            // Показываем игровой интерфейс
            const gameInterface = document.getElementById('gameinterfacescreen');
            if (gameInterface) {
                gameInterface.style.display = 'block';
                
                // Очищаем игровой интерфейс
                gameInterface.innerHTML = '';
                
                // Создаем контейнер для контекстного меню
                const contextMenu = document.createElement('div');
                contextMenu.id = 'context-menu';
                gameInterface.appendChild(contextMenu);
                
                // Создаем панель ресурсов
                this.createResourcePanel();
                
                // Создаем мини-карту
                this.createMinimap();
            } else {
                console.error('Элемент gameinterfacescreen не найден!');
                return;
            }
            
            // Инициализируем карту
            this.initializeMap();
            
            // Размещаем базы
            this.placePlayerBase();
            this.placeEnemyBase();
            
            // Запускаем игровой цикл
            this.isRunning = true;
            this.gameLoop();
            
            console.log('Одиночная игра запущена');
        } catch (error) {
            console.error('Ошибка при запуске одиночной игры:', error);
        }
    }

    initializeMap() {
        console.log('Инициализация карты...');
        
        try {
            // Создаем карту в зависимости от выбранного размера
            let mapSize;
            switch (this.mapSize) {
                case 'small':
                    mapSize = { width: 50, height: 40 };
                    break;
                case 'large':
                    mapSize = { width: 100, height: 80 };
                    break;
                case 'medium':
                default:
                    mapSize = { width: 80, height: 60 };
                    break;
            }
            
            console.log(`Размер карты: ${mapSize.width}x${mapSize.height}`);
            
            // Создаем карту
            this.gameMap = Maps.createMap(mapSize.width, mapSize.height);
            
            // Отображаем карту
            Maps.renderMap(this.gameMap);
            
            // Обновляем миникарту
            this.renderMinimap();
            
            // Добавляем ресурсы на карту
            this.placeResources();
            
            // Инициализируем управление камерой
            this.initCameraControls();
            
            console.log('Карта инициализирована и отображена');
        } catch (error) {
            console.error('Ошибка при инициализации карты:', error);
        }
    }

    placeResources() {
        console.log('Размещение ресурсов на карте...');
        
        try {
            // Количество ресурсов в зависимости от размера карты
            let resourceCount;
            switch (this.mapSize) {
                case 'small':
                    resourceCount = { metal: 15, gold: 8 };
                    break;
                case 'large':
                    resourceCount = { metal: 40, gold: 20 };
                    break;
                case 'medium':
                default:
                    resourceCount = { metal: 25, gold: 12 };
                    break;
            }
            
            // Размещаем металл группами
            this.placeResourceGroups('metal', resourceCount.metal);
            
            // Размещаем золото группами
            this.placeResourceGroups('gold', resourceCount.gold);
            
            console.log('Ресурсы размещены');
        } catch (error) {
            console.error('Ошибка при размещении ресурсов:', error);
        }
    }
    
    placeResourceGroups(type, totalCount) {
        // Определяем количество групп ресурсов
        const groupCount = Math.max(3, Math.floor(totalCount / 3));
        const resourcesPerGroup = Math.ceil(totalCount / groupCount);
        
        for (let i = 0; i < groupCount; i++) {
            // Находим подходящее место для группы ресурсов
            let centerX, centerY;
            let attempts = 0;
            const maxAttempts = 50;
            
            do {
                centerX = Math.floor(Math.random() * this.gameMap.width);
                centerY = Math.floor(Math.random() * this.gameMap.height);
                
                // Проверяем, что место подходит для размещения группы ресурсов
                const tile = this.gameMap.tiles[centerY][centerX];
                if (tile.type === 'grass' && !tile.resource && !tile.occupied) {
                    break;
                }
                
                attempts++;
            } while (attempts < maxAttempts);
            
            if (attempts >= maxAttempts) {
                console.warn('Не удалось найти место для группы ресурсов');
                continue;
            }
            
            // Размещаем группу ресурсов вокруг центральной точки
            const groupSize = Math.floor(Math.random() * 2) + 2; // Размер группы от 2 до 3
            let placedInGroup = 0;
            
            for (let j = 0; j < resourcesPerGroup && placedInGroup < resourcesPerGroup; j++) {
                // Выбираем случайное смещение от центра
                const offsetX = Math.floor(Math.random() * (groupSize * 2 + 1)) - groupSize;
                const offsetY = Math.floor(Math.random() * (groupSize * 2 + 1)) - groupSize;
                
                const x = centerX + offsetX;
                const y = centerY + offsetY;
                
                // Проверяем, что координаты в пределах карты
                if (x >= 0 && x < this.gameMap.width && y >= 0 && y < this.gameMap.height) {
                    // Проверяем, что место свободно
                    const tile = this.gameMap.tiles[y][x];
                    if (tile.type === 'grass' && !tile.resource && !tile.occupied) {
                        this.placeResourceNode(type, x, y);
                        placedInGroup++;
                    }
                }
            }
        }
    }

    placeResourceNode(type, x, y) {
        // Если координаты не переданы, находим свободное место для ресурса
        if (x === undefined || y === undefined) {
            let attempts = 0;
            const maxAttempts = 50;
            
            do {
                x = Math.floor(Math.random() * this.gameMap.width);
                y = Math.floor(Math.random() * this.gameMap.height);
                
                // Проверяем, что место свободно (не вода, не гора, не лес)
                const tile = this.gameMap.tiles[y][x];
                if (tile.type === 'grass' && !tile.resource && !tile.occupied) {
                    break;
                }
                
                attempts++;
            } while (attempts < maxAttempts);
            
            if (attempts >= maxAttempts) {
                console.warn('Не удалось найти место для ресурса');
                return;
            }
        }
        
        // Отмечаем тайл как содержащий ресурс
        this.gameMap.tiles[y][x].resource = type;
        
        // Создаем элемент ресурса
        const resourceElement = document.createElement('div');
        resourceElement.className = `resource resource-${type}`;
        resourceElement.style.left = `${x * TILE_SIZE}px`;
        resourceElement.style.top = `${y * TILE_SIZE}px`;
        
        // Используем простые цветные квадраты вместо эмодзи
        resourceElement.style.backgroundColor = type === 'metal' ? '#aaaaaa' : '#ffcc00';
        resourceElement.style.border = '1px solid #000';
        
        // Добавляем ресурс в контейнер карты
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.appendChild(resourceElement);
        } else {
            // Если контейнер карты не найден, создаем его
            const newMapContainer = document.createElement('div');
            newMapContainer.id = 'map-container';
            newMapContainer.style.position = 'absolute';
            newMapContainer.style.top = '0';
            newMapContainer.style.left = '0';
            newMapContainer.style.width = '100%';
            newMapContainer.style.height = '100%';
            newMapContainer.style.overflow = 'hidden';
            
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(newMapContainer);
            mapContainer.appendChild(resourceElement);
        }
        
        // Добавляем ресурс в список ресурсов
        const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        resourceElement.id = resourceId;
        
        this.resources.push({
            id: resourceId,
            type: type,
            x: x,
            y: y,
            amount: type === 'metal' ? 1000 : 500, // Металла больше, чем золота
            element: resourceElement
        });
    }

    placePlayerBase() {
        console.log('Размещение базы игрока...');
        
        try {
            if (!this.gameMap) {
                console.log('Карта не инициализирована');
                return;
            }
            
            // Получаем фиксированные позиции баз
            const basePositions = this.gameMap.getBasePositions();
            const baseX = basePositions.player.x;
            const baseY = basePositions.player.y;
            
            // Создаем базу
            this.playerBase = {
                x: baseX,
                y: baseY,
                type: 'player',
                health: 100,
                maxHealth: 100,
                energy: 50,
                maxEnergy: 100,
                buildings: [],
                units: []
            };
            
            // Отмечаем область вокруг базы как занятую
            for (let y = baseY - 2; y <= baseY + 2; y++) {
                for (let x = baseX - 2; x <= baseX + 2; x++) {
                    if (x >= 0 && x < this.gameMap.width && y >= 0 && y < this.gameMap.height) {
                        // Отмечаем клетку как занятую базой
                        this.gameMap.tiles[y][x].occupied = true;
                    }
                }
            }
            
            // Создаем визуальное представление базы
            const baseElement = document.createElement('div');
            baseElement.className = 'base player-base';
            baseElement.style.position = 'absolute';
            baseElement.style.left = `${baseX * this.gameMap.tileSize - this.gameMap.tileSize}px`;
            baseElement.style.top = `${baseY * this.gameMap.tileSize - this.gameMap.tileSize}px`;
            baseElement.style.width = `${this.gameMap.tileSize * 3}px`;
            baseElement.style.height = `${this.gameMap.tileSize * 3}px`;
            baseElement.style.backgroundColor = '#00aa00';
            baseElement.style.border = '2px solid #00ff00';
            baseElement.style.borderRadius = '5px';
            baseElement.style.zIndex = '10';
            baseElement.style.boxSizing = 'border-box';
            
            // Добавляем базу на карту
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                mapContainer.appendChild(baseElement);
            } else {
                console.error('Контейнер карты не найден!');
            }
            
            console.log(`База игрока размещена на координатах: ${baseX}, ${baseY}`);
        } catch (error) {
            console.error('Ошибка при размещении базы игрока:', error);
        }
    }

    placeEnemyBase() {
        console.log('Размещение вражеской базы...');
        
        try {
            if (!this.gameMap) {
                console.log('Карта не инициализирована');
                return;
            }
            
            // Получаем фиксированные позиции баз
            const basePositions = this.gameMap.getBasePositions();
            const baseX = basePositions.enemy.x;
            const baseY = basePositions.enemy.y;
            
            // Создаем базу
            this.enemyBase = {
                x: baseX,
                y: baseY,
                type: 'enemy',
                health: 100,
                maxHealth: 100,
                energy: 50,
                maxEnergy: 100,
                buildings: [],
                units: []
            };
            
            // Отмечаем область вокруг базы как занятую
            for (let y = baseY - 2; y <= baseY + 2; y++) {
                for (let x = baseX - 2; x <= baseX + 2; x++) {
                    if (x >= 0 && x < this.gameMap.width && y >= 0 && y < this.gameMap.height) {
                        // Отмечаем клетку как занятую базой
                        this.gameMap.tiles[y][x].occupied = true;
                    }
                }
            }
            
            // Создаем визуальное представление базы
            const baseElement = document.createElement('div');
            baseElement.className = 'base enemy-base';
            baseElement.style.position = 'absolute';
            baseElement.style.left = `${baseX * this.gameMap.tileSize - this.gameMap.tileSize}px`;
            baseElement.style.top = `${baseY * this.gameMap.tileSize - this.gameMap.tileSize}px`;
            baseElement.style.width = `${this.gameMap.tileSize * 3}px`;
            baseElement.style.height = `${this.gameMap.tileSize * 3}px`;
            baseElement.style.backgroundColor = '#aa0000';
            baseElement.style.border = '2px solid #ff0000';
            baseElement.style.borderRadius = '5px';
            baseElement.style.zIndex = '10';
            baseElement.style.boxSizing = 'border-box';
            
            // Добавляем базу на карту
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                mapContainer.appendChild(baseElement);
            } else {
                console.error('Контейнер карты не найден!');
            }
            
            console.log(`Вражеская база размещена на координатах: ${baseX}, ${baseY}`);
        } catch (error) {
            console.error('Ошибка при размещении вражеской базы:', error);
        }
    }

    selectUnit(unit) {
        // Выбираем юнит
        this.selectedEntity = unit;
        this.updateSelectedInfo(unit);
        
        // Добавляем обработчик ПКМ для отправки юнита
        document.addEventListener('contextmenu', this.handleUnitRightClick);
    }
    
    // Обработчик ПКМ для отправки юнита
    handleUnitRightClick = (e) => {
        e.preventDefault(); // Предотвращаем стандартное контекстное меню
        
        // Проверяем, что у нас есть выбранный юнит
        if (!this.selectedEntity || this.selectedEntity.type !== 'unit') {
            return;
        }
        
        // Получаем координаты клика относительно карты
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) return;
        
        const rect = mapContainer.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.gameMap.tileSize);
        const y = Math.floor((e.clientY - rect.top) / this.gameMap.tileSize);
        
        // Проверяем, что координаты в пределах карты
        if (x < 0 || x >= this.gameMap.width || y < 0 || y >= this.gameMap.height) {
            return;
        }
        
        // Проверяем, на что кликнули
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        
        // Если кликнули на ресурс
        if (targetElement && targetElement.classList.contains('resource')) {
            // Отправляем юнит добывать ресурс
            this.sendUnitToHarvestResource(this.selectedEntity, targetElement.dataset.resourceId);
            this.showFloatingMessage('Добываю ресурс', e.clientX, e.clientY);
        }
        // Если кликнули на врага
        else if (targetElement && targetElement.classList.contains('enemy-unit')) {
            // Отправляем юнит атаковать врага
            this.sendUnitToAttackEnemy(this.selectedEntity, targetElement.dataset.unitId);
            this.showFloatingMessage('Атакую врага', e.clientX, e.clientY);
        }
        // В остальных случаях просто перемещаем юнит
        else {
            // Отправляем юнит в указанную точку
            this.sendUnitToLocation(this.selectedEntity, x, y);
            this.showFloatingMessage('Перемещаюсь', e.clientX, e.clientY);
        }
    }
    
    // Отправляет юнит в указанную локацию
    sendUnitToLocation(unit, x, y) {
        console.log(`Отправляем юнит ${unit.id} в точку ${x}, ${y}`);
        
        // Здесь будет логика перемещения юнита
        // Пока просто обновляем его позицию для демонстрации
        unit.targetX = x;
        unit.targetY = y;
        unit.isMoving = true;
        unit.path = []; // Здесь будет путь юнита
        
        // В будущем здесь будет поиск пути и анимация движения
    }
    
    // Отправляет юнит добывать ресурс
    sendUnitToHarvestResource(unit, resourceId) {
        console.log(`Отправляем юнит ${unit.id} добывать ресурс ${resourceId}`);
        
        // Находим ресурс по ID
        const resource = this.resources.find(r => r.id === resourceId);
        if (!resource) return;
        
        // Отправляем юнит к ресурсу
        unit.targetX = resource.x;
        unit.targetY = resource.y;
        unit.isMoving = true;
        unit.isHarvesting = true;
        unit.harvestingResourceId = resourceId;
        
        // В будущем здесь будет логика добычи ресурса и возврата на базу
    }
    
    // Отправляет юнит атаковать врага
    sendUnitToAttackEnemy(unit, enemyId) {
        console.log(`Отправляем юнит ${unit.id} атаковать врага ${enemyId}`);
        
        // Находим врага по ID
        const enemy = this.enemyUnits.find(e => e.id === enemyId);
        if (!enemy) return;
        
        // Отправляем юнит к врагу
        unit.targetX = enemy.x;
        unit.targetY = enemy.y;
        unit.isMoving = true;
        unit.isAttacking = true;
        unit.attackingEnemyId = enemyId;
        
        // В будущем здесь будет логика атаки
    }
    
    // Удаляем обработчик ПКМ при отмене выбора юнита
    unselectUnit() {
        this.selectedEntity = null;
        this.updateSelectedInfo(null);
        
        // Удаляем обработчик ПКМ
        document.removeEventListener('contextmenu', this.handleUnitRightClick);
    }
    
    updateSelectedInfo(entity) {
        // Получаем элемент информации о выбранном объекте
        let infoElement = document.getElementById('selected-info');
        
        // Если элемента нет, создаем его
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'selected-info';
            document.getElementById('gameinterfacescreen').appendChild(infoElement);
        }
        
        // Заполняем информацию в зависимости от типа объекта
        if (entity.owner === 'player' || entity.owner === 'enemy') {
            // База
            infoElement.innerHTML = `
                <div class="title">${entity.owner === 'player' ? 'Player Base' : 'Enemy Base'}</div>
                <div class="stats">
                    <div>Health: ${entity.health}/${entity.maxHealth}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                </div>
            `;
        } else if (entity.type === 'harvester') {
            // Сборщик ресурсов
            infoElement.innerHTML = `
                <div class="title">Harvester Bot</div>
                <div class="stats">
                    <div>Health: ${entity.health}/${entity.maxHealth}</div>
                    <div>Resources: ${entity.resources}/${entity.maxResources}</div>
                    <div>State: ${entity.state}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(entity.health / entity.maxHealth) * 100}%"></div>
                </div>
            `;
        }
        
        // Показываем информацию
        infoElement.classList.add('visible');
    }

    showFloatingMessage(message, x, y) {
        const messageElement = document.createElement('div');
        messageElement.className = 'floating-message';
        messageElement.textContent = message;
        messageElement.style.left = `${x}px`;
        messageElement.style.top = `${y}px`;
        
        document.getElementById('gameinterfacescreen').appendChild(messageElement);
        
        // Удаляем сообщение через 2 секунды
        setTimeout(() => {
            messageElement.remove();
        }, 2000);
    }

    gameLoop() {
        try {
            if (!this.isRunning) return;
            
            // Обновляем состояние игры
            this.update();
            
            // Отрисовываем игру
            this.render();
            
            // Запускаем следующий кадр
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Ошибка в игровом цикле:', error);
        }
    }
    
    update() {
        // Обновление игровой логики
    }
    
    render() {
        // Очищаем канвас
        if (game.backgroundContext) {
            game.backgroundContext.clearRect(0, 0, game.canvasWidth, game.canvasHeight);
        }
        
        if (game.foregroundContext) {
            game.foregroundContext.clearRect(0, 0, game.canvasWidth, game.canvasHeight);
        }
        
        // Отрисовываем интерфейс
        this.renderInterface();
    }
    
    renderInterface() {
        // Обновляем миникарту
        this.renderMinimap();
    }

    stop() {
        console.log('Остановка одиночной игры...');
        this.isRunning = false;
        
        try {
            // Очищаем интервал обновления камеры
            if (this.cameraInterval) {
                clearInterval(this.cameraInterval);
                this.cameraInterval = null;
            }
            
            // Показываем стартовый экран
            const startScreen = document.getElementById('startscreen');
            if (startScreen) {
                startScreen.style.display = 'block';
            }
            
            // Скрываем игровой интерфейс
            const gameInterface = document.getElementById('gameinterfacescreen');
            if (gameInterface) {
                gameInterface.style.display = 'none';
            }
            
            console.log('Одиночная игра остановлена');
        } catch (error) {
            console.error('Ошибка при остановке одиночной игры:', error);
        }
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        console.log(`Установлен уровень сложности: ${difficulty}`);
    }

    setMapSize(size) {
        this.mapSize = size;
        console.log(`Установлен размер карты: ${size}`);
    }

    createResourcePanel() {
        console.log('Создание панели ресурсов...');
        
        try {
            // Создаем панель ресурсов
            const resourcePanel = document.createElement('div');
            resourcePanel.className = 'resource-panel';
            
            // Добавляем элементы для каждого типа ресурсов
            const resources = ['metal', 'gold', 'energy'];
            const emojis = {
                'metal': '🔧',
                'gold': '💰',
                'energy': '⚡'
            };
            
            resources.forEach(resource => {
                const resourceItem = document.createElement('div');
                resourceItem.className = 'resource-item';
                
                const resourceIcon = document.createElement('div');
                resourceIcon.className = 'resource-icon';
                resourceIcon.textContent = emojis[resource];
                
                const resourceAmount = document.createElement('div');
                resourceAmount.className = 'resource-amount';
                resourceAmount.id = `${resource}-amount`;
                resourceAmount.textContent = GameState.resources[resource] || 0;
                
                resourceItem.appendChild(resourceIcon);
                resourceItem.appendChild(resourceAmount);
                resourcePanel.appendChild(resourceItem);
            });
            
            // Добавляем панель ресурсов на игровой экран
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(resourcePanel);
            
            console.log('Панель ресурсов создана');
        } catch (error) {
            console.error('Ошибка при создании панели ресурсов:', error);
        }
    }

    createMinimap() {
        console.log('Создание мини-карты...');
        
        try {
            // Создаем контейнер для мини-карты
            const minimapContainer = document.createElement('div');
            minimapContainer.id = 'minimap';
            
            // Создаем канвас для мини-карты
            const minimapCanvas = document.createElement('canvas');
            minimapCanvas.id = 'minimapcanvas';
            minimapCanvas.width = 200;
            minimapCanvas.height = 200;
            
            // Добавляем канвас в контейнер
            minimapContainer.appendChild(minimapCanvas);
            
            // Добавляем мини-карту на игровой экран
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(minimapContainer);
            
            // Добавляем обработчик клика по мини-карте
            minimapCanvas.addEventListener('click', (e) => {
                this.handleMinimapClick(e);
            });
            
            // Отрисовываем мини-карту
            this.renderMinimap();
            
            console.log('Мини-карта создана');
        } catch (error) {
            console.error('Ошибка при создании мини-карты:', error);
        }
    }
    
    renderMinimap() {
        if (!this.gameMap) return;
        
        const minimapCanvas = document.getElementById('minimapcanvas');
        if (!minimapCanvas) return;
        
        const ctx = minimapCanvas.getContext('2d');
        const tileSize = Math.min(
            minimapCanvas.width / this.gameMap.width,
            minimapCanvas.height / this.gameMap.height
        );
        
        // Очищаем миникарту
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // Вычисляем смещение для центрирования карты на миникарте
        const offsetX = (minimapCanvas.width - this.gameMap.width * tileSize) / 2;
        const offsetY = (minimapCanvas.height - this.gameMap.height * tileSize) / 2;
        
        // Отрисовываем тайлы на миникарте
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.tiles[y][x];
                
                // Выбираем цвет в зависимости от типа тайла
                switch (tile.type) {
                    case 'grass':
                        ctx.fillStyle = '#3a7a3a';
                        break;
                    case 'water':
                        ctx.fillStyle = '#3a6ac5';
                        break;
                    case 'mountain':
                        ctx.fillStyle = '#5a5a5a';
                        break;
                    case 'forest':
                        ctx.fillStyle = '#1d5735';
                        break;
                    default:
                        ctx.fillStyle = '#3a7a3a';
                }
                
                // Рисуем тайл
                ctx.fillRect(
                    offsetX + x * tileSize, 
                    offsetY + y * tileSize, 
                    tileSize, 
                    tileSize
                );
                
                // Отображаем ресурсы на миникарте
                if (tile.resource) {
                    if (tile.resource.type === 'metal') {
                        ctx.fillStyle = '#aaaaaa'; // Серый для металла
                    } else if (tile.resource.type === 'gold') {
                        ctx.fillStyle = '#ffcc00'; // Золотой для золота
                    }
                    
                    // Рисуем ресурс как маленький квадрат
                    const resourceSize = Math.max(tileSize * 0.7, 1);
                    const offset = (tileSize - resourceSize) / 2;
                    ctx.fillRect(
                        offsetX + x * tileSize + offset,
                        offsetY + y * tileSize + offset,
                        resourceSize,
                        resourceSize
                    );
                }
            }
        }
        
        // Отмечаем базы на миникарте
        if (this.playerBase) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                offsetX + this.playerBase.x * tileSize - tileSize, 
                offsetY + this.playerBase.y * tileSize - tileSize, 
                tileSize * 3, 
                tileSize * 3
            );
        }
        
        if (this.enemyBase) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(
                offsetX + this.enemyBase.x * tileSize - tileSize, 
                offsetY + this.enemyBase.y * tileSize - tileSize, 
                tileSize * 3, 
                tileSize * 3
            );
        }
        
        // Отмечаем позицию камеры на миникарте
        if (game.camera) {
            const viewportWidth = game.canvasWidth / this.gameMap.tileSize;
            const viewportHeight = game.canvasHeight / this.gameMap.tileSize;
            const cameraX = game.camera.x / this.gameMap.tileSize;
            const cameraY = game.camera.y / this.gameMap.tileSize;
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                offsetX + cameraX * tileSize, 
                offsetY + cameraY * tileSize, 
                viewportWidth * tileSize, 
                viewportHeight * tileSize
            );
        }
    }

    handleMinimapClick(e) {
        console.log('Клик по мини-карте');
        
        try {
            if (!this.gameMap) {
                console.log('Карта не инициализирована');
                return;
            }
            
            // Получаем координаты клика относительно мини-карты
            const minimap = document.getElementById('minimapcanvas');
            const rect = minimap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Вычисляем размер тайла на миникарте
            const tileSize = Math.min(
                minimap.width / this.gameMap.width,
                minimap.height / this.gameMap.height
            );
            
            // Вычисляем смещение для центрирования карты на миникарте
            const offsetX = (minimap.width - this.gameMap.width * tileSize) / 2;
            const offsetY = (minimap.height - this.gameMap.height * tileSize) / 2;
            
            // Преобразуем координаты мини-карты в координаты игровой карты
            const mapX = Math.floor((x - offsetX) / tileSize);
            const mapY = Math.floor((y - offsetY) / tileSize);
            
            // Проверяем, что координаты в пределах карты
            if (mapX >= 0 && mapX < this.gameMap.width && mapY >= 0 && mapY < this.gameMap.height) {
                // Центрируем камеру на выбранной точке
                this.centerCameraOn(mapX, mapY);
                
                console.log(`Клик по мини-карте: ${x}, ${y} -> Карта: ${mapX}, ${mapY}`);
            } else {
                console.log(`Клик за пределами карты на миникарте: ${x}, ${y}`);
            }
        } catch (error) {
            console.error('Ошибка при обработке клика по мини-карте:', error);
        }
    }

    centerCameraOn(x, y) {
        console.log(`Центрирование камеры на координатах: ${x}, ${y}`);
        
        try {
            if (!this.gameMap) {
                console.log('Карта не инициализирована');
                return;
            }
            
            // Проверяем, что координаты в пределах карты
            if (x < 0 || x >= this.gameMap.width || y < 0 || y >= this.gameMap.height) {
                console.log('Координаты за пределами карты');
                return;
            }
            
            // Преобразуем координаты тайлов в пиксели
            const pixelX = x * this.gameMap.tileSize;
            const pixelY = y * this.gameMap.tileSize;
            
            // Если есть объект камеры, центрируем её
            if (game.camera) {
                game.camera.x = pixelX - game.canvasWidth / 2;
                game.camera.y = pixelY - game.canvasHeight / 2;
                
                // Ограничиваем камеру границами карты
                game.camera.x = Math.max(0, Math.min(game.camera.x, this.gameMap.width * this.gameMap.tileSize - game.canvasWidth));
                game.camera.y = Math.max(0, Math.min(game.camera.y, this.gameMap.height * this.gameMap.tileSize - game.canvasHeight));
                
                console.log(`Камера центрирована: ${game.camera.x}, ${game.camera.y}`);
            } else {
                console.log('Объект камеры не инициализирован');
            }
        } catch (error) {
            console.error('Ошибка при центрировании камеры:', error);
        }
    }

    initCameraControls() {
        console.log('Инициализация управления камерой...');
        
        // Создаем объект камеры, если его нет
        if (!game.camera) {
            game.camera = {
                x: 0,
                y: 0
            };
        }
        
        // Скорость перемещения камеры
        const cameraSpeed = 10;
        
        // Состояние клавиш
        const keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            ArrowUp: false,
            ArrowLeft: false,
            ArrowDown: false,
            ArrowRight: false
        };
        
        // Обработчик нажатия клавиш
        const handleKeyDown = (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = true;
            }
        };
        
        // Обработчик отпускания клавиш
        const handleKeyUp = (e) => {
            if (keys.hasOwnProperty(e.key)) {
                keys[e.key] = false;
            }
        };
        
        // Добавляем обработчики событий
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Функция обновления камеры
        const updateCamera = () => {
            if (!game.camera || !this.gameMap) return;
            
            // Перемещение камеры
            if (keys.w || keys.ArrowUp) {
                game.camera.y = Math.max(0, game.camera.y - cameraSpeed);
            }
            if (keys.s || keys.ArrowDown) {
                game.camera.y = Math.min(this.gameMap.height * this.gameMap.tileSize - game.canvasHeight, game.camera.y + cameraSpeed);
            }
            if (keys.a || keys.ArrowLeft) {
                game.camera.x = Math.max(0, game.camera.x - cameraSpeed);
            }
            if (keys.d || keys.ArrowRight) {
                game.camera.x = Math.min(this.gameMap.width * this.gameMap.tileSize - game.canvasWidth, game.camera.x + cameraSpeed);
            }
            
            // Обновляем положение карты
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                mapContainer.style.transform = `translate(${-game.camera.x}px, ${-game.camera.y}px)`;
            }
            
            // Обновляем миникарту
            this.renderMinimap();
        };
        
        // Запускаем обновление камеры
        this.cameraInterval = setInterval(updateCamera, 16); // ~60 FPS
        
        console.log('Управление камерой инициализировано');
    }
}

export const singleplayer = new Singleplayer();