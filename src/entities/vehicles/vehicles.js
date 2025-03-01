import { BaseEntity } from '../base-entity.js';

export class Vehicle extends BaseEntity {
    constructor(x, y, type) {
        super(x, y, type, '#e74c3c');
        this.speed = 3;
        this.targetX = x;
        this.targetY = y;
    }
}

export const vehicles = {
    types: {
        harvester: {
            name: 'Harvester',
            cost: { metal: 150, gold: 75 },
            buildTime: 20,
            hp: 300,
            speed: 1.5
        },
        tank: {
            name: 'Tank',
            cost: { metal: 300, gold: 150 },
            buildTime: 30,
            hp: 500,
            speed: 1
        },
        transport: {
            name: 'Transport',
            cost: { metal: 200, gold: 100 },
            buildTime: 25,
            hp: 400,
            speed: 2
        }
    },
    
    create(type, x, y) {
        return new Vehicle(x, y, type);
    }
}; 