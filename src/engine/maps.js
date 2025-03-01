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
        
        // Создаем сетку, где 0 - проходимая клетка, 1 - непроходимая, 2 - замедляющая (лес)
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        // Создаем сетку тайлов
        this.tiles = Array(this.height).fill().map(() => 
            Array(this.width).fill().map(() => ({ 
                type: TILE_TYPES.GRASS,
                resource: null,
                harvestable: false,
                occupied: false
            }))
        );
        
        // Генерируем ландшафт
        this.generateTerrain();
    }
    
    generateTerrain() {
        console.log('Генерация ландшафта...');
        
        // Сначала определяем позиции баз
        const basePositions = this.getBasePositions();
        
        // Сначала генерируем горы (они не должны перекрываться)
        this.generateMountainRanges();
        
        // Затем генерируем водные объекты
        this.generateRivers();
        this.generateLakes();
        
        // Затем генерируем лес (не на горах и не на воде)
        this.generateForests();
        
        // Убеждаемся, что области баз остались травой
        this.reserveBaseArea(basePositions.player.x, basePositions.player.y, 5);
        this.reserveBaseArea(basePositions.enemy.x, basePositions.enemy.y, 5);
        
        console.log('Ландшафт сгенерирован');
    }
    
    generateForests() {
        // Количество лесных массивов
        const forestCount = Math.max(8, Math.floor(this.width * this.height / 800));
        
        for (let i = 0; i < forestCount; i++) {
            // Выбираем случайное место для центра леса
            const centerX = Math.floor(Math.random() * this.width);
            const centerY = Math.floor(Math.random() * this.height);
            
            // Размер леса
            const forestSize = Math.floor(Math.random() * 10) + 8;
            
            // Создаем лес с неровными краями
            for (let y = centerY - forestSize; y <= centerY + forestSize; y++) {
                for (let x = centerX - forestSize; x <= centerX + forestSize; x++) {
                    // Проверяем, что координаты в пределах карты
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        // Не размещаем лес в воде или горах
                        if (this.tiles[y][x].type === TILE_TYPES.GRASS) {
                            // Вычисляем расстояние от центра леса с небольшим шумом
                            const noise = (Math.random() - 0.5) * forestSize * 0.3;
                            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) + noise;
                            
                            // Вероятность леса уменьшается с удалением от центра
                            if (distance < forestSize * 0.7) {
                                this.tiles[y][x].type = TILE_TYPES.FOREST;
                                this.tiles[y][x].harvestable = true; // Лес можно срубить
                                this.grid[y][x] = 1; // Делаем лес непроходимым
                            } else if (distance < forestSize && Math.random() < 0.5) {
                                this.tiles[y][x].type = TILE_TYPES.FOREST;
                                this.tiles[y][x].harvestable = true; // Лес можно срубить
                                this.grid[y][x] = 1; // Делаем лес непроходимым
                            }
                        }
                    }
                }
            }
        }
        
        // Дополнительно заполняем карту отдельными деревьями
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x].type === TILE_TYPES.GRASS && Math.random() < 0.15) {
                    this.tiles[y][x].type = TILE_TYPES.FOREST;
                    this.tiles[y][x].harvestable = true;
                    this.grid[y][x] = 1;
                }
            }
        }
    }
    
    generateRivers() {
        // Количество рек
        const riverCount = Math.max(3, Math.floor(this.width / 20));
        
        for (let i = 0; i < riverCount; i++) {
            // Выбираем случайную начальную точку на краю карты
            let x, y;
            const side = Math.floor(Math.random() * 4);
            
            switch (side) {
                case 0: // Верхний край
                    x = Math.floor(Math.random() * this.width);
                    y = 0;
                    break;
                case 1: // Правый край
                    x = this.width - 1;
                    y = Math.floor(Math.random() * this.height);
                    break;
                case 2: // Нижний край
                    x = Math.floor(Math.random() * this.width);
                    y = this.height - 1;
                    break;
                case 3: // Левый край
                    x = 0;
                    y = Math.floor(Math.random() * this.height);
                    break;
            }
            
            // Определяем конечную точку (противоположный край)
            let endX, endY;
            switch (side) {
                case 0: // Если начали сверху, идем вниз
                    endX = Math.floor(Math.random() * this.width);
                    endY = this.height - 1;
                    break;
                case 1: // Если начали справа, идем влево
                    endX = 0;
                    endY = Math.floor(Math.random() * this.height);
                    break;
                case 2: // Если начали снизу, идем вверх
                    endX = Math.floor(Math.random() * this.width);
                    endY = 0;
                    break;
                case 3: // Если начали слева, идем вправо
                    endX = this.width - 1;
                    endY = Math.floor(Math.random() * this.height);
                    break;
            }
            
            // Создаем реку с помощью алгоритма случайного блуждания с направлением к цели
            this.createRiver(x, y, endX, endY);
        }
    }
    
    createRiver(startX, startY, endX, endY) {
        let x = startX;
        let y = startY;
        const riverPoints = [{x, y}];
        const maxLength = this.width * 2; // Максимальная длина реки
        
        // Ширина реки (1-3 клетки)
        const riverWidth = Math.floor(Math.random() * 2) + 1;
        
        // Создаем реку с помощью алгоритма случайного блуждания с направлением к цели
        for (let i = 0; i < maxLength; i++) {
            // Вычисляем направление к цели
            const dx = endX - x;
            const dy = endY - y;
            
            // Определяем вероятности движения в разных направлениях
            let probRight = 0.25;
            let probLeft = 0.25;
            let probDown = 0.25;
            let probUp = 0.25;
            
            // Увеличиваем вероятность движения в направлении цели
            if (dx > 0) probRight += 0.3;
            if (dx < 0) probLeft += 0.3;
            if (dy > 0) probDown += 0.3;
            if (dy < 0) probUp += 0.3;
            
            // Нормализуем вероятности
            const total = probRight + probLeft + probDown + probUp;
            probRight /= total;
            probLeft /= total;
            probDown /= total;
            probUp /= total;
            
            // Выбираем направление
            const rand = Math.random();
            let newX = x;
            let newY = y;
            
            if (rand < probRight) {
                newX = x + 1;
            } else if (rand < probRight + probLeft) {
                newX = x - 1;
            } else if (rand < probRight + probLeft + probDown) {
                newY = y + 1;
            } else {
                newY = y - 1;
            }
            
            // Проверяем, что новые координаты в пределах карты
            if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) {
                break;
            }
            
            // Проверяем, не пересекаем ли мы уже существующую реку
            let crossesRiver = false;
            for (const point of riverPoints) {
                if (Math.abs(point.x - newX) <= 1 && Math.abs(point.y - newY) <= 1 && 
                    !(point.x === x && point.y === y)) {
                    crossesRiver = true;
                    break;
                }
            }
            
            if (crossesRiver) {
                // Если пересекаем реку, с некоторой вероятностью останавливаемся
                if (Math.random() < 0.7) {
                    break;
                }
            }
            
            // Обновляем текущие координаты
            x = newX;
            y = newY;
            riverPoints.push({x, y});
            
            // Создаем реку с заданной шириной
            for (let ry = -riverWidth; ry <= riverWidth; ry++) {
                for (let rx = -riverWidth; rx <= riverWidth; rx++) {
                    const riverX = x + rx;
                    const riverY = y + ry;
                    
                    // Проверяем, что координаты в пределах карты
                    if (riverX >= 0 && riverX < this.width && riverY >= 0 && riverY < this.height) {
                        // Не размещаем воду на горах
                        if (this.tiles[riverY][riverX].type !== TILE_TYPES.MOUNTAIN) {
                            // Вероятность воды уменьшается с удалением от центра реки
                            const distance = Math.sqrt(rx*rx + ry*ry);
                            if (distance <= riverWidth * 0.8) {
                                this.tiles[riverY][riverX].type = TILE_TYPES.WATER;
                                this.grid[riverY][riverX] = 2; // Вода - проходима только для специальных юнитов
                            } else if (distance <= riverWidth && Math.random() < 0.5) {
                                this.tiles[riverY][riverX].type = TILE_TYPES.WATER;
                                this.grid[riverY][riverX] = 2; // Вода - проходима только для специальных юнитов
                            }
                        }
                    }
                }
            }
            
            // Если достигли цели, останавливаемся
            if ((Math.abs(x - endX) <= 3 && Math.abs(y - endY) <= 3) || 
                (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1)) {
                break;
            }
        }
    }
    
    generateLakes() {
        // Количество озер
        const lakeCount = Math.max(3, Math.floor(this.width * this.height / 3000));
        
        for (let i = 0; i < lakeCount; i++) {
            // Выбираем случайное место для озера (не слишком близко к краю)
            const centerX = Math.floor(Math.random() * (this.width - 20)) + 10;
            const centerY = Math.floor(Math.random() * (this.height - 20)) + 10;
            
            // Размер озера (уменьшаем максимальный размер)
            const lakeSize = Math.floor(Math.random() * 4) + 3;
            
            // Создаем озеро с неровными краями
            for (let y = centerY - lakeSize; y <= centerY + lakeSize; y++) {
                for (let x = centerX - lakeSize; x <= centerX + lakeSize; x++) {
                    // Проверяем, что координаты в пределах карты
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        // Не размещаем воду на горах
                        if (this.tiles[y][x].type !== TILE_TYPES.MOUNTAIN) {
                            // Вычисляем расстояние от центра озера с небольшим шумом
                            const noise = (Math.random() - 0.5) * lakeSize * 0.3;
                            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) + noise;
                            
                            // Вероятность воды уменьшается с удалением от центра
                            if (distance < lakeSize * 0.7) {
                                this.tiles[y][x].type = TILE_TYPES.WATER;
                                this.grid[y][x] = 2; // Вода - проходима только для специальных юнитов
                            } else if (distance < lakeSize && Math.random() < 0.4) {
                                this.tiles[y][x].type = TILE_TYPES.WATER;
                                this.grid[y][x] = 2; // Вода - проходима только для специальных юнитов
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateMountainRanges() {
        // Количество горных цепей
        const rangeCount = Math.max(3, Math.floor(this.width * this.height / 2500));
        
        for (let i = 0; i < rangeCount; i++) {
            // Выбираем случайную начальную точку для горной цепи
            const startX = Math.floor(Math.random() * this.width);
            const startY = Math.floor(Math.random() * this.height);
            
            // Длина горной цепи
            const rangeLength = Math.floor(Math.random() * 10) + 8;
            
            // Создаем горную цепь
            let x = startX;
            let y = startY;
            
            for (let j = 0; j < rangeLength; j++) {
                // Проверяем, что координаты в пределах карты
                if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                    break;
                }
                
                // Размер горы
                const mountainSize = Math.floor(Math.random() * 2) + 2;
                
                // Создаем гору
                for (let my = -mountainSize; my <= mountainSize; my++) {
                    for (let mx = -mountainSize; mx <= mountainSize; mx++) {
                        const mountainX = x + mx;
                        const mountainY = y + my;
                        
                        // Проверяем, что координаты в пределах карты
                        if (mountainX >= 0 && mountainX < this.width && 
                            mountainY >= 0 && mountainY < this.height) {
                            // Вычисляем расстояние от центра горы
                            const distance = Math.sqrt(mx*mx + my*my);
                            
                            // Вероятность горы уменьшается с удалением от центра
                            if (distance < mountainSize * 0.8) {
                                this.tiles[mountainY][mountainX].type = TILE_TYPES.MOUNTAIN;
                                this.grid[mountainY][mountainX] = 1; // Непроходимая клетка
                            } else if (distance < mountainSize && Math.random() < 0.5) {
                                this.tiles[mountainY][mountainX].type = TILE_TYPES.MOUNTAIN;
                                this.grid[mountainY][mountainX] = 1; // Непроходимая клетка
                            }
                        }
                    }
                }
                
                // Выбираем следующее направление с небольшим уклоном в одну сторону
                const direction = Math.random();
                if (direction < 0.4) {
                    x += 1; // Вправо с большей вероятностью
                } else if (direction < 0.6) {
                    x -= 1; // Влево с меньшей вероятностью
                } else if (direction < 0.8) {
                    y += 1; // Вниз
                } else {
                    y -= 1; // Вверх
                }
            }
        }
    }
    
    // Метод для вырубки леса
    harvestForest(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        const tile = this.tiles[y][x];
        if (tile.type === TILE_TYPES.FOREST && tile.harvestable) {
            tile.type = TILE_TYPES.GRASS;
            tile.harvestable = false;
            this.grid[y][x] = 0; // Делаем клетку проходимой
            return true;
        }
        
        return false;
    }
    
    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        return this.grid[y][x] === 0;
    }
    
    // Проверяет, может ли юнит пройти через клетку (включая специальные юниты)
    canUnitPass(x, y, unitType) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        // Обычные юниты могут ходить только по проходимым клеткам
        if (this.grid[y][x] === 0) {
            return true;
        }
        
        // Водные юниты могут проходить через воду
        if (this.grid[y][x] === 2 && unitType === 'water') {
            return true;
        }
        
        // Летающие юниты могут проходить через воду и лес, но не через горы
        if (this.grid[y][x] === 2 && unitType === 'air') {
            return true;
        }
        
        return false;
    }
    
    getGrid() {
        return this.grid;
    }
    
    // Проверяет, можно ли разместить базу в указанной позиции
    canPlaceBase(x, y, radius) {
        // Проверяем, что позиция находится в пределах карты
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        // Проверяем, что в радиусе базы нет воды, гор или леса
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                
                // Проверяем, что координаты в пределах карты
                if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
                    // Проверяем, что тайл не является водой, горой или лесом
                    const tileType = this.tiles[tileY][tileX].type;
                    if (tileType === TILE_TYPES.WATER || tileType === TILE_TYPES.MOUNTAIN || tileType === TILE_TYPES.FOREST) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Находит подходящее место для базы
    findBaseLocation(minDistanceFromEdge = 10) {
        // Максимальное количество попыток найти подходящее место
        const maxAttempts = 100;
        const baseRadius = 3; // Радиус базы
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Выбираем случайную позицию (не слишком близко к краю)
            const x = Math.floor(Math.random() * (this.width - 2 * minDistanceFromEdge)) + minDistanceFromEdge;
            const y = Math.floor(Math.random() * (this.height - 2 * minDistanceFromEdge)) + minDistanceFromEdge;
            
            // Проверяем, можно ли разместить базу в этой позиции
            if (this.canPlaceBase(x, y, baseRadius)) {
                return { x, y };
            }
        }
        
        console.warn('Не удалось найти подходящее место для базы после', maxAttempts, 'попыток');
        
        // Если не удалось найти подходящее место, возвращаем позицию в центре карты
        return { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
    }
    
    renderMap(map) {
        console.log('Отрисовка карты...');
        
        // Создаем контейнер для карты, если его еще нет
        let mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            mapContainer = document.createElement('div');
            mapContainer.id = 'map-container';
            document.getElementById('gameinterfacescreen').appendChild(mapContainer);
        }
        
        // Очищаем контейнер
        mapContainer.innerHTML = '';
        
        // Отрисовываем каждый тайл
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                
                // Создаем элемент тайла
                const tileElement = document.createElement('div');
                tileElement.className = `tile tile-${tile.type}`;
                tileElement.dataset.x = x;
                tileElement.dataset.y = y;
                tileElement.dataset.type = tile.type;
                
                // Устанавливаем позицию тайла
                tileElement.style.left = `${x * TILE_SIZE}px`;
                tileElement.style.top = `${y * TILE_SIZE}px`;
                tileElement.style.width = `${TILE_SIZE}px`;
                tileElement.style.height = `${TILE_SIZE}px`;
                
                // Добавляем тайл в контейнер
                mapContainer.appendChild(tileElement);
                
                // Для лесных тайлов добавляем дерево
                if (tile.type === TILE_TYPES.FOREST) {
                    const treeElement = document.createElement('div');
                    treeElement.className = 'tree';
                    tileElement.appendChild(treeElement);
                }
                
                // Для горных тайлов не нужно добавлять дополнительные элементы,
                // так как они стилизуются через CSS ::after
            }
        }
        
        console.log('Карта отрисована');
    }
    
    // Резервирует область для базы, чтобы она не была перезаписана другими тайлами
    reserveBaseArea(x, y, radius) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tileX = x + dx;
                const tileY = y + dy;
                
                // Проверяем, что координаты в пределах карты
                if (tileX >= 0 && tileX < this.width && tileY >= 0 && tileY < this.height) {
                    // Отмечаем тайл как зарезервированный для базы
                    this.tiles[tileY][tileX].reserved = true;
                    
                    // Устанавливаем тип тайла как трава (для базы)
                    this.tiles[tileY][tileX].type = TILE_TYPES.GRASS;
                    this.grid[tileY][tileX] = 0; // Проходимая клетка
                }
            }
        }
    }
    
    // Определяет фиксированные позиции для баз
    getBasePositions() {
        // Отступ от края карты
        const margin = Math.floor(this.width * 0.15);
        
        // Позиция базы игрока (левый верхний угол с отступом)
        const playerBaseX = margin;
        const playerBaseY = margin;
        
        // Позиция вражеской базы (правый нижний угол с отступом)
        const enemyBaseX = this.width - margin;
        const enemyBaseY = this.height - margin;
        
        // Резервируем области для баз
        this.reserveBaseArea(playerBaseX, playerBaseY, 5);
        this.reserveBaseArea(enemyBaseX, enemyBaseY, 5);
        
        return {
            player: { x: playerBaseX, y: playerBaseY },
            enemy: { x: enemyBaseX, y: enemyBaseY }
        };
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
        // Количество лесных массивов
        const forestCount = Math.max(8, Math.floor(map.width * map.height / 800));
        
        for (let i = 0; i < forestCount; i++) {
            // Выбираем случайное место для центра леса
            const centerX = Math.floor(Math.random() * map.width);
            const centerY = Math.floor(Math.random() * map.height);
            
            // Размер леса
            const forestSize = Math.floor(Math.random() * 10) + 8;
            
            // Создаем лес с неровными краями
            for (let y = centerY - forestSize; y <= centerY + forestSize; y++) {
                for (let x = centerX - forestSize; x <= centerX + forestSize; x++) {
                    // Проверяем, что координаты в пределах карты
                    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
                        // Не размещаем лес в воде или горах
                        if (map.tiles[y][x].type === TILE_TYPES.GRASS) {
                            // Вычисляем расстояние от центра леса с небольшим шумом
                            const noise = (Math.random() - 0.5) * forestSize * 0.3;
                            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) + noise;
                            
                            // Вероятность леса уменьшается с удалением от центра
                            if (distance < forestSize * 0.7) {
                                map.tiles[y][x].type = TILE_TYPES.FOREST;
                            }
                        }
                    }
                }
            }
        }
        
        // Дополнительно заполняем карту отдельными деревьями
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.tiles[y][x].type === TILE_TYPES.GRASS && Math.random() < 0.15) {
                    map.tiles[y][x].type = TILE_TYPES.FOREST;
                }
            }
        }
    },
    
    // Отрисовка карты
    renderMap(map) {
        console.log('Отрисовка карты...');
        
        // Создаем контейнер для карты, если его еще нет
        let mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
            mapContainer = document.createElement('div');
            mapContainer.id = 'map-container';
            document.getElementById('gameinterfacescreen').appendChild(mapContainer);
        }
        
        // Очищаем контейнер
        mapContainer.innerHTML = '';
        
        // Отрисовываем каждый тайл
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tile = map.tiles[y][x];
                
                // Создаем элемент тайла
                const tileElement = document.createElement('div');
                tileElement.className = `tile tile-${tile.type}`;
                tileElement.dataset.x = x;
                tileElement.dataset.y = y;
                tileElement.dataset.type = tile.type;
                
                // Устанавливаем позицию тайла
                tileElement.style.left = `${x * TILE_SIZE}px`;
                tileElement.style.top = `${y * TILE_SIZE}px`;
                tileElement.style.width = `${TILE_SIZE}px`;
                tileElement.style.height = `${TILE_SIZE}px`;
                
                // Добавляем тайл в контейнер
                mapContainer.appendChild(tileElement);
                
                // Для лесных тайлов добавляем дерево
                if (tile.type === TILE_TYPES.FOREST) {
                    const treeElement = document.createElement('div');
                    treeElement.className = 'tree';
                    tileElement.appendChild(treeElement);
                }
                
                // Для горных тайлов не нужно добавлять дополнительные элементы,
                // так как они стилизуются через CSS ::after
            }
        }
        
        console.log('Карта отрисована');
    }
};

// Для обратной совместимости
export const maps = Maps; 