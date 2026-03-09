// 才不是你的小麦 - 幻灯片模式

class SlideshowManager {
    constructor() {
        this.photos = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.transitionEffects = ['fade', 'slide', 'zoom', 'flip', 'cube'];
        this.currentEffect = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 幻灯片控制
        document.getElementById('slideshow-prev')?.addEventListener('click', () => this.prev());
        document.getElementById('slideshow-next')?.addEventListener('click', () => this.next());
        document.getElementById('slideshow-play')?.addEventListener('click', () => this.togglePlay());
        document.getElementById('slideshow-close')?.addEventListener('click', () => this.stop());
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            const slideshow = document.getElementById('slideshow-mode');
            if (!slideshow.classList.contains('active')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'Escape':
                    this.stop();
                    break;
            }
        });
    }
    
    start(photos, startIndex = 0) {
        this.photos = photos;
        this.currentIndex = startIndex;
        
        const slideshow = document.getElementById('slideshow-mode');
        slideshow.classList.add('active');
        
        this.showPhoto(this.currentIndex);
        this.startAutoPlay();
    }
    
    stop() {
        const slideshow = document.getElementById('slideshow-mode');
        slideshow.classList.remove('active');
        
        this.stopAutoPlay();
    }
    
    showPhoto(index) {
        if (index < 0) index = this.photos.length - 1;
        if (index >= this.photos.length) index = 0;
        
        this.currentIndex = index;
        
        const img = document.getElementById('slideshow-image');
        const counter = document.getElementById('slideshow-counter');
        
        // 应用转场效果
        this.applyTransition(img, () => {
            img.src = this.photos[index].file_path;
        });
        
        counter.textContent = `${index + 1} / ${this.photos.length}`;
    }
    
    applyTransition(element, callback) {
        const effects = ['fade', 'slide-left', 'zoom', 'rotate'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        element.style.transition = 'all 0.5s ease';
        
        switch(effect) {
            case 'fade':
                element.style.opacity = '0';
                setTimeout(() => {
                    callback();
                    element.style.opacity = '1';
                }, 300);
                break;
            case 'slide-left':
                element.style.transform = 'translateX(-50px)';
                element.style.opacity = '0';
                setTimeout(() => {
                    callback();
                    element.style.transform = 'translateX(50px)';
                    setTimeout(() => {
                        element.style.transform = 'translateX(0)';
                        element.style.opacity = '1';
                    }, 50);
                }, 300);
                break;
            case 'zoom':
                element.style.transform = 'scale(0.8)';
                element.style.opacity = '0';
                setTimeout(() => {
                    callback();
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                        element.style.opacity = '1';
                    }, 200);
                }, 300);
                break;
            case 'rotate':
                element.style.transform = 'rotateY(90deg)';
                element.style.opacity = '0';
                setTimeout(() => {
                    callback();
                    element.style.transform = 'rotateY(-90deg)';
                    setTimeout(() => {
                        element.style.transform = 'rotateY(0)';
                        element.style.opacity = '1';
                    }, 50);
                }, 300);
                break;
            default:
                callback();
        }
    }
    
    next() {
        this.showPhoto(this.currentIndex + 1);
        this.resetAutoPlay();
    }
    
    prev() {
        this.showPhoto(this.currentIndex - 1);
        this.resetAutoPlay();
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }
    
    startAutoPlay() {
        this.isPlaying = true;
        const playBtn = document.getElementById('slideshow-play');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
        
        this.playInterval = setInterval(() => {
            this.next();
        }, 4000);
    }
    
    stopAutoPlay() {
        this.isPlaying = false;
        const playBtn = document.getElementById('slideshow-play');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }
    
    resetAutoPlay() {
        if (this.isPlaying) {
            this.stopAutoPlay();
            this.startAutoPlay();
        }
    }
}

// 初始化
window.slideshowManager = new SlideshowManager();
