import { game } from './game.js';
import { loader } from './common.js';

export let singleplayer = {
    // Начало одиночной игры
    start: function() {
        console.log('Запуск одиночной игры...');
        
        // Инициализируем все игровые объекты
        game.type = "singleplayer";
        game.team = "blue";

        // Показываем игровой экран
        document.querySelectorAll('.gamelayer').forEach(layer => layer.style.display = 'none');
        const gameInterface = document.getElementById('gameinterfacescreen');
        gameInterface.style.display = 'block';
        gameInterface.classList.add('active');

        // Загружаем первый уровень
        game.loadLevel(1);

        // Начинаем игровой цикл
        game.animationLoop();
    },

    exit: function() {
        // Выход в главное меню
        game.gameOver = true;
        game.paused = true;
        
        // Очищаем все игровые объекты
        game.buildingsList = [];
        game.vehiclesList = [];
        game.aircraftList = [];
        game.terrain = [];
        
        // Показываем стартовый экран
        document.querySelectorAll('.gamelayer').forEach(layer => layer.style.display = 'none');
        document.getElementById('gamestartscreen').style.display = 'flex';
    }
}; 