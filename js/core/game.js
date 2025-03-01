// Импорты
import { loader } from './loader.js';
import { mouse } from './mouse.js';
import { maps } from './maps.js';
import { buildings } from '../entities/buildings.js';
import { vehicles } from '../entities/vehicles.js';
import { aircraft } from '../entities/aircraft.js';
import { resources } from '../entities/resources.js';

// Экспортируемые переменные
export let game = {
    // Игровые объекты
    buildingsList: [],
    vehiclesList: [],
    aircraftList: [],
    terrain: [],
    units: [], // Массив для хранения юнитов
    
    // Ресурсы игрока
    playerResources: {
        metal: 50,  // Начальный запас металла
        gold: 20,   // Начальный запас золота
        trees: 30   // Начальный запас деревьев
    },
    
    // Методы для работы с ресурсами
    addResource: function(type, amount) {
        if (this.playerResources.hasOwnProperty(type)) {
            this.playerResources[type] += amount;
            this.updateResourceDisplay();
        }
    },
    
    removeResource: function(type, amount) {
        if (this.playerResources.hasOwnProperty(type)) {
            this.playerResources[type] = Math.max(0, this.playerResources[type] - amount);
            this.updateResourceDisplay();
        }
    },
    
    updateResourceDisplay: function() {
        document.getElementById('trees-count').textContent = this.playerResources.trees;
        document.getElementById('metal-count').textContent = this.playerResources.metal;
        document.getElementById('gold-count').textContent = this.playerResources.gold;
        this.updateBuildingButtons(); // Обновляем состояние кнопок
    },
    
    // Начало новой игры
    init: function() {
        // Инициализируем объекты
        loader.init();
        mouse.init();

        // Инициализируем канвасы
        game.initCanvases();

        // Инициализируем управление камерой
        game.initCameraControl();

        // Показываем стартовый экран
        document.querySelectorAll('.gamelayer').forEach(layer => layer.style.display = 'none');
        document.getElementById('gamestartscreen').style.display = 'flex';

        // Добавляем обработчики для контекстного меню
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.addEventListener('mousedown', (e) => {
            game.handleMouseClick(e);
        });

        // Добавляем обработчик клика по пункту меню
        document.getElementById('context-menu').addEventListener('click', (e) => {
            const menuItem = e.target.closest('.context-menu-item');
            if (!menuItem || menuItem.classList.contains('disabled')) return;

            const unitType = menuItem.dataset.unit;
            if (unitType === 'harvester') {
                game.createHarvester();
            }
        });

        // Добавляем обработчик правого клика
        document.addEventListener('contextmenu', (e) => {
            game.handleContextMenu(e);
        });

        // Добавляем обработчик для закрытия меню при клике вне его
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) {
                game.hideContextMenu();
            }
        });

        // Инициализируем время для анимации
        game.lastTime = Date.now();

        // Инициализация интерфейса
        game.initInterface();
    },

    initCanvases: function() {
        game.backgroundCanvas = document.getElementById('gamebackgroundcanvas');
        game.backgroundContext = game.backgroundCanvas.getContext('2d');

        game.foregroundCanvas = document.getElementById('gameforegroundcanvas');
        game.foregroundContext = game.foregroundCanvas.getContext('2d');

        // Инициализация миникарты
        game.minimapCanvas = document.getElementById('minimapcanvas');
        game.minimapContext = game.minimapCanvas.getContext('2d');

        // Устанавливаем размеры канвасов
        game.resizeCanvases();

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', game.resizeCanvases);
    },

    resizeCanvases: function() {
        // Устанавливаем размеры канвасов на полный размер окна
        game.backgroundCanvas.width = window.innerWidth;
        game.backgroundCanvas.height = window.innerHeight;
        game.foregroundCanvas.width = window.innerWidth;
        game.foregroundCanvas.height = window.innerHeight;

        // Обновляем размеры игры
        game.canvasWidth = window.innerWidth;
        game.canvasHeight = window.innerHeight;

        // Устанавливаем размеры миникарты
        game.minimapCanvas.width = 200;
        game.minimapCanvas.height = 200;

        // Перерисовываем карту
        if (game.backgroundContext) {
            game.backgroundContext.fillStyle = '#1a1a1a';
            game.backgroundContext.fillRect(0, 0, game.canvasWidth, game.canvasHeight);
            game.drawGrid();
        }
    },

    start: function() {
        // Показываем игровой экран
        document.querySelectorAll('.gamelayer').forEach(layer => layer.style.display = 'none');
        const gameInterface = document.getElementById('gameinterfacescreen');
        gameInterface.style.display = 'block';
        gameInterface.classList.add('active');
        
        // Загружаем первый уровень
        game.loadLevel(1);
        
        // Начинаем игровой цикл
        game.animationLoop();
    },

    // Игровой цикл
    animationLoop: function() {
        const currentTime = performance.now();
        const deltaTime = currentTime - game.lastTime;
        game.lastTime = currentTime;

        // Обновляем очередь спавна
        if (game.playerBase && game.playerBase.spawnQueue.length > 0) {
            const currentSpawn = game.playerBase.spawnQueue[0];
            currentSpawn.progress += deltaTime;
            
            if (currentSpawn.progress >= currentSpawn.buildTime) {
                spawnUnit(currentSpawn);
            }
        }

        // Очищаем фон
        game.backgroundContext.fillStyle = '#2a2a2a';
        game.backgroundContext.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

        // Очищаем передний слой перед каждым кадром
        game.foregroundContext.clearRect(0, 0, game.canvasWidth, game.canvasHeight);

        // Обновляем туман войны
        game.fogOfWar.update();

        // Сохраняем состояние контекста
        game.backgroundContext.save();
        
        // Применяем трансформацию камеры
        game.backgroundContext.translate(game.camera.x, game.camera.y);

        // Сначала рисуем сетку
        game.drawGrid();
        
        // Затем рисуем карту
        game.drawMap();

        // Рисуем юнитов
        game.drawUnits();
        
        // Восстанавливаем состояние контекста
        game.backgroundContext.restore();

        // Обновляем миникарту
        game.drawMinimap();

        // Отрисовываем статус базы
        if (game.playerBase) {
            game.drawBase();
        }

        // Запускаем следующий кадр
        requestAnimationFrame(game.animationLoop);
    },

    drawMap: function() {
        const tileSize = maps.tileSize;
        const time = Date.now();
        
        // Определяем видимую область
        const startX = Math.max(0, Math.floor(-game.camera.x / tileSize));
        const startY = Math.max(0, Math.floor(-game.camera.y / tileSize));
        const endX = Math.min(maps.mapSize.width, Math.ceil((-game.camera.x + game.canvasWidth) / tileSize));
        const endY = Math.min(maps.mapSize.height, Math.ceil((-game.camera.y + game.canvasHeight) / tileSize));

        // Рисуем видимые тайлы
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Если клетка в тумане войны, рисуем темный фон
                if (game.fogOfWar.grid[y]?.[x] === 1) {
                    const screenX = x * tileSize;
                    const screenY = y * tileSize;
                    game.backgroundContext.fillStyle = '#1a1a1a';
                    game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);
                    continue;
                }

                const tile = game.terrain[y]?.[x];
                if (tile) {
                    const screenX = x * tileSize;
                    const screenY = y * tileSize;
                    const centerX = screenX + tileSize/2;
                    const centerY = screenY + tileSize/2;

                    switch(tile) {
                        case 'trees':
                            // Био-кристаллическое дерево
                            const treePulse = Math.sin(time / 1000 + x * y) * 0.15 + 0.85;
                            
                            // Основание с мягким свечением
                            const treeGlow = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.7
                            );
                            treeGlow.addColorStop(0, 'rgba(46, 204, 113, 0.2)');
                            treeGlow.addColorStop(1, 'rgba(46, 204, 113, 0)');
                            game.backgroundContext.fillStyle = treeGlow;
                            game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);

                            // Органическая форма кристалла
                            game.backgroundContext.beginPath();
                            const points = 8;
                            for (let i = 0; i < points; i++) {
                                const angle = (i / points) * Math.PI * 2;
                                const radius = (tileSize * 0.3) * (1 + Math.sin(angle * 3) * 0.1) * treePulse;
                                const px = centerX + Math.cos(angle) * radius;
                                const py = centerY + Math.sin(angle) * radius;
                                if (i === 0) game.backgroundContext.moveTo(px, py);
                                else game.backgroundContext.lineTo(px, py);
                            }
                            game.backgroundContext.closePath();
                            
                            const treeGradient = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.3
                            );
                            treeGradient.addColorStop(0, '#2ecc71');
                            treeGradient.addColorStop(0.7, '#27ae60');
                            treeGradient.addColorStop(1, '#145a32');
                            game.backgroundContext.fillStyle = treeGradient;
                            game.backgroundContext.fill();

                            // Внутреннее свечение
                            game.backgroundContext.beginPath();
                            game.backgroundContext.arc(centerX, centerY, tileSize * 0.15 * treePulse, 0, Math.PI * 2);
                            game.backgroundContext.fillStyle = 'rgba(255, 255, 255, 0.3)';
                            game.backgroundContext.fill();
                            break;

                        case 'metal':
                            // Нано-металлическая структура
                            const metalPulse = Math.sin(time / 900 + x * y) * 0.1 + 0.9;
                            
                            // Основное свечение
                            const metalGlow = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.7
                            );
                            metalGlow.addColorStop(0, 'rgba(189, 195, 199, 0.2)');
                            metalGlow.addColorStop(1, 'rgba(189, 195, 199, 0)');
                            game.backgroundContext.fillStyle = metalGlow;
                            game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);

                            // Основная форма
                            game.backgroundContext.beginPath();
                            const metalPoints = 6;
                            for (let i = 0; i < metalPoints; i++) {
                                const angle = (i / metalPoints) * Math.PI * 2 + time / 2000;
                                const radius = tileSize * 0.35 * metalPulse;
                                const px = centerX + Math.cos(angle) * radius;
                                const py = centerY + Math.sin(angle) * radius;
                                if (i === 0) game.backgroundContext.moveTo(px, py);
                                else game.backgroundContext.lineTo(px, py);
                            }
                            game.backgroundContext.closePath();
                            
                            const metalGradient = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.35
                            );
                            metalGradient.addColorStop(0, '#95a5a6');
                            metalGradient.addColorStop(0.6, '#7f8c8d');
                            metalGradient.addColorStop(1, '#2c3e50');
                            game.backgroundContext.fillStyle = metalGradient;
                            game.backgroundContext.fill();

                            // Внутренние линии
                            for (let i = 0; i < 3; i++) {
                                const angle = (time / 1500) + (i * Math.PI / 3);
                                game.backgroundContext.beginPath();
                                game.backgroundContext.moveTo(centerX, centerY);
                                game.backgroundContext.lineTo(
                                    centerX + Math.cos(angle) * tileSize * 0.35,
                                    centerY + Math.sin(angle) * tileSize * 0.35
                                );
                                game.backgroundContext.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                                game.backgroundContext.lineWidth = 2;
                                game.backgroundContext.stroke();
                            }
                            break;

                        case 'gold':
                            // Плазменное золото
                            const goldPulse = Math.sin(time / 700 + x * y) * 0.15 + 0.85;
                            
                            // Внешнее свечение
                            const goldGlow = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.8
                            );
                            goldGlow.addColorStop(0, 'rgba(241, 196, 15, 0.3)');
                            goldGlow.addColorStop(1, 'rgba(241, 196, 15, 0)');
                            game.backgroundContext.fillStyle = goldGlow;
                            game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);

                            // Основная форма
                            game.backgroundContext.beginPath();
                            const goldPoints = 12;
                            for (let i = 0; i < goldPoints; i++) {
                                const angle = (i / goldPoints) * Math.PI * 2;
                                const radius = tileSize * 0.3 * (1 + Math.sin(angle * 6 + time / 500) * 0.1) * goldPulse;
                                const px = centerX + Math.cos(angle) * radius;
                                const py = centerY + Math.sin(angle) * radius;
                                if (i === 0) game.backgroundContext.moveTo(px, py);
                                else game.backgroundContext.lineTo(px, py);
                            }
                            game.backgroundContext.closePath();
                            
                            const goldGradient = game.backgroundContext.createRadialGradient(
                                centerX, centerY, 0,
                                centerX, centerY, tileSize * 0.3
                            );
                            goldGradient.addColorStop(0, '#f1c40f');
                            goldGradient.addColorStop(0.7, '#f39c12');
                            goldGradient.addColorStop(1, '#d35400');
                            game.backgroundContext.fillStyle = goldGradient;
                            game.backgroundContext.fill();

                            // Энергетические кольца
                            for (let i = 0; i < 2; i++) {
                                const ringPulse = Math.sin(time / 600 + i * Math.PI) * 0.2 + 0.8;
                                game.backgroundContext.beginPath();
                                game.backgroundContext.arc(centerX, centerY, 
                                    (tileSize * (0.2 + i * 0.1)) * ringPulse, 0, Math.PI * 2);
                                game.backgroundContext.strokeStyle = `rgba(255, 255, 255, ${0.3 * goldPulse})`;
                                game.backgroundContext.lineWidth = 2;
                                game.backgroundContext.stroke();
                            }

                            // Центральное ядро
                            game.backgroundContext.beginPath();
                            game.backgroundContext.arc(centerX, centerY, 4 * goldPulse, 0, Math.PI * 2);
                            game.backgroundContext.fillStyle = '#fff';
                            game.backgroundContext.fill();
                            break;

                        case 'player_base':
                        case 'enemy_base':
                            const isEnemy = tile === 'enemy_base';
                            const baseColor = isEnemy ? '#e74c3c' : '#3498db';
                            const glowColor = isEnemy ? '#c0392b' : '#2980b9';
                            
                            // Определяем позицию в сетке базы (3x3)
                            const baseGridX = Math.floor(x / 3);
                            const baseGridY = Math.floor(y / 3);
                            const baseStartX = baseGridX * 3 - 1;
                            const baseStartY = baseGridY * 3 - 1;
                            const relativeX = x - baseStartX;
                            const relativeY = y - baseStartY;
                            
                            // Создаем градиент для тайла
                            const tileGradient = game.backgroundContext.createLinearGradient(
                                screenX, screenY,
                                screenX + tileSize, screenY + tileSize
                            );
                            tileGradient.addColorStop(0, baseColor);
                            tileGradient.addColorStop(0.5, glowColor);
                            tileGradient.addColorStop(1, baseColor);
                            
                            // Рисуем основу тайла с градиентом
                            game.backgroundContext.fillStyle = tileGradient;
                            game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);
                            
                            // Добавляем технологический узор
                            game.backgroundContext.strokeStyle = `${glowColor}44`;
                            game.backgroundContext.lineWidth = 1;
                            
                            // Рисуем диагональные линии
                            game.backgroundContext.beginPath();
                            game.backgroundContext.moveTo(screenX + 5, screenY + 5);
                            game.backgroundContext.lineTo(screenX + tileSize - 5, screenY + tileSize - 5);
                            game.backgroundContext.moveTo(screenX + tileSize - 5, screenY + 5);
                            game.backgroundContext.lineTo(screenX + 5, screenY + tileSize - 5);
                            game.backgroundContext.stroke();
                            
                            // Добавляем блики
                            const highlight = game.backgroundContext.createLinearGradient(
                                screenX, screenY,
                                screenX + tileSize / 3, screenY + tileSize / 3
                            );
                            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
                            game.backgroundContext.fillStyle = highlight;
                            game.backgroundContext.fillRect(screenX, screenY, tileSize, tileSize);
                            
                            // Рисуем границы тайла
                            game.backgroundContext.strokeStyle = glowColor;
                            game.backgroundContext.lineWidth = 2;
                            game.backgroundContext.beginPath();
                            
                            // Рисуем только внешние границы базы
                            if (relativeX === 0) game.backgroundContext.moveTo(screenX, screenY + tileSize), game.backgroundContext.lineTo(screenX, screenY);
                            if (relativeY === 0) game.backgroundContext.moveTo(screenX, screenY), game.backgroundContext.lineTo(screenX + tileSize, screenY);
                            if (relativeX === 2) game.backgroundContext.moveTo(screenX + tileSize, screenY), game.backgroundContext.lineTo(screenX + tileSize, screenY + tileSize);
                            if (relativeY === 2) game.backgroundContext.moveTo(screenX, screenY + tileSize), game.backgroundContext.lineTo(screenX + tileSize, screenY + tileSize);
                            
                            game.backgroundContext.stroke();
                            
                            // Сохраняем информацию о центральном тайле для последующей отрисовки
                            if (relativeX === 1 && relativeY === 1) {
                                game.currentBase = {
                                    centerX: (baseStartX) * tileSize + tileSize * 1.5,
                                    centerY: (baseStartY) * tileSize + tileSize * 1.5,
                                    baseStartX,
                                    baseStartY,
                                    glowColor,
                                    pulse: Math.sin(time / 1000) * 0.2 + 0.8
                                };
                            }
                            break;

                        default:
                            game.backgroundContext.fillStyle = '#1a1a1a';
                            game.backgroundContext.fillRect(screenX, screenY, tileSize - 1, tileSize - 1);
                            break;
                    }
                }
            }
        }

        // Отрисовка свечения и ядра поверх всей базы
        if (game.currentBase) {
            const { centerX, centerY, baseStartX, baseStartY, glowColor, pulse } = game.currentBase;
            
            // Внешнее свечение базы
            const outerGlow = game.backgroundContext.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, tileSize * 2
            );
            outerGlow.addColorStop(0, `${glowColor}33`);
            outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
            
            game.backgroundContext.fillStyle = outerGlow;
            game.backgroundContext.fillRect(baseStartX * tileSize, baseStartY * tileSize, tileSize * 3, tileSize * 3);
            
            // Энергетические линии
            const time = Date.now();
            const lineCount = 8;
            game.backgroundContext.beginPath();
            for (let i = 0; i < lineCount; i++) {
                const angle = (i / lineCount) * Math.PI * 2 + time / 2000;
                const lineLength = tileSize * (1.2 + Math.sin(time / 1000 + i) * 0.2);
                game.backgroundContext.moveTo(centerX, centerY);
                game.backgroundContext.lineTo(
                    centerX + Math.cos(angle) * lineLength,
                    centerY + Math.sin(angle) * lineLength
                );
            }
            game.backgroundContext.strokeStyle = `${glowColor}44`;
            game.backgroundContext.lineWidth = 2;
            game.backgroundContext.stroke();
            
            // Внутреннее свечение ядра
            const coreGlow = game.backgroundContext.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, tileSize * 0.8
            );
            coreGlow.addColorStop(0, glowColor);
            coreGlow.addColorStop(0.6, `${glowColor}88`);
            coreGlow.addColorStop(1, 'rgba(0,0,0,0)');
            
            game.backgroundContext.fillStyle = coreGlow;
            game.backgroundContext.beginPath();
            game.backgroundContext.arc(centerX, centerY, tileSize * 0.8, 0, Math.PI * 2);
            game.backgroundContext.fill();
            
            // Ядро
            const coreSize = tileSize / 4 * pulse;
            game.backgroundContext.beginPath();
            game.backgroundContext.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
            const coreGradient = game.backgroundContext.createRadialGradient(
                centerX - coreSize * 0.3, centerY - coreSize * 0.3, 0,
                centerX, centerY, coreSize
            );
            coreGradient.addColorStop(0, '#fff');
            coreGradient.addColorStop(0.6, glowColor);
            coreGradient.addColorStop(1, `${glowColor}cc`);
            game.backgroundContext.fillStyle = coreGradient;
            game.backgroundContext.fill();
            
            // Очищаем информацию о текущей базе
            game.currentBase = null;
        }
    },

    drawGrid: function() {
        const tileSize = maps.tileSize;
        game.backgroundContext.strokeStyle = '#444';
        game.backgroundContext.lineWidth = 1;

        // Определяем видимую область
        const startX = Math.floor(-game.camera.x / tileSize) * tileSize;
        const startY = Math.floor(-game.camera.y / tileSize) * tileSize;
        const endX = Math.ceil((-game.camera.x + game.canvasWidth) / tileSize) * tileSize;
        const endY = Math.ceil((-game.camera.y + game.canvasHeight) / tileSize) * tileSize;

        // Рисуем вертикальные линии
        for (let x = startX; x <= endX; x += tileSize) {
            game.backgroundContext.beginPath();
            game.backgroundContext.moveTo(x + 0.5, startY);
            game.backgroundContext.lineTo(x + 0.5, endY);
            game.backgroundContext.stroke();
        }

        // Рисуем горизонтальные линии
        for (let y = startY; y <= endY; y += tileSize) {
            game.backgroundContext.beginPath();
            game.backgroundContext.moveTo(startX, y + 0.5);
            game.backgroundContext.lineTo(endX, y + 0.5);
            game.backgroundContext.stroke();
        }
    },

    updateObjects: function() {
        // Здесь будет обновление всех игровых объектов
    },

    drawObjects: function() {
        // Здесь будет отрисовка всех игровых объектов
    },

    // Текущий уровень
    currentLevel: 0,
    
    // Деньги игрока
    cash: 100,

    // Состояния игры
    gameOver: false,
    paused: false,

    // Камера
    camera: {
        x: 0,
        y: 0,
        speed: 10
    },

    // Обновление счетчиков ресурсов
    updateResourceCounts: function() {
        let counts = {
            trees: 0,
            metal: 0,
            gold: 0
        };

        // Подсчитываем ресурсы на карте
        for (let y = 0; y < maps.mapSize.height; y++) {
            for (let x = 0; x < maps.mapSize.width; x++) {
                const tile = game.terrain[y]?.[x];
                if (tile && counts.hasOwnProperty(tile)) {
                    counts[tile]++;
                }
            }
        }

        // Обновляем отображение
        document.getElementById('trees-count').textContent = counts.trees;
        document.getElementById('metal-count').textContent = counts.metal;
        document.getElementById('gold-count').textContent = counts.gold;
    },

    // Загрузка уровня
    loadLevel: function(levelNumber) {
        game.currentLevel = levelNumber;
        
        // Инициализируем карту
        game.terrain = maps.initialize(levelNumber);
        
        // Устанавливаем размеры игрового мира
        game.worldWidth = maps.mapSize.width * maps.tileSize;
        game.worldHeight = maps.mapSize.height * maps.tileSize;
        
        // Центрируем камеру на стартовой позиции
        game.camera.x = -maps.level1.startPosition.x * maps.tileSize + game.canvasWidth / 2;
        game.camera.y = -maps.level1.startPosition.y * maps.tileSize + game.canvasHeight / 2;

        // Инициализируем позицию базы игрока
        game.playerBase = {
            x: maps.level1.startPosition.x,
            y: maps.level1.startPosition.y,
            hp: 1000,
            maxHp: 1000,
            size: 3, // Размер базы 3x3
            spawnQueue: [],
            currentSpawn: null
        };
        
        // Инициализируем туман войны
        game.fogOfWar.init();
        
        // Обновляем счетчики ресурсов
        game.updateResourceDisplay();
        
        // Устанавливаем размеры канвасов
        game.resizeCanvases();
    },

    // Управление камерой
    initCameraControl: function() {
        const keys = new Set();
        
        window.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());
        });

        window.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });

        function updateCamera() {
            const speed = game.camera.speed;
            
            // Движение камеры
            if (keys.has('w') || keys.has('arrowup')) {
                game.camera.y += speed;
            }
            if (keys.has('s') || keys.has('arrowdown')) {
                game.camera.y -= speed;
            }
            if (keys.has('a') || keys.has('arrowleft')) {
                game.camera.x += speed;
            }
            if (keys.has('d') || keys.has('arrowright')) {
                game.camera.x -= speed;
            }

            // Ограничиваем движение камеры границами карты
            game.camera.x = Math.min(0, 
                Math.max(game.camera.x, -game.worldWidth + game.canvasWidth));
            game.camera.y = Math.min(0, 
                Math.max(game.camera.y, -game.worldHeight + game.canvasHeight));

            requestAnimationFrame(updateCamera);
        }

        updateCamera();
    },

    // Туман войны
    fogOfWar: {
        enabled: true,
        grid: [], // Сетка видимости
        init: function() {
            // Инициализируем сетку тумана войны
            this.grid = [];
            for (let y = 0; y < maps.mapSize.height; y++) {
                this.grid[y] = [];
                for (let x = 0; x < maps.mapSize.width; x++) {
                    this.grid[y][x] = 1; // 1 = туман, 0 = видимая область
                }
            }
        },
        
        update: function() {
            // Обновляем видимость вокруг базы и юнитов
            const visionRange = 5; // Радиус видимости
            
            // Очищаем старую видимость
            for (let y = 0; y < maps.mapSize.height; y++) {
                for (let x = 0; x < maps.mapSize.width; x++) {
                    this.grid[y][x] = 1;
                }
            }
            
            // Открываем видимость вокруг базы игрока
            for (let y = 0; y < maps.mapSize.height; y++) {
                for (let x = 0; x < maps.mapSize.width; x++) {
                    if (game.terrain[y]?.[x] === 'player_base') {
                        this.revealArea(x, y, visionRange);
                    }
                }
            }
            
            // В будущем здесь будет обновление видимости вокруг юнитов
        },
        
        revealArea: function(centerX, centerY, range) {
            for (let y = Math.max(0, centerY - range); y < Math.min(maps.mapSize.height, centerY + range + 1); y++) {
                for (let x = Math.max(0, centerX - range); x < Math.min(maps.mapSize.width, centerX + range + 1); x++) {
                    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    if (distance <= range) {
                        this.grid[y][x] = 0;
                    }
                }
            }
        }
    },

    drawMinimap: function() {
        const ctx = game.minimapContext;
        const minimap = game.minimapCanvas;
        
        // Очищаем миникарту
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, minimap.width, minimap.height);
        
        // Вычисляем масштаб
        const scaleX = minimap.width / (maps.mapSize.width * maps.tileSize);
        const scaleY = minimap.height / (maps.mapSize.height * maps.tileSize);
        
        // Рисуем объекты на карте
        for (let y = 0; y < maps.mapSize.height; y++) {
            for (let x = 0; x < maps.mapSize.width; x++) {
                // Если область в тумане войны, рисуем серым
                if (game.fogOfWar.grid[y]?.[x] === 1) {
                    ctx.fillStyle = '#2a2a2a';
                    ctx.fillRect(
                        x * maps.tileSize * scaleX,
                        y * maps.tileSize * scaleY,
                        maps.tileSize * scaleX,
                        maps.tileSize * scaleY
                    );
                    continue;
                }
                
                const tile = game.terrain[y]?.[x];
                if (tile) {
                    switch(tile) {
                        case 'trees':
                            ctx.fillStyle = '#27ae60';
                            break;
                        case 'metal':
                            ctx.fillStyle = '#7f8c8d';
                            break;
                        case 'gold':
                            ctx.fillStyle = '#f39c12';
                            break;
                        case 'player_base':
                            ctx.fillStyle = '#3498db';
                            break;
                        case 'enemy_base':
                            ctx.fillStyle = '#e74c3c';
                            break;
                    }
                    ctx.fillRect(
                        x * maps.tileSize * scaleX,
                        y * maps.tileSize * scaleY,
                        maps.tileSize * scaleX,
                        maps.tileSize * scaleY
                    );
                }
            }
        }
        
        // Рисуем область видимости камеры
        const viewportX = -game.camera.x * scaleX;
        const viewportY = -game.camera.y * scaleY;
        const viewportWidth = game.canvasWidth * scaleX;
        const viewportHeight = game.canvasHeight * scaleY;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    },

    // Выбранный юнит
    selectedUnit: null,

    // Отрисовка юнитов
    drawUnits: function() {
        this.units.forEach(unit => {
            const screenX = unit.x * maps.tileSize;
            const screenY = unit.y * maps.tileSize;
            const size = maps.tileSize;

            // Основная форма юнита
            this.backgroundContext.fillStyle = unit.color;
            this.backgroundContext.beginPath();
            this.backgroundContext.arc(
                screenX + size/2,
                screenY + size/2,
                size/2 - 4,
                0,
                Math.PI * 2
            );
            this.backgroundContext.fill();

            // Блик
            const gradient = this.backgroundContext.createLinearGradient(
                screenX, screenY,
                screenX + size/2, screenY + size/2
            );
            gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            this.backgroundContext.fillStyle = gradient;
            this.backgroundContext.fill();

            // Если юнит выбран, рисуем выделение
            if (unit === this.selectedUnit) {
                this.backgroundContext.strokeStyle = '#4a9eff';
                this.backgroundContext.lineWidth = 2;
                this.backgroundContext.beginPath();
                this.backgroundContext.arc(
                    screenX + size/2,
                    screenY + size/2,
                    size/2,
                    0,
                    Math.PI * 2
                );
                this.backgroundContext.stroke();

                // Пульсирующее свечение
                const time = Date.now() / 1000;
                const pulseSize = Math.sin(time * 4) * 2 + size/2 + 4;
                this.backgroundContext.strokeStyle = 'rgba(74,158,255,0.3)';
                this.backgroundContext.beginPath();
                this.backgroundContext.arc(
                    screenX + size/2,
                    screenY + size/2,
                    pulseSize,
                    0,
                    Math.PI * 2
                );
                this.backgroundContext.stroke();
            }

            // Индикатор здоровья
            const healthBarWidth = size - 8;
            const healthBarHeight = 4;
            const healthPercentage = unit.hp / 100;

            // Фон полоски здоровья
            this.backgroundContext.fillStyle = 'rgba(0,0,0,0.5)';
            this.backgroundContext.fillRect(
                screenX + 4,
                screenY - 8,
                healthBarWidth,
                healthBarHeight
            );

            // Полоска здоровья
            this.backgroundContext.fillStyle = unit.hp > 50 ? '#2ecc71' : unit.hp > 25 ? '#f1c40f' : '#e74c3c';
            this.backgroundContext.fillRect(
                screenX + 4,
                screenY - 8,
                healthBarWidth * healthPercentage,
                healthBarHeight
            );
        });
    },

    // Обработка кликов мыши
    handleMouseClick: function(event) {
        const x = Math.floor((event.offsetX - game.camera.x) / maps.tileSize);
        const y = Math.floor((event.offsetY - game.camera.y) / maps.tileSize);

        // Левый клик
        if (event.button === 0) {
            // Проверяем, кликнули ли по юниту
            const clickedUnit = this.units.find(unit => 
                unit.x === x && unit.y === y
            );

            if (clickedUnit) {
                this.selectedUnit = clickedUnit;
            } else {
                this.selectedUnit = null;
            }
        }
        // Правый клик
        else if (event.button === 2) {
            // Проверяем, кликнули ли по базе
            if (this.checkBaseClick(x, y)) {
                this.showContextMenu(event.clientX, event.clientY);
                return;
            }
            // Скрываем контекстное меню при клике вне базы
            this.hideContextMenu();
        }
    },

    // Проверка клика по базе
    checkBaseClick: function(x, y) {
        if (!this.playerBase) return false;
        
        const baseSize = 3; // Размер базы 3x3
        const baseX = this.playerBase.x;
        const baseY = this.playerBase.y;
        
        // Проверяем, попадает ли клик в область базы 3x3
        return x >= baseX && x < baseX + baseSize &&
               y >= baseY && y < baseY + baseSize;
    },

    // Показать контекстное меню
    showContextMenu: function(x, y) {
        const menu = document.getElementById('context-menu');
        menu.innerHTML = `
            <div class="context-menu-group">
                <div class="context-menu-item" data-unit="harvester">
                    <div class="icon">🤖</div>
                    <div class="info">
                        <div class="name">Harvester Bot</div>
                        <div class="description">Собирает ресурсы</div>
                    </div>
                    <div class="cost">M:30 G:10</div>
                </div>
            </div>
        `;
        
        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Добавляем обработчики для пунктов меню
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const unitType = item.dataset.unit;
                if (unitType) {
                    this.addUnitToSpawnQueue(unitType);
                }
                this.hideContextMenu();
            });
        });
    },

    // Скрыть контекстное меню
    hideContextMenu: function() {
        document.getElementById('context-menu').style.display = 'none';
    },

    // Инициализация интерфейса
    initInterface: function() {
        // Обработчик для кнопки buildings
        const buildingsButton = document.querySelector('.command-button.buildings');
        if (buildingsButton) {
            buildingsButton.onclick = function(event) {
                const menu = document.getElementById('context-menu');
                menu.innerHTML = `
                    <div class="context-menu-group buildings">
                        <div class="context-menu-item" data-building="powerplant">
                            <div class="icon">⚡</div>
                            <div class="info">
                                <div class="name">Power Plant</div>
                                <div class="description">Производит энергию</div>
                            </div>
                            <div class="cost">M:50 G:20</div>
                        </div>
                        <div class="context-menu-item" data-building="barracks">
                            <div class="icon">🏛️</div>
                            <div class="info">
                                <div class="name">Barracks</div>
                                <div class="description">Тренирует пехоту</div>
                            </div>
                            <div class="cost">M:100 G:30</div>
                        </div>
                        <div class="context-menu-item" data-building="factory">
                            <div class="icon">🏭</div>
                            <div class="info">
                                <div class="name">Factory</div>
                                <div class="description">Производит технику</div>
                            </div>
                            <div class="cost">M:150 G:50</div>
                        </div>
                    </div>
                `;
                
                menu.style.display = 'block';
                // Позиционируем меню над кнопкой
                const buttonRect = buildingsButton.getBoundingClientRect();
                menu.style.left = buttonRect.left + 'px';
                menu.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';

                // Добавляем обработчики для зданий
                menu.querySelectorAll('.context-menu-item').forEach(item => {
                    item.onclick = function() {
                        const buildingType = this.dataset.building;
                        if (buildingType) {
                            // Здесь будет логика размещения здания
                            console.log('Selected building:', buildingType);
                        }
                        game.hideContextMenu();
                    };
                });

                // Предотвращаем всплытие события
                event.stopPropagation();
            };
        }

        // Добавляем обработчик для закрытия меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#context-menu') && !e.target.closest('.command-button.buildings')) {
                game.hideContextMenu();
            }
        });
    },

    // Обновление состояния кнопок
    updateBuildingButtons: function() {
        const buttons = document.querySelectorAll('.building-button');
        buttons.forEach(button => {
            // Проверяем достаточно ли ресурсов для создания
            const canAffordHarvester = this.playerResources.metal >= 30 && this.playerResources.gold >= 10;
            button.classList.toggle('disabled', !canAffordHarvester);
        });
    },

    // Создать борга-сборщика
    createHarvester: function() {
        if (this.playerResources.metal >= 30 && this.playerResources.gold >= 10) {
            // Списываем ресурсы
            this.playerResources.metal -= 30;
            this.playerResources.gold -= 10;
            
            // Создаем борга рядом с базой
            const spawnX = this.playerBase.x + 3; // Справа от базы
            const spawnY = this.playerBase.y + 1; // По центру базы
            
            const harvester = {
                x: spawnX,
                y: spawnY,
                type: 'harvester',
                hp: 100,
                color: '#4a9eff', // Синий цвет для сборщика
                speed: 1,
                carrying: null
            };
            
            this.units.push(harvester);
            this.updateResourceDisplay();
            this.hideContextMenu();
        }
    },

    handleContextMenu: function(event) {
        event.preventDefault();
        
        // Проверяем клик по базе
        const gridX = Math.floor((event.offsetX - this.camera.x) / maps.tileSize);
        const gridY = Math.floor((event.offsetY - this.camera.y) / maps.tileSize);
        
        if (this.checkBaseClick(gridX, gridY)) {
            const contextMenu = document.getElementById('context-menu');
            contextMenu.style.display = 'block';
            contextMenu.style.left = event.pageX + 'px';
            contextMenu.style.top = event.pageY + 'px';
            
            // Добавляем обработчики для пунктов меню
            const menuItems = contextMenu.getElementsByClassName('context-menu-item');
            Array.from(menuItems).forEach(item => {
                item.onclick = () => {
                    const unitType = item.dataset.unit;
                    this.addUnitToSpawnQueue(unitType);
                    contextMenu.style.display = 'none';
                };
            });
        }
    },

    addUnitToSpawnQueue: function(unitType) {
        if (game.playerBase.spawnQueue.length > 0) {
            return false;
        }
        
        game.playerBase.spawnQueue.push({
            type: unitType,
            progress: 0,
            buildTime: 5000 // 5 секунд
        });
        return true;
    },

    spawnUnit: function(spawnData) {
        const spawnX = game.playerBase.x + game.playerBase.size;
        const spawnY = game.playerBase.y + Math.floor(game.playerBase.size / 2);
        
        const unit = {
            x: spawnX,
            y: spawnY,
            type: spawnData.type,
            color: '#4a9eff', // Всегда начинаем с синего
            hp: 100
        };
        
        // Через 5 секунд меняем цвет на зеленый
        if (spawnData.type === 'harvester') {
            setTimeout(() => {
                unit.color = '#2ecc71';
            }, 5000);
        }
        
        game.units.push(unit);
        game.playerBase.spawnQueue.shift();
    },

    drawBase: function() {
        if (!this.playerBase) return;

        // Получаем экранные координаты базы
        const screenX = this.playerBase.x * maps.tileSize - this.camera.x;
        const screenY = this.playerBase.y * maps.tileSize - this.camera.y;
        const size = this.playerBase.size * maps.tileSize;
        
        // Проверяем, наведена ли мышь на базу
        const isMouseOver = 
            mouse.x >= screenX && 
            mouse.x <= screenX + size && 
            mouse.y >= screenY && 
            mouse.y <= screenY + size;
            
        // Рисуем полоски только если мышь над базой
        if (isMouseOver) {
            // Полоска здоровья
            const healthBarHeight = 8;
            const healthBarY = screenY - healthBarHeight - 4;
            
            // Фон полоски здоровья
            this.foregroundContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.foregroundContext.fillRect(screenX, healthBarY, size, healthBarHeight);
            
            // Заполнение полоски здоровья
            const healthPercent = this.playerBase.hp / this.playerBase.maxHp;
            const gradient = this.foregroundContext.createLinearGradient(screenX, 0, screenX + size, 0);
            gradient.addColorStop(0, `hsl(${120 * healthPercent}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${120 * healthPercent}, 70%, 40%)`);
            this.foregroundContext.fillStyle = gradient;
            this.foregroundContext.fillRect(screenX, healthBarY, size * healthPercent, healthBarHeight);

            // Полоска прогресса (если есть активный спавн)
            if (this.playerBase.spawnQueue?.length > 0 && this.playerBase.currentSpawn) {
                const progressBarHeight = 6;
                const progressBarY = healthBarY - progressBarHeight - 2;
                const progress = this.playerBase.currentSpawn.progress / this.playerBase.currentSpawn.buildTime;

                // Фон полоски прогресса
                this.foregroundContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.foregroundContext.fillRect(screenX, progressBarY, size, progressBarHeight);

                // Заполнение полоски прогресса
                const progressGradient = this.foregroundContext.createLinearGradient(screenX, 0, screenX + size, 0);
                progressGradient.addColorStop(0, '#3498db');
                progressGradient.addColorStop(1, '#2980b9');
                this.foregroundContext.fillStyle = progressGradient;
                this.foregroundContext.fillRect(screenX, progressBarY, size * progress, progressBarHeight);
            }
        }
    },
};

// Инициализируем игру при загрузке страницы
window.addEventListener('load', () => game.init());

function drawCornerTile(x, y, size, position, baseColor, edgeColor) {
    game.backgroundContext.fillStyle = baseColor;
    game.backgroundContext.fillRect(x, y, size, size);
    
    game.backgroundContext.beginPath();
    game.backgroundContext.strokeStyle = edgeColor;
    game.backgroundContext.lineWidth = 2;
    
    switch(position) {
        case 'top-left':
            game.backgroundContext.moveTo(x + size, y);
            game.backgroundContext.lineTo(x, y);
            game.backgroundContext.lineTo(x, y + size);
            break;
        case 'top-right':
            game.backgroundContext.moveTo(x, y);
            game.backgroundContext.lineTo(x + size, y);
            game.backgroundContext.lineTo(x + size, y + size);
            break;
        case 'bottom-left':
            game.backgroundContext.moveTo(x, y);
            game.backgroundContext.lineTo(x, y + size);
            game.backgroundContext.lineTo(x + size, y + size);
            break;
        case 'bottom-right':
            game.backgroundContext.moveTo(x + size, y);
            game.backgroundContext.lineTo(x + size, y + size);
            game.backgroundContext.lineTo(x, y + size);
            break;
    }
    game.backgroundContext.stroke();
}

function drawEdgeTile(x, y, size, position, baseColor, edgeColor) {
    game.backgroundContext.fillStyle = baseColor;
    game.backgroundContext.fillRect(x, y, size, size);
    
    game.backgroundContext.beginPath();
    game.backgroundContext.strokeStyle = edgeColor;
    game.backgroundContext.lineWidth = 2;
    
    switch(position) {
        case 'top':
            game.backgroundContext.moveTo(x, y);
            game.backgroundContext.lineTo(x + size, y);
            break;
        case 'bottom':
            game.backgroundContext.moveTo(x, y + size);
            game.backgroundContext.lineTo(x + size, y + size);
            break;
        case 'left':
            game.backgroundContext.moveTo(x, y);
            game.backgroundContext.lineTo(x, y + size);
            break;
        case 'right':
            game.backgroundContext.moveTo(x + size, y);
            game.backgroundContext.lineTo(x + size, y + size);
            break;
    }
    game.backgroundContext.stroke();
}

function drawCenterTile(x, y, size, baseColor, edgeColor, pulse, baseStartX, baseStartY) {
    // Рисуем основу
    game.backgroundContext.fillStyle = baseColor;
    game.backgroundContext.fillRect(x, y, size, size);
    
    // Находим центральную точку базы (центр 3x3 сетки)
    const centerX = (baseStartX * size) + (size * 1.5);
    const centerY = (baseStartY * size) + (size * 1.5);
    const coreSize = size * 0.6 * pulse;
    
    // Свечение
    const gradient = game.backgroundContext.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize * 2
    );
    gradient.addColorStop(0, edgeColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    game.backgroundContext.fillStyle = gradient;
    game.backgroundContext.beginPath();
    game.backgroundContext.arc(centerX, centerY, coreSize * 2, 0, Math.PI * 2);
    game.backgroundContext.fill();
    
    // Ядро
    game.backgroundContext.fillStyle = edgeColor;
    game.backgroundContext.beginPath();
    game.backgroundContext.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    game.backgroundContext.fill();
    
    // Энергетические линии от центра к краям
    game.backgroundContext.beginPath();
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        game.backgroundContext.moveTo(centerX, centerY);
        game.backgroundContext.lineTo(
            centerX + Math.cos(angle) * size * 1.5,
            centerY + Math.sin(angle) * size * 1.5
        );
    }
    game.backgroundContext.strokeStyle = `${edgeColor.slice(0, -4)}, ${0.3 * pulse})`;
    game.backgroundContext.lineWidth = 2;
    game.backgroundContext.stroke();
}

// Функция для отрисовки статуса базы
function drawBaseStatus(base) {
    if (!base) return;
    
    const ctx = game.foregroundContext;
    const screenX = base.x * maps.tileSize + game.camera.x;
    const screenY = base.y * maps.tileSize + game.camera.y - 20;
    const width = maps.tileSize * 3; // Ширина базы 3 тайла
    
    // Рисуем полоску здоровья
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(screenX, screenY, width, 8);
    
    // Заполнение полоски здоровья
    const healthWidth = (base.hp / base.maxHp) * width;
    const gradient = ctx.createLinearGradient(screenX, 0, screenX + healthWidth, 0);
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(1, '#27ae60');
    ctx.fillStyle = gradient;
    ctx.fillRect(screenX, screenY, healthWidth, 8);
    
    // Если идет создание юнита, рисуем полоску прогресса
    if (base.currentSpawn) {
        const progress = (Date.now() - base.currentSpawn.startTime) / base.currentSpawn.duration;
        const progressWidth = Math.min(progress, 1) * width;
        
        // Фон полоски прогресса
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX, screenY + 10, width, 6);
        
        // Заполнение полоски прогресса
        const progressGradient = ctx.createLinearGradient(screenX, 0, screenX + progressWidth, 0);
        progressGradient.addColorStop(0, '#3498db');
        progressGradient.addColorStop(1, '#2980b9');
        ctx.fillStyle = progressGradient;
        ctx.fillRect(screenX, screenY + 10, progressWidth, 6);
    }
}

// Функция для добавления юнита в очередь создания
function addUnitToSpawnQueue(unitType) {
    if (!game.playerBase) return;
    
    const spawnTime = 5000; // 5 секунд на создание
    const spawnData = {
        type: unitType,
        startTime: Date.now(),
        duration: spawnTime
    };
    
    if (!game.playerBase.currentSpawn) {
        game.playerBase.currentSpawn = spawnData;
        setTimeout(() => spawnUnit(spawnData), spawnTime);
    } else {
        game.playerBase.spawnQueue.push(spawnData);
    }
}

// Функция создания юнита после задержки
function spawnUnit(spawnData) {
    const base = game.playerBase;
    if (!base) return;
    
    // Создаем юнит справа от базы
    const unit = {
        x: base.x + 3,
        y: base.y + 1,
        type: spawnData.type,
        color: '#4a9eff', // Всегда начинаем с синего
        hp: 100
    };
    
    // Через 5 секунд меняем цвет на зеленый
    if (spawnData.type === 'harvester') {
        setTimeout(() => {
            unit.color = '#2ecc71';
        }, 5000);
    }
    
    game.units.push(unit);
    
    // Очищаем текущее создание
    base.currentSpawn = null;
    
    // Если есть юниты в очереди, начинаем создание следующего
    if (base.spawnQueue.length > 0) {
        base.currentSpawn = base.spawnQueue.shift();
        setTimeout(() => spawnUnit(base.currentSpawn), base.currentSpawn.duration);
    }
}

// Обновляем функцию анимации
function animationLoop() {
    const currentTime = performance.now();
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    // Обновляем очередь спавна
    if (game.playerBase && game.playerBase.spawnQueue.length > 0) {
        const currentSpawn = game.playerBase.spawnQueue[0];
        currentSpawn.progress += deltaTime;
        
        if (currentSpawn.progress >= currentSpawn.buildTime) {
            spawnUnit(currentSpawn);
        }
    }
    
    // ... existing code ...
} 