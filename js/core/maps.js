export let maps = {
    // Размеры карты
    mapSize: { width: 100, height: 100 },
    tileSize: 32,

    // Базовая карта
    level1: {
        name: "Первая миссия",
        terrain: [],
        resources: {
            trees: { count: 80, minDistance: 2 },
            metal: { count: 40, minDistance: 3 },
            gold: { count: 20, minDistance: 4 }
        },
        startPosition: { x: 5, y: 5 },
        enemyBase: { x: 80, y: 80 }
    },

    // Инициализация карты
    initialize: function(levelNumber) {
        var level = maps['level' + levelNumber];
        if (!level) {
            console.error('Уровень не найден:', levelNumber);
            return;
        }

        // Создаем пустую карту
        let terrain = new Array(maps.mapSize.height);
        for (var y = 0; y < maps.mapSize.height; y++) {
            terrain[y] = new Array(maps.mapSize.width).fill(0);
        }

        // Генерируем ресурсы
        this.generateResources(terrain, level.resources);

        // Создаем базы
        this.createBase(terrain, level.startPosition, 'player');
        this.createBase(terrain, level.enemyBase, 'enemy');

        return terrain;
    },

    // Генерация ресурсов
    generateResources: function(terrain, resources) {
        Object.entries(resources).forEach(([type, settings]) => {
            let placed = 0;
            let attempts = 0;
            const maxAttempts = settings.count * 3;

            while (placed < settings.count && attempts < maxAttempts) {
                const x = Math.floor(Math.random() * (maps.mapSize.width - 4)) + 2;
                const y = Math.floor(Math.random() * (maps.mapSize.height - 4)) + 2;

                if (this.canPlaceResource(terrain, x, y, settings.minDistance)) {
                    terrain[y][x] = type;
                    placed++;
                }
                attempts++;
            }
        });
    },

    // Проверка возможности размещения ресурса
    canPlaceResource: function(terrain, x, y, minDistance) {
        // Проверяем границы
        if (x < 2 || x >= maps.mapSize.width - 2 || y < 2 || y >= maps.mapSize.height - 2) {
            return false;
        }

        // Проверяем минимальное расстояние до других объектов
        for (let dy = -minDistance; dy <= minDistance; dy++) {
            for (let dx = -minDistance; dx <= minDistance; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                if (checkX >= 0 && checkX < maps.mapSize.width && 
                    checkY >= 0 && checkY < maps.mapSize.height &&
                    terrain[checkY][checkX] !== 0) {
                    return false;
                }
            }
        }

        return true;
    },

    // Создание базы
    createBase: function(terrain, position, owner) {
        const baseSize = 3;
        for (let y = position.y; y < position.y + baseSize; y++) {
            for (let x = position.x; x < position.x + baseSize; x++) {
                if (x >= 0 && x < maps.mapSize.width && y >= 0 && y < maps.mapSize.height) {
                    terrain[y][x] = owner + '_base';
                }
            }
        }
    }
}; 