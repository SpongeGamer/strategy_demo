import { GameState } from '../engine/state.js';
import { game } from '../engine/game.js';
import { Maps, TILE_SIZE } from '../engine/maps.js';

class Singleplayer {
    constructor() {
        this.isRunning = false;
        this.difficulty = 'normal';
        this.mapSize = 'medium';
        this.playerBase = null;
        this.enemyBase = null;
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
                
                // Создаем панель команд
                this.createCommandPanel();
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
                    mapSize = { width: 30, height: 20 };
                    break;
                case 'large':
                    mapSize = { width: 60, height: 40 };
                    break;
                case 'medium':
                default:
                    mapSize = { width: 40, height: 30 };
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
                    resourceCount = { metal: 4, gold: 2 };
                    break;
                case 'large':
                    resourceCount = { metal: 12, gold: 6 };
                    break;
                case 'medium':
                default:
                    resourceCount = { metal: 8, gold: 4 };
                    break;
            }
            
            // Размещаем металл
            for (let i = 0; i < resourceCount.metal; i++) {
                this.placeResourceNode('metal');
            }
            
            // Размещаем золото
            for (let i = 0; i < resourceCount.gold; i++) {
                this.placeResourceNode('gold');
            }
            
            console.log('Ресурсы размещены');
        } catch (error) {
            console.error('Ошибка при размещении ресурсов:', error);
        }
    }

    placeResourceNode(type) {
        // Находим свободное место для ресурса
        let x, y;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            x = Math.floor(Math.random() * this.gameMap.width);
            y = Math.floor(Math.random() * this.gameMap.height);
            
            // Проверяем, что место свободно (не вода, не гора, не лес)
            const tile = this.gameMap.tiles[y][x];
            if (tile.type !== 'water' && tile.type !== 'mountain' && tile.type !== 'forest' && !tile.resource) {
                break;
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            console.warn('Не удалось найти место для ресурса');
            return;
        }
        
        // Создаем элемент ресурса
        const resourceElement = document.createElement('div');
        resourceElement.className = `resource resource-${type}`;
        resourceElement.style.left = `${x * TILE_SIZE}px`;
        resourceElement.style.top = `${y * TILE_SIZE}px`;
        
        // Добавляем ресурс на игровой экран
        const gameInterface = document.getElementById('gameinterfacescreen');
        gameInterface.appendChild(resourceElement);
        
        // Сохраняем информацию о ресурсе
        const resource = {
            element: resourceElement,
            x: x,
            y: y,
            type: type,
            amount: type === 'metal' ? 500 : 300
        };
        
        // Добавляем ресурс в список сущностей
        if (!GameState.entities) GameState.entities = [];
        GameState.entities.push(resource);
        
        // Отмечаем тайл как занятый ресурсом
        this.gameMap.tiles[y][x].resource = resource;
    }

    placePlayerBase() {
        console.log('Размещение базы игрока...');
        
        try {
            if (!this.gameMap) {
                console.log('Карта не инициализирована');
                return;
            }
            
            // Находим подходящее место для базы игрока (в левом нижнем углу карты)
            const baseX = Math.floor(this.gameMap.width * 0.2);
            const baseY = Math.floor(this.gameMap.height * 0.8);
            
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
            
            // Находим подходящее место для вражеской базы (в правом верхнем углу карты)
            const baseX = Math.floor(this.gameMap.width * 0.8);
            const baseY = Math.floor(this.gameMap.height * 0.2);
            
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
            
            console.log(`Вражеская база размещена на координатах: ${baseX}, ${baseY}`);
        } catch (error) {
            console.error('Ошибка при размещении вражеской базы:', error);
        }
    }

    selectBase(base) {
        console.log(`Выбрана база ${base.owner}`);
        GameState.selectedEntity = base;
        
        // Обновляем информацию о выбранном объекте
        this.updateSelectedInfo(base);
    }

    showBaseMenu(e, base) {
        if (base.owner !== 'player') return;
        
        console.log('Показываем меню базы');
        
        // Получаем контекстное меню
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) {
            console.error('Элемент context-menu не найден!');
            return;
        }
        
        // Очищаем меню
        contextMenu.innerHTML = '';
        
        // Создаем пункт меню для создания сборщика ресурсов
        const harvesterItem = document.createElement('div');
        harvesterItem.className = 'context-menu-item';
        harvesterItem.innerHTML = `
            <div class="icon">🤖</div>
            <div class="info">
                <div class="name">Harvester Bot</div>
                <div class="description">Собирает ресурсы</div>
            </div>
            <div class="cost">M:30 G:10</div>
        `;
        
        // Добавляем обработчик клика
        harvesterItem.addEventListener('click', () => {
            this.createHarvester(base);
            contextMenu.style.display = 'none';
        });
        
        // Добавляем пункт в меню
        contextMenu.appendChild(harvesterItem);
        
        // Отображаем меню
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        
        // Закрываем меню при клике вне его
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Добавляем обработчик с небольшой задержкой
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    createHarvester(base) {
        const cost = { metal: 30, gold: 10 };
        
        if (GameState.hasEnoughResources(cost)) {
            GameState.deductResources(cost);
            
            // Создаем элемент сборщика
            const harvesterElement = document.createElement('div');
            harvesterElement.className = 'unit unit-harvester';
            harvesterElement.id = `harvester-${Date.now()}`;
            
            // Размещаем сборщика рядом с базой
            const x = base.x * TILE_SIZE + 64;
            const y = base.y * TILE_SIZE;
            
            harvesterElement.style.left = `${x}px`;
            harvesterElement.style.top = `${y}px`;
            
            // Добавляем сборщика на игровой экран
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(harvesterElement);
            
            // Создаем объект сборщика
            const harvester = {
                element: harvesterElement,
                x: x / TILE_SIZE,
                y: y / TILE_SIZE,
                health: 100,
                maxHealth: 100,
                speed: 0.05,
                type: 'harvester',
                owner: 'player',
                state: 'idle',
                target: null,
                resources: 0,
                maxResources: 20
            };
            
            // Добавляем обработчик клика
            harvesterElement.addEventListener('click', (e) => {
                this.selectUnit(harvester);
                e.stopPropagation();
            });
            
            // Добавляем сборщика в список юнитов
            if (!GameState.entities) GameState.entities = [];
            GameState.entities.push(harvester);
            
            // Отображаем сообщение
            this.showFloatingMessage('Harvester created', x, y);
            
            console.log('Создан сборщик ресурсов');
        } else {
            console.log('Недостаточно ресурсов для создания сборщика');
            this.showFloatingMessage('Not enough resources', base.x * TILE_SIZE, base.y * TILE_SIZE);
        }
    }

    selectUnit(unit) {
        console.log(`Выбран юнит ${unit.type}`);
        GameState.selectedEntity = unit;
        
        // Обновляем информацию о выбранном объекте
        this.updateSelectedInfo(unit);
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
            // Показываем стартовый экран
            const startScreen = document.getElementById('gamestartscreen');
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
            resourcePanel.id = 'resource-panel';
            resourcePanel.className = 'resource-panel';
            
            // Добавляем ресурсы
            resourcePanel.innerHTML = `
                <div class="resource-item">
                    <div class="resource-icon metal-icon"></div>
                    <div class="resource-amount" id="metal-amount">${GameState.resources.metal}</div>
                </div>
                <div class="resource-item">
                    <div class="resource-icon gold-icon"></div>
                    <div class="resource-amount" id="gold-amount">${GameState.resources.gold}</div>
                </div>
                <div class="resource-item">
                    <div class="resource-icon energy-icon"></div>
                    <div class="resource-amount" id="energy-amount">${GameState.resources.energy}</div>
                </div>
            `;
            
            // Добавляем панель на игровой экран
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
            minimapCanvas.width = 150;
            minimapCanvas.height = 150;
            
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
        const tileSize = minimapCanvas.width / this.gameMap.width;
        
        // Очищаем миникарту
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // Отрисовываем тайлы на миникарте
        for (let y = 0; y < this.gameMap.height; y++) {
            for (let x = 0; x < this.gameMap.width; x++) {
                const tile = this.gameMap.tiles[y][x];
                
                // Выбираем цвет в зависимости от типа тайла
                switch (tile.type) {
                    case 'grass':
                        ctx.fillStyle = '#4a9e4a';
                        break;
                    case 'water':
                        ctx.fillStyle = '#4a82e5';
                        break;
                    case 'mountain':
                        ctx.fillStyle = '#7a7a7a';
                        break;
                    case 'forest':
                        ctx.fillStyle = '#2d7755';
                        break;
                    default:
                        ctx.fillStyle = '#4a9e4a';
                }
                
                // Рисуем тайл
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
        
        // Отмечаем позицию камеры на миникарте
        if (game.camera) {
            const cameraX = game.camera.x / (this.gameMap.width * this.gameMap.tileSize) * minimapCanvas.width;
            const cameraY = game.camera.y / (this.gameMap.height * this.gameMap.tileSize) * minimapCanvas.height;
            const cameraWidth = game.canvasWidth / (this.gameMap.width * this.gameMap.tileSize) * minimapCanvas.width;
            const cameraHeight = game.canvasHeight / (this.gameMap.height * this.gameMap.tileSize) * minimapCanvas.height;
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(cameraX, cameraY, cameraWidth, cameraHeight);
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
            
            // Преобразуем координаты мини-карты в координаты игровой карты
            const mapX = Math.floor(x / minimap.width * this.gameMap.width);
            const mapY = Math.floor(y / minimap.height * this.gameMap.height);
            
            // Центрируем камеру на выбранной точке
            this.centerCameraOn(mapX, mapY);
            
            console.log(`Клик по мини-карте: ${x}, ${y} -> Карта: ${mapX}, ${mapY}`);
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

    createCommandPanel() {
        console.log('Создание панели команд...');
        
        try {
            // Создаем панель команд
            const commandPanel = document.createElement('div');
            commandPanel.id = 'command-panel';
            commandPanel.className = 'command-panel';
            
            // Добавляем кнопки команд
            commandPanel.innerHTML = `
                <div class="command-button" data-command="buildings">
                    <div class="command-icon buildings-icon"></div>
                    <div class="command-label">Здания</div>
                </div>
                <div class="command-button" data-command="defenses">
                    <div class="command-icon defenses-icon"></div>
                    <div class="command-label">Оборона</div>
                </div>
                <div class="command-button" data-command="infantry">
                    <div class="command-icon infantry-icon"></div>
                    <div class="command-label">Пехота</div>
                </div>
                <div class="command-button" data-command="vehicles">
                    <div class="command-icon vehicles-icon"></div>
                    <div class="command-label">Техника</div>
                </div>
                <div class="command-button" data-command="aircraft">
                    <div class="command-icon aircraft-icon"></div>
                    <div class="command-label">Авиация</div>
                </div>
            `;
            
            // Добавляем панель на игровой экран
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(commandPanel);
            
            // Добавляем обработчики клика по кнопкам
            const commandButtons = commandPanel.querySelectorAll('.command-button');
            commandButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const command = button.getAttribute('data-command');
                    this.handleCommandClick(command, e);
                });
            });
            
            console.log('Панель команд создана');
        } catch (error) {
            console.error('Ошибка при создании панели команд:', error);
        }
    }

    handleCommandClick(command, e) {
        console.log(`Клик по команде: ${command}`);
        
        // Получаем контекстное меню
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) {
            console.error('Элемент context-menu не найден!');
            return;
        }
        
        // Очищаем меню
        contextMenu.innerHTML = '';
        
        // Заполняем меню в зависимости от команды
        switch (command) {
            case 'buildings':
                this.fillBuildingsMenu(contextMenu);
                break;
            case 'defenses':
                this.fillDefensesMenu(contextMenu);
                break;
            case 'infantry':
                this.fillInfantryMenu(contextMenu);
                break;
            case 'vehicles':
                this.fillVehiclesMenu(contextMenu);
                break;
            case 'aircraft':
                this.fillAircraftMenu(contextMenu);
                break;
        }
        
        // Отображаем меню
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        
        // Закрываем меню при клике вне его
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        };
        
        // Добавляем обработчик с небольшой задержкой
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    fillBuildingsMenu(menu) {
        // Добавляем пункты меню для зданий
        const buildings = [
            { name: 'Power Plant', description: 'Generates energy', cost: { metal: 100, gold: 50 }, icon: '🏭' },
            { name: 'Barracks', description: 'Trains infantry units', cost: { metal: 150, gold: 50 }, icon: '🏢' },
            { name: 'Factory', description: 'Builds vehicles', cost: { metal: 200, gold: 100 }, icon: '🏭' }
        ];
        
        buildings.forEach(building => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <div class="icon">${building.icon}</div>
                <div class="info">
                    <div class="name">${building.name}</div>
                    <div class="description">${building.description}</div>
                </div>
                <div class="cost">M:${building.cost.metal} G:${building.cost.gold}</div>
            `;
            
            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                this.startPlacingBuilding(building);
                menu.style.display = 'none';
            });
            
            menu.appendChild(item);
        });
    }

    fillDefensesMenu(menu) {
        // Добавляем пункты меню для оборонительных сооружений
        const defenses = [
            { name: 'Turret', description: 'Basic defense', cost: { metal: 75, gold: 25 }, icon: '🗼' },
            { name: 'Anti-Air', description: 'Shoots down aircraft', cost: { metal: 100, gold: 50 }, icon: '🗼' },
            { name: 'Shield Generator', description: 'Protects nearby units', cost: { metal: 150, gold: 100 }, icon: '🛡️' }
        ];
        
        defenses.forEach(defense => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <div class="icon">${defense.icon}</div>
                <div class="info">
                    <div class="name">${defense.name}</div>
                    <div class="description">${defense.description}</div>
                </div>
                <div class="cost">M:${defense.cost.metal} G:${defense.cost.gold}</div>
            `;
            
            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                this.startPlacingDefense(defense);
                menu.style.display = 'none';
            });
            
            menu.appendChild(item);
        });
    }

    fillInfantryMenu(menu) {
        // Добавляем пункты меню для пехоты
        const infantry = [
            { name: 'Rifleman', description: 'Basic infantry', cost: { metal: 20, gold: 10 }, icon: '👤' },
            { name: 'Rocket Soldier', description: 'Anti-vehicle infantry', cost: { metal: 30, gold: 20 }, icon: '👤' },
            { name: 'Engineer', description: 'Repairs buildings', cost: { metal: 40, gold: 30 }, icon: '👷' }
        ];
        
        infantry.forEach(unit => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <div class="icon">${unit.icon}</div>
                <div class="info">
                    <div class="name">${unit.name}</div>
                    <div class="description">${unit.description}</div>
                </div>
                <div class="cost">M:${unit.cost.metal} G:${unit.cost.gold}</div>
            `;
            
            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                this.trainUnit(unit);
                menu.style.display = 'none';
            });
            
            menu.appendChild(item);
        });
    }

    fillVehiclesMenu(menu) {
        // Добавляем пункты меню для техники
        const vehicles = [
            { name: 'Scout Tank', description: 'Fast but weak', cost: { metal: 50, gold: 30 }, icon: '🚙' },
            { name: 'Battle Tank', description: 'Strong but slow', cost: { metal: 100, gold: 50 }, icon: '🚚' },
            { name: 'Artillery', description: 'Long range attack', cost: { metal: 120, gold: 70 }, icon: '🚛' }
        ];
        
        vehicles.forEach(vehicle => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <div class="icon">${vehicle.icon}</div>
                <div class="info">
                    <div class="name">${vehicle.name}</div>
                    <div class="description">${vehicle.description}</div>
                </div>
                <div class="cost">M:${vehicle.cost.metal} G:${vehicle.cost.gold}</div>
            `;
            
            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                this.buildVehicle(vehicle);
                menu.style.display = 'none';
            });
            
            menu.appendChild(item);
        });
    }

    fillAircraftMenu(menu) {
        // Добавляем пункты меню для авиации
        const aircraft = [
            { name: 'Scout Drone', description: 'Reveals map', cost: { metal: 40, gold: 30 }, icon: '🚁' },
            { name: 'Fighter', description: 'Air superiority', cost: { metal: 80, gold: 60 }, icon: '✈️' },
            { name: 'Bomber', description: 'Destroys buildings', cost: { metal: 120, gold: 80 }, icon: '🛩️' }
        ];
        
        aircraft.forEach(aircraft => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.innerHTML = `
                <div class="icon">${aircraft.icon}</div>
                <div class="info">
                    <div class="name">${aircraft.name}</div>
                    <div class="description">${aircraft.description}</div>
                </div>
                <div class="cost">M:${aircraft.cost.metal} G:${aircraft.cost.gold}</div>
            `;
            
            // Добавляем обработчик клика
            item.addEventListener('click', () => {
                this.buildAircraft(aircraft);
                menu.style.display = 'none';
            });
            
            menu.appendChild(item);
        });
    }

    startPlacingBuilding(building) {
        console.log(`Начинаем размещение здания: ${building.name}`);
        
        // Проверяем наличие ресурсов
        if (!GameState.hasEnoughResources(building.cost)) {
            console.log('Недостаточно ресурсов для строительства');
            this.showFloatingMessage('Not enough resources', 100, 100);
            return;
        }
        
        // Создаем призрак здания, который следует за курсором
        const ghost = document.createElement('div');
        ghost.className = 'building-ghost';
        ghost.style.width = '64px';
        ghost.style.height = '64px';
        ghost.style.position = 'absolute';
        ghost.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
        ghost.style.border = '2px solid rgba(0, 255, 0, 0.7)';
        ghost.style.zIndex = '50';
        ghost.style.pointerEvents = 'none';
        
        // Добавляем призрак на игровой экран
        const gameInterface = document.getElementById('gameinterfacescreen');
        gameInterface.appendChild(ghost);
        
        // Обработчик движения мыши
        const mouseMoveHandler = (e) => {
            const rect = gameInterface.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Привязываем к сетке
            const gridX = Math.floor(x / TILE_SIZE) * TILE_SIZE;
            const gridY = Math.floor(y / TILE_SIZE) * TILE_SIZE;
            
            ghost.style.left = `${gridX}px`;
            ghost.style.top = `${gridY}px`;
        };
        
        // Обработчик клика
        const clickHandler = (e) => {
            const rect = gameInterface.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Привязываем к сетке
            const gridX = Math.floor(x / TILE_SIZE) * TILE_SIZE;
            const gridY = Math.floor(y / TILE_SIZE) * TILE_SIZE;
            
            // Размещаем здание
            this.placeBuilding(building, gridX, gridY);
            
            // Удаляем призрак и обработчики
            ghost.remove();
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('contextmenu', contextMenuHandler);
        };
        
        // Обработчик правого клика для отмены
        const contextMenuHandler = (e) => {
            e.preventDefault();
            
            // Удаляем призрак и обработчики
            ghost.remove();
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('click', clickHandler);
            document.removeEventListener('contextmenu', contextMenuHandler);
            
            console.log('Размещение здания отменено');
        };
        
        // Добавляем обработчики
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('click', clickHandler);
        document.addEventListener('contextmenu', contextMenuHandler);
    }

    placeBuilding(building, x, y) {
        console.log(`Размещаем здание: ${building.name} на координатах: ${x}, ${y}`);
        
        // Проверяем, что место свободно
        const tile = this.gameMap.tiles[y][x];
        if (tile.type !== 'water' && tile.type !== 'mountain' && tile.type !== 'forest' && !tile.resource) {
            // Создаем элемент здания
            const buildingElement = document.createElement('div');
            buildingElement.className = `building building-${building.name.toLowerCase().replace(/\s+/g, '-')}`;
            buildingElement.style.left = `${x * TILE_SIZE}px`;
            buildingElement.style.top = `${y * TILE_SIZE}px`;
            
            // Добавляем здание на игровой экран
            const gameInterface = document.getElementById('gameinterfacescreen');
            gameInterface.appendChild(buildingElement);
            
            // Создаем объект здания
            const buildingObj = {
                element: buildingElement,
                x: x / TILE_SIZE,
                y: y / TILE_SIZE,
                health: 1000,
                maxHealth: 1000,
                type: building.name.toLowerCase().replace(/\s+/g, '-'),
                owner: 'player'
            };
            
            // Добавляем здание в список сущностей
            if (!GameState.entities) GameState.entities = [];
            GameState.entities.push(buildingObj);
            
            // Отмечаем тайл как занятый зданием
            this.gameMap.tiles[y][x].resource = buildingObj;
            
            console.log(`Здание ${building.name} размещено на координатах: ${x}, ${y}`);
        } else {
            console.log(`Недостаточно места для размещения здания ${building.name}`);
            this.showFloatingMessage('Not enough space', x * TILE_SIZE, y * TILE_SIZE);
        }
    }

    // Заглушки для методов, которые будут реализованы позже
    startPlacingDefense(defense) {
        console.log(`Начинаем размещение обороны: ${defense.name}`);
        this.showFloatingMessage('Not implemented yet', 100, 100);
    }

    trainUnit(unit) {
        console.log(`Тренируем юнита: ${unit.name}`);
        this.showFloatingMessage('Not implemented yet', 100, 100);
    }

    buildVehicle(vehicle) {
        console.log(`Строим технику: ${vehicle.name}`);
        this.showFloatingMessage('Not implemented yet', 100, 100);
    }

    buildAircraft(aircraft) {
        console.log(`Строим авиацию: ${aircraft.name}`);
        this.showFloatingMessage('Not implemented yet', 100, 100);
    }
}

export const singleplayer = new Singleplayer();