import { GameState } from '../engine/state.js';

export function initMinimap() {
    const canvas = document.getElementById('minimapcanvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры канваса
    canvas.width = 200;
    canvas.height = 200;
    
    // Добавляем обработчики событий
    canvas.addEventListener('click', handleMinimapClick);
    
    // Запускаем обновление миникарты
    requestAnimationFrame(updateMinimap);
}

function updateMinimap() {
    const canvas = document.getElementById('minimapcanvas');
    const ctx = canvas.getContext('2d');
    
    // Очищаем канвас
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовываем все сущности
    GameState.entities.forEach(entity => {
        drawEntityOnMinimap(ctx, entity);
    });
    
    // Продолжаем анимацию
    requestAnimationFrame(updateMinimap);
}

function drawEntityOnMinimap(ctx, entity) {
    // Определяем цвет для разных типов сущностей
    const colors = {
        building: '#4a9eff',
        unit: '#2ecc71',
        resource: '#f1c40f'
    };
    
    // Вычисляем позицию на миникарте
    const x = (entity.x / 100) * ctx.canvas.width;
    const y = (entity.y / 100) * ctx.canvas.height;
    
    // Рисуем точку
    ctx.fillStyle = colors[entity.type] || '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Если сущность выбрана, рисуем вокруг нее обводку
    if (entity === GameState.selectedEntity) {
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function handleMinimapClick(e) {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Преобразуем координаты миникарты в координаты игрового мира
    const worldX = (x / canvas.width) * 100;
    const worldY = (y / canvas.height) * 100;
    
    // Центрируем камеру на выбранной точке
    centerCameraOnPoint(worldX, worldY);
}

function centerCameraOnPoint(x, y) {
    // Здесь будет логика перемещения камеры
    // Нужно будет добавить эту функциональность в game.js
} 