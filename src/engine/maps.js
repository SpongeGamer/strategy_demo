import { GameState } from './state.js';

export const TILE_SIZE = 32;
export const TILE_TYPES = {
    GRASS: 'grass',
    WATER: 'water',
    MOUNTAIN: 'mountain',
    FOREST: 'forest'
};

export class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = TILE_SIZE;
        this.grid = [];
        this.tiles = [];
        
        this.init();
    }
    
    init() {
        console.log(`Создание карты ${this.width}x${this.height}`);
        
        // Создаем сетку, где 0 - проходимая клетка, 1 - непроходимая
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        // Создаем сетку тайлов
        this.tiles = Array(this.height).fill().map(() => 
            Array(this.width).fill().map(() => ({ type: TILE_TYPES.GRASS }))
        );
        
        // Генерируем ландшафт
        this.generateTerrain();
    }
    
    generateTerrain() {
        console.log('Генерация ландшафта...');
        
        // Генерируем различные элементы ландшафта
        this.generateWater();
        this.generateMountains();
        this.generateForests();
        
        console.log('Ландшафт сгенерирован');
    }
    
    generateWater() {
        // Генерируем озера и реки
        const lakeCount = Math.max(1, Math.floor(this.width * this.height / 1000));
        
        for (let i = 0; i < lakeCount; i++) {
            const lakeX = Math.floor(Math.random() * (this.width - 10)) + 5;
            const lakeY = Math.floor(Math.random() * (this.height - 10)) + 5;
            const lakeSize = Math.floor(Math.random() * 10) + 5;
            
            // Создаем озеро
            for (let y = Math.max(0, lakeY - lakeSize); y < Math.min(this.height, lakeY + lakeSize); y++) {
                for (let x = Math.max(0, lakeX - lakeSize); x < Math.min(this.width, lakeX + lakeSize); x++) {
                    const distance = Math.sqrt(Math.pow(x - lakeX, 2) + Math.pow(y - lakeY, 2));
                    if (distance <= lakeSize) {
                        this.tiles[y][x].type = TILE_TYPES.WATER;
                        this.grid[y][x] = 1; // Непроходимая клетка
                    }
                }
            }
        }
    }
    
    generateMountains() {
        // Генерируем горы
        const mountainCount = Math.max(1, Math.floor(this.width * this.height / 1500));
        
        for (let i = 0; i < mountainCount; i++) {
            const mountainX = Math.floor(Math.random() * (this.width - 10)) + 5;
            const mountainY = Math.floor(Math.random() * (this.height - 10)) + 5;
            const mountainSize = Math.floor(Math.random() * 8) + 3;
            
            // Создаем горы
            for (let y = Math.max(0, mountainY - mountainSize); y < Math.min(this.height, mountainY + mountainSize); y++) {
                for (let x = Math.max(0, mountainX - mountainSize); x < Math.min(this.width, mountainX + mountainSize); x++) {
                    const distance = Math.sqrt(Math.pow(x - mountainX, 2) + Math.pow(y - mountainY, 2));
                    if (distance <= mountainSize / 2) {
                        this.tiles[y][x].type = TILE_TYPES.MOUNTAIN;
                        this.grid[y][x] = 1; // Непроходимая клетка
                    }
                }
            }
        }
    }
    
    generateForests() {
        // Генерируем леса
        const forestCount = Math.max(1, Math.floor(this.width * this.height / 800));
        
        for (let i = 0; i < forestCount; i++) {
            const forestX = Math.floor(Math.random() * (this.width - 15)) + 7;
            const forestY = Math.floor(Math.random() * (this.height - 15)) + 7;
            const forestSize = Math.floor(Math.random() * 12) + 8;
            
            // Создаем лес
            for (let y = Math.max(0, forestY - forestSize); y < Math.min(this.height, forestY + forestSize); y++) {
                for (let x = Math.max(0, forestX - forestSize); x < Math.min(this.width, forestX + forestSize); x++) {
                    const distance = Math.sqrt(Math.pow(x - forestX, 2) + Math.pow(y - forestY, 2));
                    if (distance <= forestSize && this.tiles[y][x].type === TILE_TYPES.GRASS) {
                        this.tiles[y][x].type = TILE_TYPES.FOREST;
                        // Леса проходимы, но замедляют перемещение
                    }
                }
            }
        }
    }
    
    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        return this.grid[y][x] === 0;
    }
    
    getGrid() {
        return this.grid;
    }
}

export const Maps = {
    currentMap: null,
    mapSize: { width: 100, height: 100 },
    tileSize: TILE_SIZE,
    level1: {
        startPosition: { x: 10, y: 10 }
    },
    
    createMap(width, height) {
        console.log(`Создание карты ${width}x${height}`);
        this.currentMap = new Map(width, height);
        return this.currentMap;
    },
    
    getMapForMode(mode, difficulty) {
        let width, height;
        
        switch (mode) {
            case 'skirmish':
                width = 100;
                height = 100;
                break;
            case 'campaign':
                // Разные размеры карт для разных миссий кампании
                width = 120;
                height = 120;
                break;
            default:
                width = 80;
                height = 80;
        }
        
        // Масштабирование карты в зависимости от сложности
        if (difficulty === 'hard') {
            width = Math.floor(width * 1.2);
            height = Math.floor(height * 1.2);
        } else if (difficulty === 'easy') {
            width = Math.floor(width * 0.8);
            height = Math.floor(height * 0.8);
        }
        
        return this.createMap(width, height);
    },
    
    initialize(levelNumber) {
        // Заглушка для инициализации карты
        console.log(`Инициализация карты для уровня ${levelNumber}`);
        return [];
    },
    
    // Генерация воды на карте
    generateWater(map) {
        // Количество озер зависит от размера карты
        const lakeCount = Math.floor(map.width * map.height / 400);
        
        // Создаем озера
        for (let i = 0; i < lakeCount; i++) {
            const centerX = Math.floor(Math.random() * map.width);
            const centerY = Math.floor(Math.random() * map.height);
            const size = 3 + Math.floor(Math.random() * 5); // Размер озера от 3 до 7
            
            // Создаем озеро
            for (let y = centerY - size; y <= centerY + size; y++) {
                for (let x = centerX - size; x <= centerX + size; x++) {
                    // Проверяем, что координаты в пределах карты
                    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                        // Вероятность воды уменьшается с удалением от центра
                        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                        if (distance < size * 0.8 || (distance < size && Math.random() < 0.5)) {
                            map.tiles[y][x].type = TILE_TYPES.WATER;
                        }
                    }
                }
            }
        }
        
        // Создаем реки
        const riverCount = Math.floor(map.width / 20);
        for (let i = 0; i < riverCount; i++) {
            let x, y;
            
            // Выбираем случайную начальную точку на краю карты
            if (Math.random() < 0.5) {
                // Горизонтальный край
                x = Math.floor(Math.random() * map.width);
                y = Math.random() < 0.5 ? 0 : map.height - 1;
            } else {
                // Вертикальный край
                x = Math.random() < 0.5 ? 0 : map.width - 1;
                y = Math.floor(Math.random() * map.height);
            }
            
            // Рисуем реку
            let length = Math.floor(map.width * 0.7);
            while (length > 0) {
                // Проверяем, что координаты в пределах карты
                if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                    map.tiles[y][x].type = TILE_TYPES.WATER;
                    
                    // Расширяем реку
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height && Math.random() < 0.3) {
                                map.tiles[ny][nx].type = TILE_TYPES.WATER;
                            }
                        }
                    }
                    
                    // Выбираем следующее направление
                    const direction = Math.floor(Math.random() * 4);
                    switch (direction) {
                        case 0: x++; break; // Вправо
                        case 1: x--; break; // Влево
                        case 2: y++; break; // Вниз
                        case 3: y--; break; // Вверх
                    }
                } else {
                    break; // Вышли за пределы карты
                }
                
                length--;
            }
        }
    },
    
    // Генерация гор на карте
    generateMountains(map) {
        // Количество горных цепей зависит от размера карты
        const mountainRangeCount = Math.floor(map.width * map.height / 500);
        
        // Создаем горные цепи
        for (let i = 0; i < mountainRangeCount; i++) {
            const startX = Math.floor(Math.random() * map.width);
            const startY = Math.floor(Math.random() * map.height);
            const length = 5 + Math.floor(Math.random() * 10); // Длина цепи от 5 до 14
            
            let x = startX;
            let y = startY;
            
            // Создаем горную цепь
            for (let j = 0; j < length; j++) {
                // Проверяем, что координаты в пределах карты
                if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                    // Не размещаем горы в воде
                    if (map.tiles[y][x].type !== TILE_TYPES.WATER) {
                        map.tiles[y][x].type = TILE_TYPES.MOUNTAIN;
                        
                        // Добавляем горы вокруг
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height && 
                                    map.tiles[ny][nx].type !== TILE_TYPES.WATER && 
                                    Math.random() < 0.4) {
                                    map.tiles[ny][nx].type = TILE_TYPES.MOUNTAIN;
                                }
                            }
                        }
                    }
                    
                    // Выбираем следующее направление
                    const direction = Math.floor(Math.random() * 8);
                    switch (direction) {
                        case 0: x++; break;
                        case 1: x--; break;
                        case 2: y++; break;
                        case 3: y--; break;
                        case 4: x++; y++; break;
                        case 5: x++; y--; break;
                        case 6: x--; y++; break;
                        case 7: x--; y--; break;
                    }
                } else {
                    break; // Вышли за пределы карты
                }
            }
        }
    },
    
    // Генерация лесов на карте
    generateForests(map) {
        // Количество лесных массивов зависит от размера карты
        const forestCount = Math.floor(map.width * map.height / 300);
        
        // Создаем лесные массивы
        for (let i = 0; i < forestCount; i++) {
            const centerX = Math.floor(Math.random() * map.width);
            const centerY = Math.floor(Math.random() * map.height);
            const size = 4 + Math.floor(Math.random() * 6); // Размер леса от 4 до 9
            
            // Создаем лесной массив
            for (let y = centerY - size; y <= centerY + size; y++) {
                for (let x = centerX - size; x <= centerX + size; x++) {
                    // Проверяем, что координаты в пределах карты
                    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                        // Не размещаем лес в воде или горах
                        if (map.tiles[y][x].type === TILE_TYPES.GRASS) {
                            // Вероятность леса уменьшается с удалением от центра
                            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                            if (distance < size * 0.7 || (distance < size && Math.random() < 0.4)) {
                                map.tiles[y][x].type = TILE_TYPES.FOREST;
                            }
                        }
                    }
                }
            }
        }
    },
    
    // Отрисовка карты
    renderMap(map) {
        console.log('Отрисовка карты...');
        
        try {
            // Создаем контейнер для карты
            let mapContainer = document.getElementById('map-container');
            if (!mapContainer) {
                mapContainer = document.createElement('div');
                mapContainer.id = 'map-container';
                mapContainer.style.position = 'absolute';
                mapContainer.style.top = '0';
                mapContainer.style.left = '0';
                mapContainer.style.width = `${map.width * TILE_SIZE}px`;
                mapContainer.style.height = `${map.height * TILE_SIZE}px`;
                
                // Добавляем контейнер на игровой экран
                const gameInterface = document.getElementById('gameinterfacescreen');
                gameInterface.appendChild(mapContainer);
            } else {
                // Очищаем контейнер
                mapContainer.innerHTML = '';
            }
            
            // Эмодзи для разных типов тайлов
            const tileEmojis = {
                [TILE_TYPES.GRASS]: '🟩',
                [TILE_TYPES.WATER]: '🟦',
                [TILE_TYPES.MOUNTAIN]: '⛰️',
                [TILE_TYPES.FOREST]: '🌲'
            };
            
            // Отрисовываем каждый тайл
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    const tile = map.tiles[y][x];
                    
                    // Создаем элемент тайла
                    const tileElement = document.createElement('div');
                    tileElement.className = `tile tile-${tile.type}`;
                    tileElement.style.position = 'absolute';
                    tileElement.style.left = `${x * TILE_SIZE}px`;
                    tileElement.style.top = `${y * TILE_SIZE}px`;
                    tileElement.style.width = `${TILE_SIZE}px`;
                    tileElement.style.height = `${TILE_SIZE}px`;
                    tileElement.style.display = 'flex';
                    tileElement.style.alignItems = 'center';
                    tileElement.style.justifyContent = 'center';
                    tileElement.style.fontSize = `${TILE_SIZE - 4}px`;
                    tileElement.textContent = tileEmojis[tile.type];
                    
                    // Добавляем тайл в контейнер
                    mapContainer.appendChild(tileElement);
                }
            }
            
            console.log('Карта отрисована');
        } catch (error) {
            console.error('Ошибка при отрисовке карты:', error);
        }
    }
};

// Для обратной совместимости
export const maps = Maps; 