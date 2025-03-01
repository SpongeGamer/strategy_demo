export const GameState = {
    currentMode: null,
    resources: {
        wood: 50,
        metal: 50,
        gold: 20
    },
    entities: [],
    selectedEntity: null,
    
    init() {
        this.updateUI();
    },

    updateResources(type, amount) {
        if (this.resources[type] !== undefined) {
            this.resources[type] = Math.max(0, this.resources[type] + amount);
            this.updateUI();
            return true;
        }
        return false;
    },

    hasEnoughResources(costs) {
        return Object.entries(costs).every(([type, amount]) => 
            this.resources[type] >= amount
        );
    },

    deductResources(costs) {
        if (this.hasEnoughResources(costs)) {
            Object.entries(costs).forEach(([type, amount]) => {
                this.resources[type] -= amount;
            });
            this.updateUI();
            return true;
        }
        return false;
    },

    addEntity(entity) {
        this.entities.push(entity);
    },

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            if (this.selectedEntity === entity) {
                this.selectedEntity = null;
            }
        }
    },

    selectEntity(entity) {
        if (this.selectedEntity) {
            this.selectedEntity.deselect();
        }
        this.selectedEntity = entity;
        if (entity) {
            entity.select();
        }
    },

    updateUI() {
        document.getElementById('trees-count').textContent = this.resources.wood;
        document.getElementById('metal-count').textContent = this.resources.metal;
        document.getElementById('gold-count').textContent = this.resources.gold;
    }
}; 