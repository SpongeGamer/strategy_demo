export class AStar {
    constructor(grid) {
        this.grid = grid;
        this.openSet = [];
        this.closedSet = [];
    }

    findPath(startX, startY, endX, endY) {
        this.openSet = [];
        this.closedSet = [];
        
        const start = { x: startX, y: startY, g: 0, h: 0, f: 0, parent: null };
        const end = { x: endX, y: endY };
        
        start.h = this.heuristic(start, end);
        start.f = start.g + start.h;
        
        this.openSet.push(start);
        
        while (this.openSet.length > 0) {
            let current = this.getLowestF();
            
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(current);
            }
            
            this.removeFromOpenSet(current);
            this.closedSet.push(current);
            
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (this.isInClosedSet(neighbor)) continue;
                
                const tentativeG = current.g + 1;
                
                if (!this.isInOpenSet(neighbor)) {
                    this.openSet.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }
                
                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = this.heuristic(neighbor, end);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        return null;
    }
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getLowestF() {
        let lowest = this.openSet[0];
        for (let i = 1; i < this.openSet.length; i++) {
            if (this.openSet[i].f < lowest.f) {
                lowest = this.openSet[i];
            }
        }
        return lowest;
    }
    
    removeFromOpenSet(node) {
        const index = this.openSet.indexOf(node);
        if (index !== -1) {
            this.openSet.splice(index, 1);
        }
    }
    
    isInOpenSet(node) {
        return this.openSet.some(n => n.x === node.x && n.y === node.y);
    }
    
    isInClosedSet(node) {
        return this.closedSet.some(n => n.x === node.x && n.y === node.y);
    }
    
    getNeighbors(node) {
        const neighbors = [];
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dx, dy] of dirs) {
            const x = node.x + dx;
            const y = node.y + dy;
            
            if (this.isValidPosition(x, y)) {
                neighbors.push({
                    x, y,
                    g: node.g + 1,
                    h: 0,
                    f: 0,
                    parent: null
                });
            }
        }
        
        return neighbors;
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.grid.length &&
               y >= 0 && y < this.grid[0].length &&
               this.grid[x][y] === 0;
    }
    
    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current !== null) {
            path.unshift([current.x, current.y]);
            current = current.parent;
        }
        
        return path;
    }
} 