export const GameState = {
    currentMode: null,
    resources: {
        wood: 50,
        metal: 100,
        gold: 50,
        energy: 0
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

    hasEnoughResources(cost) {
        if (!cost) return true;
        
        for (const resource in cost) {
            if (this.resources[resource] < cost[resource]) {
                return false;
            }
        }
        
        return true;
    },

    deductResources(cost) {
        if (!cost) return;
        
        for (const resource in cost) {
            this.resources[resource] -= cost[resource];
        }
        
        this.updateUI();
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
        try {
            // Обновляем отображение ресурсов
            const metalElement = document.getElementById('metal-amount');
            const goldElement = document.getElementById('gold-amount');
            const energyElement = document.getElementById('energy-amount');
            
            if (metalElement) metalElement.textContent = this.resources.metal;
            if (goldElement) goldElement.textContent = this.resources.gold;
            if (energyElement) energyElement.textContent = this.resources.energy;
            
            console.log('Обновлены ресурсы:', this.resources);
        } catch (error) {
            console.error('Ошибка при обновлении UI:', error);
        }
    },

    addResources(resources) {
        if (!resources) return;
        
        for (const resource in resources) {
            this.resources[resource] += resources[resource];
        }
        
        this.updateUI();
    },

    updateResourceDisplay() {
        const metalElement = document.getElementById('metal-amount');
        const goldElement = document.getElementById('gold-amount');
        const energyElement = document.getElementById('energy-amount');
        
        if (metalElement) metalElement.textContent = this.resources.metal;
        if (goldElement) goldElement.textContent = this.resources.gold;
        if (energyElement) energyElement.textContent = this.resources.energy;
    },

    reset() {
        this.resources = {
            wood: 50,
            metal: 100,
            gold: 50,
            energy: 0
        };
        
        this.selectedEntity = null;
        this.entities = [];
        
        this.updateUI();
    }
}; 