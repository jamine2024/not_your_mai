// 才不是你的小麦 - 回忆页面功能

class MemoryManager {
    constructor() {
        this.photos = [];
        this.randomPhotos = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 视图切换事件
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view === 'memory') {
                    this.loadMemoryPhotos();
                }
            });
        });
    }

    async loadMemoryPhotos() {
        try {
            // 加载所有照片
            const response = await fetch('api/gallery.php?action=list&per_page=99999');
            const data = await response.json();

            if (data.success) {
                this.photos = data.photos || [];
                this.randomPhotos = this.getRandomPhotos(100);
                this.renderPhotoWall();
                this.autoPlayMusic();
            }
        } catch (error) {
            console.error('加载照片失败:', error);
        }
    }

    getRandomPhotos(count) {
        const shuffled = [...this.photos].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    renderPhotoWall() {
        const container = document.getElementById('memory-photo-wall');
        if (!container) return;

        container.innerHTML = '';

        if (this.randomPhotos.length === 0) {
            container.innerHTML = '<div class="memory-loading">暂无照片</div>';
            return;
        }

        this.randomPhotos.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'memory-photo-item';
            photoItem.style.animationDelay = `${index * 0.05}s`;
            photoItem.innerHTML = `
                <img src="${photo.thumb_path || photo.file_path}" alt="${photo.original_name || '未命名'}" loading="lazy">
            `;

            // 点击事件
            photoItem.addEventListener('click', () => {
                this.openPreview(photo);
            });

            container.appendChild(photoItem);
        });
    }

    openPreview(photo) {
        // 创建预览遮罩
        let overlay = document.getElementById('memory-preview-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'memory-preview-overlay';
            overlay.className = 'memory-preview-overlay';
            overlay.innerHTML = `
                <div class="memory-preview-content">
                    <button class="memory-preview-close">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="" alt="">
                </div>
            `;
            document.body.appendChild(overlay);

            // 关闭事件
            overlay.querySelector('.memory-preview-close').addEventListener('click', () => {
                overlay.classList.remove('active');
            });

            // 点击遮罩关闭
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });

            // 键盘关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    overlay.classList.remove('active');
                }
            });
        }

        // 设置图片源
        overlay.querySelector('img').src = photo.file_path;
        overlay.querySelector('img').alt = photo.original_name || '未命名';

        // 显示预览
        overlay.classList.add('active');
    }

    autoPlayMusic() {
        // 检查是否有音乐
        if (typeof currentMusicList !== 'undefined' && currentMusicList.length > 0) {
            // 随机选择一首音乐播放
            const randomIndex = Math.floor(Math.random() * currentMusicList.length);
            playMusic(randomIndex);
        } else {
            // 尝试加载音乐列表
            loadMusicList().then(() => {
                if (currentMusicList.length > 0) {
                    const randomIndex = Math.floor(Math.random() * currentMusicList.length);
                    playMusic(randomIndex);
                }
            });
        }
    }
}

// 初始化
window.memoryManager = new MemoryManager();

// 当回忆页面被激活时加载照片
function switchToMemoryView() {
    if (window.memoryManager) {
        window.memoryManager.loadMemoryPhotos();
    }
}