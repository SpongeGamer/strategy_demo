import { BaseEntity } from '../base-entity.js';

export class Aircraft extends BaseEntity {
    constructor(x, y, type) {
        super(x, y, type, '#9b59b6');
        this.speed = 4;
        this.altitude = 0;
        this.targetX = x;
        this.targetY = y;
    }
}

export const aircraft = {
    types: {
        fighter: {
            name: 'Fighter',
            cost: { metal: 200, gold: 100 },
            buildTime: 25,
            hp: 200,
            speed: 4
        },
        bomber: {
            name: 'Bomber',
            cost: { metal: 300, gold: 150 },
            buildTime: 35,
            hp: 300,
            speed: 3
        },
        transport: {
            name: 'Air Transport',
            cost: { metal: 250, gold: 125 },
            buildTime: 30,
            hp: 250,
            speed: 3.5
        }
    },
    
    create(type, x, y) {
        return new Aircraft(x, y, type);
    }
}; 