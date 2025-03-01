import { game } from './game.js';
import { Maps, TILE_SIZE } from './maps.js';

export const Mouse = {
    x: 0,
    y: 0,
    leftButtonDown: false,
    rightButtonDown: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragEndX: 0,
    dragEndY: 0,
    selectedArea: null,
    initialized: false, // Флаг инициализации
    
    init() {
        // Проверяем, не инициализированы ли уже обработчики
        if (this.initialized) {
            console.log('Обработчики мыши уже инициализированы');
            return;
        }
        
        console.log('Инициализация обработчиков мыши...');
        
        // Обработка движения мыши
        document.addEventListener('mousemove', (e) => {
            this.x = e.clientX;
            this.y = e.clientY;
            
            if (this.isDragging) {
                this.dragEndX = this.x;
                this.dragEndY = this.y;
                this.updateSelectedArea();
            }
        });
        
        // Обработка нажатия кнопки мыши
        document.addEventListener('mousedown', (e) => {
            console.log('Mouse down:', e.button, e.target.tagName, e.target.id, e.target.className);
            
            // Проверяем, не является ли цель кликом по интерфейсу
            if (this.isInterfaceElement(e.target)) {
                console.log('Клик по интерфейсу, игнорируем');
                return;
            }
            
            // Проверяем, находимся ли мы в игре или в главном меню
            if (!this.isInGame()) {
                console.log('Клик в главном меню, игнорируем выделение области');
                return;
            }
            
            if (e.button === 0) {
                // Левая кнопка мыши
                this.leftButtonDown = true;
                this.dragStartX = this.x;
                this.dragStartY = this.y;
                this.isDragging = true;
                this.createSelectedArea();
            } else if (e.button === 2) {
                // Правая кнопка мыши
                this.rightButtonDown = true;
            }
        });
        
        // Обработка отпускания кнопки мыши
        document.addEventListener('mouseup', (e) => {
            console.log('Mouse up:', e.button, e.target.tagName, e.target.id, e.target.className);
            
            // Проверяем, не является ли цель кликом по интерфейсу
            if (this.isInterfaceElement(e.target)) {
                console.log('Отпускание кнопки на интерфейсе, игнорируем');
                return;
            }
            
            // Проверяем, находимся ли мы в игре или в главном меню
            if (!this.isInGame()) {
                console.log('Отпускание кнопки в главном меню, игнорируем выделение области');
                return;
            }
            
            if (e.button === 0) {
                // Левая кнопка мыши
                this.leftButtonDown = false;
                
                if (this.isDragging) {
                    this.isDragging = false;
                    this.removeSelectedArea();
                    
                    // Определяем, было ли это кликом или выделением области
                    const isDragSelection = 
                        Math.abs(this.dragStartX - this.dragEndX) > 5 || 
                        Math.abs(this.dragStartY - this.dragEndY) > 5;
                    
                    if (isDragSelection) {
                        // Действие при выделении области
                        this.handleAreaSelection();
                    } else {
                        // Действие при клике
                        this.handleClick(this.x, this.y);
                    }
                }
            } else if (e.button === 2) {
                // Правая кнопка мыши
                this.rightButtonDown = false;
                this.handleRightClick(this.x, this.y);
            }
        });
        
        // Отключение контекстного меню по правой кнопке
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        this.initialized = true;
        console.log('Обработчики мыши инициализированы');
    },
    
    // Проверяет, находимся ли мы в игре
    isInGame() {
        // Проверяем, отображается ли игровой интерфейс
        const gameInterface = document.getElementById('gameinterfacescreen');
        if (!gameInterface) return false;
        
        // Проверяем, скрыт ли стартовый экран
        const startScreen = document.getElementById('gamestartscreen');
        if (!startScreen) return false;
        
        return gameInterface.style.display === 'block' && startScreen.style.display === 'none';
    },
    
    // Проверяет, является ли элемент частью интерфейса
    isInterfaceElement(element) {
        // Проверяем, является ли элемент или его родители частью интерфейса
        let current = element;
        while (current) {
            // Проверяем ID и классы элемента
            if (current.id === 'command-panel' || 
                current.id === 'context-menu' || 
                current.id === 'resources' ||
                current.id === 'sidebarbuttons' ||
                current.classList.contains('command-button') ||
                current.classList.contains('context-menu-item')) {
                return true;
            }
            
            // Переходим к родительскому элементу
            current = current.parentElement;
        }
        
        return false;
    },
    
    createSelectedArea() {
        if (!this.selectedArea) {
            this.selectedArea = document.createElement('div');
            this.selectedArea.className = 'selection-area';
            document.body.appendChild(this.selectedArea);
        }
        
        this.updateSelectedArea();
    },
    
    updateSelectedArea() {
        if (!this.selectedArea) return;
        
        const left = Math.min(this.dragStartX, this.dragEndX);
        const top = Math.min(this.dragStartY, this.dragEndY);
        const width = Math.abs(this.dragEndX - this.dragStartX);
        const height = Math.abs(this.dragEndY - this.dragStartY);
        
        this.selectedArea.style.left = `${left}px`;
        this.selectedArea.style.top = `${top}px`;
        this.selectedArea.style.width = `${width}px`;
        this.selectedArea.style.height = `${height}px`;
    },
    
    removeSelectedArea() {
        if (this.selectedArea) {
            this.selectedArea.remove();
            this.selectedArea = null;
        }
    },
    
    handleAreaSelection() {
        console.log(`Выделена область: (${this.dragStartX}, ${this.dragStartY}) - (${this.dragEndX}, ${this.dragEndY})`);
        
        // Здесь будет логика выделения юнитов в заданной области
        // Код зависит от конкретной реализации игры
    },
    
    handleClick(x, y) {
        console.log(`Клик мышью в точке (${x}, ${y})`);
        
        // Здесь будет логика обработки клика мышью
        // Например, выделение юнита или здания
    },
    
    handleRightClick(x, y) {
        console.log(`Правый клик мышью в точке (${x}, ${y})`);
        
        // Здесь будет логика обработки правого клика мышью
        // Например, отправка приказа выбранным юнитам
    },
    
    isOverElement(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            this.x >= rect.left &&
            this.x <= rect.right &&
            this.y >= rect.top &&
            this.y <= rect.bottom
        );
    }
}; 