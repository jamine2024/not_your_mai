// 才不是你的小麦 - 回忆页面功能

// 从 thumb_path 推导原图路径
// thumb: uploads/thumbs/thumb_xxx.jpg -> orig: uploads/original/xxx.jpg
function deriveOriginalPath(thumbPath) {
    if (!thumbPath) return '';
    return thumbPath.replace(/^uploads\/thumbs\/thumb_/, 'uploads/original/');
}

class MemoryManager {
    constructor() {
        this.photos = [];
        this.rowCount = 5; // 行数
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createParticles();
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

    // 创建粒子背景
    createParticles() {
        const container = document.getElementById('memory-particles');
        if (!container) return;

        const particleCount = 30;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'memory-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
    }

    async loadMemoryPhotos() {
        // 优先加载音乐
        if (typeof loadMusicList === 'function') {
            await loadMusicList();
        }

        // 立即尝试自动播放音乐
        this.autoPlayMusic();

        try {
            // 加载所有照片
            const response = await fetch('api/gallery.php?action=list&per_page=99999');
            const data = await response.json();

            if (data.success) {
                this.photos = data.photos || [];
                this.renderPhotoWall();
            }
        } catch (error) {
            console.error('加载照片失败:', error);
        }
    }

    // 渲染照片墙 - 参考手机销售页面实现
    renderPhotoWall() {
        const container = document.getElementById('memory-photo-wall');
        if (!container) return;

        container.innerHTML = '';

        if (this.photos.length === 0) {
            container.innerHTML = '<div class="memory-loading">暂无照片</div>';
            return;
        }

        // 计算需要的行数 - 增加到10排，防止大屏底部空白
        const vh = window.innerHeight || document.documentElement.clientHeight || 800;
        const tileH = 160;
        const gap = 12;
        const rows = Math.max(10, Math.ceil(vh / (tileH + gap)));
        
        // 将照片分配给各行
        const chunkSize = Math.ceil(this.photos.length / rows);
        
        for (let r = 0; r < rows; r++) {
            // 获取该行的照片列表
            let list = this.photos.slice(r * chunkSize, (r + 1) * chunkSize);
            if (list.length === 0) {
                list = this.photos.slice(0, chunkSize);
            }

            const rowDiv = document.createElement('div');
            rowDiv.className = 'photo-row';

            // 创建照片元素
            for (let i = 0; i < list.length; i++) {
                const photo = list[i];
                const tile = document.createElement('div');
                tile.className = 'memory-photo-item';
                
                const img = document.createElement('img');
                img.src = photo.thumb_path || photo.file_path;
                img.alt = photo.original_name || '未命名';
                img.loading = 'lazy';
                
                tile.appendChild(img);
                
                // 点击事件
                tile.addEventListener('click', () => {
                    this.openPreview(photo);
                });
                
                rowDiv.appendChild(tile);
            }

            // 克隆一份以实现无缝滚动
            for (let i = 0; i < list.length; i++) {
                const photo = list[i];
                const tile = document.createElement('div');
                tile.className = 'memory-photo-item';
                
                const img = document.createElement('img');
                img.src = photo.thumb_path || photo.file_path;
                img.alt = photo.original_name || '未命名';
                img.loading = 'lazy';
                
                tile.appendChild(img);
                
                // 点击事件
                tile.addEventListener('click', () => {
                    this.openPreview(photo);
                });
                
                rowDiv.appendChild(tile);
            }

            container.appendChild(rowDiv);
        }
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

        // 设置图片源（优先原图，否则从 thumb_path 推导）
        overlay.querySelector('img').src = photo.file_path || deriveOriginalPath(photo.thumb_path);
        overlay.querySelector('img').alt = photo.original_name || '未命名';

        // 显示预览
        overlay.classList.add('active');
    }

    autoPlayMusic() {
        // 显示音乐播放器
        const musicPlayer = document.getElementById('music-player');
        if (musicPlayer) {
            musicPlayer.classList.remove('hidden');
        }

        // 检查是否有音乐
        if (typeof currentMusicList !== 'undefined' && currentMusicList.length > 0) {
            // 随机选择一首音乐播放
            const randomIndex = Math.floor(Math.random() * currentMusicList.length);
            // 延迟一点播放，确保音频元素准备好
            setTimeout(() => {
                playMusic(randomIndex);
            }, 100);
        } else {
            // 尝试加载音乐列表
            if (typeof loadMusicList === 'function') {
                loadMusicList().then(() => {
                    if (currentMusicList.length > 0) {
                        const randomIndex = Math.floor(Math.random() * currentMusicList.length);
                        // 延迟一点播放，确保音频元素准备好
                        setTimeout(() => {
                            playMusic(randomIndex);
                        }, 100);
                    }
                });
            }
        }
    }
}

// 初始化
window.memoryManager = new MemoryManager();

// 当回忆页面被激活时加载照片
function switchToMemoryView() {
    // 先切换视图
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    const memoryView = document.getElementById('memory-view');
    if (memoryView) {
        memoryView.classList.add('active');
    }

    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === 'memory');
    });

    // 更新移动端底部导航按钮状态
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === 'memory');
    });

    // 加载照片和音乐
    if (window.memoryManager) {
        window.memoryManager.loadMemoryPhotos();
    }
}