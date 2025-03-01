import { game } from './game.js';
import { maps } from './maps.js';

export let mouse = {
    x: 0,
    y: 0,
    gridX: 0,
    gridY: 0,
    buttonPressed: false,
    dragSelect: false,
    dragX: 0,
    dragY: 0,

    init: function() {
        let canvas = document.getElementById('gameforegroundcanvas');
        
        canvas.addEventListener('mousemove', mouse.mouseMove, false);
        canvas.addEventListener('mousedown', mouse.mouseDown, false);
        canvas.addEventListener('mouseup', mouse.mouseUp, false);
        
        // Предотвращаем контекстное меню при правом клике
        canvas.addEventListener('contextmenu', (e) => e.preventDefault(), false);
    },

    mouseMove: function(ev) {
        let offset = game.foregroundCanvas.getBoundingClientRect();
        mouse.x = ev.pageX - offset.left;
        mouse.y = ev.pageY - offset.top;

        mouse.gridX = Math.floor((mouse.x - game.camera.x) / maps.tileSize);
        mouse.gridY = Math.floor((mouse.y - game.camera.y) / maps.tileSize);

        if (mouse.buttonPressed) {
            mouse.dragX = mouse.x;
            mouse.dragY = mouse.y;
            mouse.dragSelect = true;
        }
    },

    mouseDown: function(ev) {
        mouse.buttonPressed = true;
        mouse.dragX = mouse.x;
        mouse.dragY = mouse.y;
    },

    mouseUp: function(ev) {
        mouse.buttonPressed = false;
        mouse.dragSelect = false;
    },

    // Нарисовать область выделения
    draw: function() {
        if (mouse.dragSelect) {
            let x = Math.min(mouse.x, mouse.dragX);
            let y = Math.min(mouse.y, mouse.dragY);
            let width = Math.abs(mouse.x - mouse.dragX);
            let height = Math.abs(mouse.y - mouse.dragY);

            game.foregroundContext.strokeStyle = 'white';
            game.foregroundContext.strokeRect(x, y, width, height);
        }
    }
}; 