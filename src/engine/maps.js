import { GameState } from './state.js';

export const TILE_SIZE = 32;

export class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = TILE_SIZE;
        this.grid = [];
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCtx = this.terrainCanvas.getContext('2d');
        
        this.init();
    }
    
    init() {
        console.log(`Создание карты ${this.width}x${this.height}`);
        
        // Создаем сетку, где 0 - проходимая клетка, 1 - непроходимая
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
        
        // Настраиваем канвас для отрисовки ландшафта
        this.terrainCanvas.width = this.width * this.tileSize;
        this.terrainCanvas.height = this.height * this.tileSize;
        
        // Генерируем ландшафт
        this.generateTerrain();
    }
    
    generateTerrain() {
        console.log('Генерация ландшафта...');
        
        // Очищаем канвас
        this.terrainCtx.clearRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);
        
        // Рисуем базовый фон (трава)
        this.terrainCtx.fillStyle = '#4a9e4a';
        this.terrainCtx.fillRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);
        
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
            
            // Рисуем озеро
            this.terrainCtx.fillStyle = '#4a82e5';
            this.drawCircle(lakeX, lakeY, lakeSize);
            
            // Отмечаем непроходимые клетки
            this.markImpassableTiles(lakeX, lakeY, lakeSize);
        }
    }
    
    generateMountains() {
        // Генерируем горы
        const mountainCount = Math.max(1, Math.floor(this.width * this.height / 1500));
        
        for (let i = 0; i < mountainCount; i++) {
            const mountainX = Math.floor(Math.random() * (this.width - 10)) + 5;
            const mountainY = Math.floor(Math.random() * (this.height - 10)) + 5;
            const mountainSize = Math.floor(Math.random() * 8) + 3;
            
            // Рисуем горы
            this.terrainCtx.fillStyle = '#7a7a7a';
            this.drawTriangle(mountainX, mountainY, mountainSize);
            
            // Отмечаем непроходимые клетки
            this.markImpassableTiles(mountainX, mountainY, mountainSize / 2);
        }
    }
    
    generateForests() {
        // Генерируем леса
        const forestCount = Math.max(1, Math.floor(this.width * this.height / 800));
        
        for (let i = 0; i < forestCount; i++) {
            const forestX = Math.floor(Math.random() * (this.width - 15)) + 7;
            const forestY = Math.floor(Math.random() * (this.height - 15)) + 7;
            const forestSize = Math.floor(Math.random() * 12) + 8;
            
            // Рисуем лес
            this.terrainCtx.fillStyle = '#2d7755';
            this.drawIrregularShape(forestX, forestY, forestSize);
            
            // Леса проходимы, но замедляют перемещение, отмечаем в отдельном слое
            // Здесь можно добавить замедление перемещения для юнитов
        }
    }
    
    markImpassableTiles(centerX, centerY, radius) {
        const startX = Math.max(0, Math.floor(centerX - radius));
        const endX = Math.min(this.width - 1, Math.floor(centerX + radius));
        const startY = Math.max(0, Math.floor(centerY - radius));
        const endY = Math.min(this.height - 1, Math.floor(centerY + radius));
        
        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const distance = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                if (distance <= radius) {
                    this.grid[y][x] = 1; // Непроходимая клетка
                }
            }
        }
    }
    
    drawCircle(centerX, centerY, radius) {
        this.terrainCtx.beginPath();
        this.terrainCtx.arc(
            centerX * this.tileSize + this.tileSize / 2,
            centerY * this.tileSize + this.tileSize / 2,
            radius * this.tileSize,
            0,
            Math.PI * 2
        );
        this.terrainCtx.fill();
    }
    
    drawTriangle(centerX, centerY, size) {
        const x = centerX * this.tileSize;
        const y = centerY * this.tileSize;
        const width = size * this.tileSize;
        
        this.terrainCtx.beginPath();
        this.terrainCtx.moveTo(x + width / 2, y);
        this.terrainCtx.lineTo(x, y + width);
        this.terrainCtx.lineTo(x + width, y + width);
        this.terrainCtx.closePath();
        this.terrainCtx.fill();
    }
    
    drawIrregularShape(centerX, centerY, size) {
        const x = centerX * this.tileSize;
        const y = centerY * this.tileSize;
        const radius = size * this.tileSize / 2;
        
        this.terrainCtx.beginPath();
        
        // Создаем неровную форму
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = radius * (0.8 + Math.random() * 0.4);
            const pointX = x + Math.cos(angle) * r;
            const pointY = y + Math.sin(angle) * r;
            
            if (i === 0) {
                this.terrainCtx.moveTo(pointX, pointY);
            } else {
                this.terrainCtx.lineTo(pointX, pointY);
            }
        }
        
        this.terrainCtx.closePath();
        this.terrainCtx.fill();
    }
    
    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        
        return this.grid[y][x] === 0;
    }
    
    getTerrainCanvas() {
        return this.terrainCanvas;
    }
    
    getGrid() {
        return this.grid;
    }
}

export const Maps = {
    currentMap: null,
    
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
    }
}; 