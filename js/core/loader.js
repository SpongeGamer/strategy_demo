export let loader = {
    loaded: false,
    loadedCount: 0, // Количество загруженных файлов
    totalCount: 0, // Общее количество файлов для загрузки
    
    init: function() {
        // Проверяем поддержку звуковых форматов
        var mp3Support, oggSupport;
        var audio = document.createElement('audio');
        if (audio.canPlayType) {
            // Проверяем поддержку MP3
            mp3Support = "" != audio.canPlayType('audio/mpeg');
            // Проверяем поддержку OGG
            oggSupport = "" != audio.canPlayType('audio/ogg; codecs="vorbis"');
        }

        // Устанавливаем расширение аудио файлов в зависимости от поддержки браузера
        loader.soundFileExtn = oggSupport ? ".ogg" : mp3Support ? ".mp3" : undefined;
    },
    
    loadImage: function(url) {
        this.totalCount++;
        
        var image = new Image();
        image.addEventListener("load", loader.itemLoaded, false);
        image.src = url;
        return image;
    },
    
    soundFileExtn: ".ogg",
    
    loadSound: function(url) {
        this.totalCount++;

        var audio = new Audio();
        audio.addEventListener("canplaythrough", loader.itemLoaded, false);
        audio.src = url + loader.soundFileExtn;
        return audio;
    },
    
    itemLoaded: function(ev) {
        // Увеличиваем счетчик загруженных элементов
        loader.loadedCount++;

        // Обновляем индикатор загрузки
        var loadingPercentage = Math.floor(loader.loadedCount/loader.totalCount * 100);
        document.getElementById('loadingmessage').innerHTML = 'Loaded ' + loadingPercentage + '%';

        // Если все элементы загружены, скрываем экран загрузки
        if (loader.loadedCount === loader.totalCount) {
            loader.loaded = true;
            
            // Скрываем экран загрузки
            document.getElementById('loadingscreen').style.display = 'none';

            // Удаляем прослушиватели событий загрузки
            if (loader.onload) {
                loader.onload();
                loader.onload = undefined;
            }
        }
    }
}; 