export class ResourceLoader {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.totalResources = 0;
        this.loadedResources = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    loadImage(name, src) {
        this.totalResources++;
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images[name] = img;
                this.loadedResources++;
                this.updateProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                console.error(`Ошибка загрузки изображения: ${src}`);
                reject(new Error(`Не удалось загрузить изображение: ${src}`));
            };
            
            img.src = src;
        });
    }

    loadSound(name, src) {
        this.totalResources++;
        
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.oncanplaythrough = () => {
                this.sounds[name] = audio;
                this.loadedResources++;
                this.updateProgress();
                resolve(audio);
            };
            
            audio.onerror = () => {
                console.error(`Ошибка загрузки звука: ${src}`);
                reject(new Error(`Не удалось загрузить звук: ${src}`));
            };
            
            audio.src = src;
        });
    }

    async loadAll(resources) {
        const promises = [];
        
        // Загрузка изображений
        if (resources.images) {
            for (const [name, src] of Object.entries(resources.images)) {
                promises.push(this.loadImage(name, src));
            }
        }
        
        // Загрузка звуков
        if (resources.sounds) {
            for (const [name, src] of Object.entries(resources.sounds)) {
                promises.push(this.loadSound(name, src));
            }
        }
        
        try {
            await Promise.all(promises);
            if (this.onComplete) {
                this.onComplete();
            }
        } catch (error) {
            console.error('Ошибка при загрузке ресурсов:', error);
            throw error;
        }
    }

    updateProgress() {
        const progress = (this.loadedResources / this.totalResources) * 100;
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    getImage(name) {
        return this.images[name];
    }

    getSound(name) {
        return this.sounds[name];
    }

    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    setCompleteCallback(callback) {
        this.onComplete = callback;
    }
}

export const loader = new ResourceLoader(); 