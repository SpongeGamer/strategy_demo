export class FogOfWar {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.fogGrid = Array(height).fill().map(() => Array(width).fill(true));
        this.canvas = document.createElement('canvas');
        this.canvas.width = width * tileSize;
        this.canvas.height = height * tileSize;
        this.ctx = this.canvas.getContext('2d');
    }

    update(units, buildings) {
        // Сбрасываем туман
        this.fogGrid = Array(this.height).fill().map(() => Array(this.width).fill(true));
        
        // Обновляем видимость для юнитов
        units.forEach(unit => {
            this.revealArea(unit.x, unit.y, unit.visionRange || 5);
        });
        
        // Обновляем видимость для зданий
        buildings.forEach(building => {
            this.revealArea(building.x, building.y, building.visionRange || 3);
        });
        
        this.draw();
    }
    
    revealArea(centerX, centerY, radius) {
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
                    this.fogGrid[y][x] = false;
                }
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.fogGrid[y][x]) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }
    
    isVisible(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        
        return !this.fogGrid[gridY][gridX];
    }
    
    getCanvas() {
        return this.canvas;
    }
} 