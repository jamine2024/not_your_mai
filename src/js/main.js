// 才不是你的小麦 - 主程序

// 检查登录状态
function checkLoginStatus() {
    const loggedIn = sessionStorage.getItem('admin_logged_in');
    const loginTime = sessionStorage.getItem('login_time');
    
    if (loggedIn && loginTime) {
        // 检查是否超过24小时
        const now = Date.now();
        const hoursPassed = (now - parseInt(loginTime)) / (1000 * 60 * 60);
        
        if (hoursPassed > 24) {
            // 超过24小时，需要重新登录
            sessionStorage.removeItem('admin_logged_in');
            sessionStorage.removeItem('login_time');
            return false;
        }
        return true;
    }
    return false;
}

// 更新登录按钮状态
function updateLoginUI() {
    const isLoggedIn = checkLoginStatus();
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadBtn = document.getElementById('upload-btn');
    
    if (isLoggedIn) {
        loginBtn?.classList.add('hidden');
        logoutBtn?.classList.remove('hidden');
        uploadBtn?.classList.add('logged-in');
        uploadBtn?.setAttribute('title', '上传照片');
    } else {
        loginBtn?.classList.remove('hidden');
        logoutBtn?.classList.add('hidden');
        uploadBtn?.classList.remove('logged-in');
        uploadBtn?.setAttribute('title', '上传照片（需登录）');
    }
}

// 导航栏收起/展开功能
function initNavbarToggle() {
    const navbar = document.getElementById('navbar');
    const toggleBtn = document.getElementById('navbar-toggle');
    
    if (!navbar || !toggleBtn) return;
    
    // 从 localStorage 加载保存的状态
    const savedCollapsed = localStorage.getItem('navbarCollapsed');
    if (savedCollapsed === 'true') {
        navbar.classList.add('collapsed');
        document.body.classList.add('navbar-collapsed');
    }
    
    // 点击切换
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = navbar.classList.toggle('collapsed');
        document.body.classList.toggle('navbar-collapsed', isCollapsed);
        
        // 保存状态到 localStorage
        localStorage.setItem('navbarCollapsed', isCollapsed);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航栏收起/展开
    initNavbarToggle();
    
    // 隐藏加载动画
    setTimeout(() => {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.classList.add('hidden');
        }
    }, 1500);
    
    // 更新登录UI
    updateLoginUI();
    
    // 初始化登录按钮
    initLoginButton();
    
    // 初始化上传功能
    initUpload();
    
    // 初始化特效选择
    initEffectSelector();
    
    // 初始化音乐播放器
    initMusicPlayer();
    
    // 初始化AI欢迎语
    initAIWelcome();
    
    // 初始化移动端触摸优化
    initMobileTouch();
    
    // 初始化视图切换
    initViewSwitch();
    
    // 加载照片数据
    loadPhotos();
    
    // 点击波纹效果
    document.addEventListener('click', (e) => {
        if (window.effectsManager && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
            window.effectsManager.createRipple(e.clientX, e.clientY);
        }
    });
});

// 移动端触摸优化
function initMobileTouch() {
    // 检测是否为触摸设备
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        
        // 添加触摸反馈
        const touchElements = document.querySelectorAll('.nav-btn, .action-btn, .photo-card, .effect-card');
        touchElements.forEach(el => {
            el.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            el.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
        
        // 防止双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(e) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }
    
    // 处理屏幕方向变化
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);
    });
}

// 初始化登录按钮
function initLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    loginBtn?.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    logoutBtn?.addEventListener('click', () => {
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('login_time');
        updateLoginUI();
        alert('已退出登录');
    });
}

// 上传功能
function initUpload() {
    const uploadBtn = document.getElementById('upload-btn');
    const uploadModal = document.getElementById('upload-modal');
    const closeUpload = document.getElementById('close-upload');
    const cancelUpload = document.getElementById('cancel-upload');
    const confirmUpload = document.getElementById('confirm-upload');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadPreview = document.getElementById('upload-preview');
    
    let selectedFiles = [];
    
    // 打开上传模态框
    uploadBtn?.addEventListener('click', () => {
        // 检查登录状态
        if (!checkLoginStatus()) {
            alert('请先登录管理员账号才能上传照片');
            window.location.href = 'login.html';
            return;
        }
        uploadModal.classList.add('active');
        selectedFiles = [];
        updatePreview();
    });
    
    // 关闭上传模态框
    const closeModal = () => {
        uploadModal.classList.remove('active');
        selectedFiles = [];
        updatePreview();
    };
    
    closeUpload?.addEventListener('click', closeModal);
    cancelUpload?.addEventListener('click', closeModal);
    
    // 点击上传区域
    uploadArea?.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 拖拽上传
    uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea?.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        selectedFiles = [...selectedFiles, ...files];
        updatePreview();
    });
    
    // 文件选择
    fileInput?.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        selectedFiles = [...selectedFiles, ...files];
        updatePreview();
        fileInput.value = '';
    });
    
    // 更新预览
    function updatePreview() {
        uploadPreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'upload-preview-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-btn" data-index="${index}">×</button>
                `;
                uploadPreview.appendChild(item);
                
                item.querySelector('.remove-btn').addEventListener('click', () => {
                    selectedFiles.splice(index, 1);
                    updatePreview();
                });
            };
            reader.readAsDataURL(file);
        });
        
        confirmUpload.disabled = selectedFiles.length === 0;
    }
    
    // 确认上传
    confirmUpload?.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;
        
        const progressBar = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        progressBar.style.display = 'block';
        confirmUpload.disabled = true;
        
        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });
        
        try {
            const response = await fetch('/api/upload.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast(`成功上传 ${data.count} 张照片`, 'success');
                
                // AI女友提示
                showAIMessage('照片保存好啦！拍得真好看~');
                
                closeModal();
                
                // 刷新相册
                if (window.galleryManager) {
                    window.galleryManager.loadPhotos();
                }
            } else {
                showToast(data.message || '上传失败', 'error');
            }
        } catch (error) {
            console.error('上传错误:', error);
            showToast('上传失败，请重试', 'error');
        } finally {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
            confirmUpload.disabled = false;
        }
    });
}

// 特效选择器
function initEffectSelector() {
    const effectBtn = document.getElementById('effect-btn');
    const effectModal = document.getElementById('effect-modal');
    const closeEffect = document.getElementById('close-effect');
    
    effectBtn?.addEventListener('click', () => {
        effectModal.classList.add('active');
    });
    
    closeEffect?.addEventListener('click', () => {
        effectModal.classList.remove('active');
    });
    
    // 特效卡片点击
    document.querySelectorAll('.effect-card').forEach(card => {
        card.addEventListener('click', () => {
            const effect = card.dataset.effect;
            
            // 更新选中状态
            document.querySelectorAll('.effect-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            // 应用特效
            if (window.effectsManager) {
                window.effectsManager.setEffect(effect);
            }
            
            // 关闭模态框
            effectModal.classList.remove('active');
            
            // 显示提示
            const effectNames = {
                'none': '无特效',
                'dream': '梦幻模式',
                'retro': '复古模式',
                'starry': '星空模式',
                'sakura': '樱花模式',
                'bubble': '泡泡模式',
                'wheat': '麦穗模式',
                'ai': 'AI模式'
            };
            showToast(`已切换到${effectNames[effect]}`, 'success');
        });
    });
}

// 音乐播放器
let currentMusicList = [];
let currentMusicIndex = 0;

function initMusicPlayer() {
    const musicBtn = document.getElementById('music-btn');
    const musicPlayer = document.getElementById('music-player');
    
    let isVisible = false;
    
    musicBtn?.addEventListener('click', () => {
        isVisible = !isVisible;
        musicPlayer.classList.toggle('hidden', !isVisible);
        
        // 如果显示播放器，加载音乐列表
        if (isVisible) {
            loadMusicList();
        }
    });
    
    // 初始化音频播放器
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.addEventListener('ended', playNextMusic);
        // 设置默认音量
        audioPlayer.volume = 0.5;
    }
}

// 从服务器加载音乐列表
async function loadMusicList() {
    try {
        const response = await fetch('api/music.php?action=list');
        const data = await response.json();
        
        if (!data.success) {
            console.error('加载音乐列表失败');
            return;
        }
        
        currentMusicList = data.music || [];
        
        if (currentMusicList.length === 0) {
            console.log('暂无音乐');
            return;
        }
        
        console.log('音乐列表加载成功:', currentMusicList.length, '首');
        
    } catch (error) {
        console.error('加载音乐失败:', error);
    }
}

// 播放指定音乐
function playMusic(index) {
    if (index < 0 || index >= currentMusicList.length) return;
    
    currentMusicIndex = index;
    const music = currentMusicList[index];
    const audioPlayer = document.getElementById('audio-player');
    
    if (audioPlayer) {
        // 先暂停当前播放
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        
        // 设置新音频源
        audioPlayer.src = music.url;
        
        // 播放新音频
        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('播放失败:', error);
            });
        }
    }
    
    // 更新音乐名称
    updateMusicName(music.name);
    
    // 更新播放按钮图标
    updatePlayButtonIcon(true);
}

// 播放下一首
function playNextMusic() {
    if (currentMusicList.length === 0) return;
    
    currentMusicIndex = (currentMusicIndex + 1) % currentMusicList.length;
    playMusic(currentMusicIndex);
}

// 更新播放按钮图标
function updatePlayButtonIcon(isPlaying) {
    const playBtn = document.getElementById('music-play');
    const playBtnCollapsed = document.getElementById('music-play-collapsed');
    const iconHtml = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    
    if (playBtn) {
        playBtn.innerHTML = iconHtml;
    }
    
    if (playBtnCollapsed) {
        playBtnCollapsed.innerHTML = iconHtml;
    }
}

// 播放/暂停
function togglePlay() {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) return;
    
    if (audioPlayer.paused) {
        if (!audioPlayer.src && currentMusicList.length > 0) {
            playMusic(0);
        } else {
            audioPlayer.play().then(() => {
                updatePlayButtonIcon(true);
            }).catch(error => {
                console.error('播放失败:', error);
            });
        }
    } else {
        audioPlayer.pause();
        updatePlayButtonIcon(false);
    }
}

// 音乐播放器收起/展开
let isMusicPlayerCollapsed = false;

function toggleMusicPlayer() {
    const musicPlayer = document.getElementById('music-player');
    const toggleIcon = document.getElementById('music-toggle-icon');
    
    if (!musicPlayer) return;
    
    isMusicPlayerCollapsed = !isMusicPlayerCollapsed;
    
    if (isMusicPlayerCollapsed) {
        musicPlayer.classList.add('collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
        }
    } else {
        musicPlayer.classList.remove('collapsed');
        if (toggleIcon) {
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
        }
    }
}

// 关闭音乐播放器
function closeMusicPlayer() {
    const musicPlayer = document.getElementById('music-player');
    const audioPlayer = document.getElementById('audio-player');
    
    if (musicPlayer) {
        musicPlayer.classList.add('hidden');
        musicPlayer.classList.remove('collapsed');
        isMusicPlayerCollapsed = false;
    }
    
    if (audioPlayer) {
        audioPlayer.pause();
    }
    
    updatePlayButtonIcon(false);
}

// 更新音乐名称（简化版播放器不再需要显示名称）
function updateMusicName(name) {
    // 简化版播放器不显示音乐名称
    console.log('正在播放:', name);
}

// AI欢迎语
function initAIWelcome() {
    const messages = [
        '欢迎回来~ 今天想看点什么呢？',
        '每一天都是新的开始，让我们一起记录美好吧！',
        '你的笑容是我最喜欢的风景~',
        '今天也要元气满满哦！',
        '想和你一起看遍这世间所有美好',
        '有你在的每一天都很特别',
        '让我们一起创造更多回忆吧'
    ];
    
    // 随机显示一条消息
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showAIMessage(randomMessage);
    
    // 5秒后隐藏
    setTimeout(() => {
        const aiWelcome = document.getElementById('ai-welcome');
        if (aiWelcome) {
            aiWelcome.style.opacity = '0';
            aiWelcome.style.transform = 'translateX(100px)';
            setTimeout(() => {
                aiWelcome.style.display = 'none';
            }, 500);
        }
    }, 5000);
}

// 显示AI消息
function showAIMessage(message) {
    const aiText = document.getElementById('ai-text');
    if (aiText) {
        aiText.textContent = message;
        
        // 显示欢迎框
        const aiWelcome = document.getElementById('ai-welcome');
        if (aiWelcome) {
            aiWelcome.style.display = 'flex';
            aiWelcome.style.opacity = '1';
            aiWelcome.style.transform = 'translateX(0)';
        }
    }
}

// 显示提示
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 每日语录更新
function updateDailyQuote() {
    const quotes = [
        '每一天都是新的开始，让我们一起记录美好吧！',
        '你的笑容是我最喜欢的风景~',
        '今天也要元气满满哦！',
        '想和你一起看遍这世间所有美好',
        '有你在的每一天都很特别',
        '让我们一起创造更多回忆吧',
        '生活中的小确幸，值得被记录'
    ];
    
    const quoteText = document.getElementById('quote-text');
    if (quoteText) {
        const today = new Date().getDay();
        quoteText.textContent = quotes[today % quotes.length];
    }
}

// 页面加载时更新语录
updateDailyQuote();

// ==================== 视图切换功能 ====================
let currentView = 'day';
let photosData = [];

function initViewSwitch() {
    const navBtns = document.querySelectorAll('.nav-btn[data-view]');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    // 更新按钮状态
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // 更新视图显示
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    
    currentView = view;
    
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.classList.add('active');
        renderView(view);
    }
}

// 加载照片数据
async function loadPhotos() {
    try {
        const response = await fetch('api/gallery.php?action=list&per_page=99999');
        const data = await response.json();
        
        if (data.success) {
            photosData = data.photos || [];
            updateStats();
            renderView(currentView);
        }
    } catch (error) {
        console.error('加载照片失败:', error);
    }
}

// 更新统计数据
function updateStats() {
    const totalPhotos = photosData.length;
    const totalLikes = photosData.reduce((sum, p) => {
        const likes = p.likes !== null && p.likes !== undefined ? parseInt(p.likes) : 0;
        return sum + likes;
    }, 0);
    
    const uniqueDays = new Set(
        photosData.map(p => {
            if (p.taken_at) {
                return p.taken_at.split(' ')[0];
            } else if (p.uploaded_at) {
                return p.uploaded_at.split(' ')[0];
            }
            return null;
        }).filter(Boolean)
    ).size;
    
    const totalPhotosEl = document.getElementById('total-photos');
    const totalLikesEl = document.getElementById('total-likes');
    const totalDaysEl = document.getElementById('total-days');
    
    if (totalPhotosEl) totalPhotosEl.textContent = totalPhotos;
    if (totalLikesEl) totalLikesEl.textContent = totalLikes;
    if (totalDaysEl) totalDaysEl.textContent = uniqueDays;
}

// 渲染视图
function renderView(view) {
    switch(view) {
        case 'day':
            renderDayView();
            break;
        case 'week':
            renderWeekView();
            break;
        case 'month':
            renderMonthView();
            break;
        case 'memory':
            if (window.memoryManager) {
                window.memoryManager.loadMemoryPhotos();
            }
            break;
    }
}

// 按天视图
function renderDayView() {
    const container = document.getElementById('day-timeline');
    if (!container) return;
    
    if (photosData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>还没有照片，快去上传吧~</p></div>';
        return;
    }
    
    // 按日期分组
    const groups = {};
    photosData.forEach(photo => {
        const date = photo.taken_at?.split(' ')[0] || photo.uploaded_at?.split(' ')[0] || '未知日期';
        if (!groups[date]) groups[date] = [];
        groups[date].push(photo);
    });
    
    // 按日期倒序
    const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));
    
    container.innerHTML = sortedDates.map(date => {
        const photos = groups[date];
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
        
        return `
            <div class="timeline-item">
                <div class="timeline-date">
                    <span class="date-day">${dateObj.getDate()}</span>
                    <span class="date-month">${dateObj.getMonth() + 1}月</span>
                </div>
                <div class="timeline-content">
                    <h4 class="timeline-title">${dateStr}</h4>
                    <div class="photo-grid">
                        ${photos.map(photo => `
                            <div class="photo-card" onclick="openPhotoModal(${photo.id})">
                                <img src="${photo.thumb_path}" alt="${photo.original_name}" loading="lazy">
                                <div class="photo-overlay">
                                    <span class="photo-likes"><i class="fas fa-heart"></i> ${photo.likes || 0}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 按周视图
function renderWeekView() {
    const container = document.getElementById('week-grid');
    if (!container) return;
    
    if (photosData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>还没有照片，快去上传吧~</p></div>';
        return;
    }
    
    // 按周分组
    const weeks = {};
    photosData.forEach(photo => {
        const date = new Date(photo.taken_at || photo.uploaded_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeks[weekKey]) weeks[weekKey] = [];
        weeks[weekKey].push(photo);
    });
    
    const sortedWeeks = Object.keys(weeks).sort((a, b) => new Date(b) - new Date(a));
    
    container.innerHTML = sortedWeeks.map((weekKey, index) => {
        const photos = weeks[weekKey];
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return `
            <div class="week-card">
                <h4 class="week-title">第 ${sortedWeeks.length - index} 周</h4>
                <p class="week-date">${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}</p>
                <div class="week-photos">
                    ${photos.slice(0, 4).map(photo => `
                        <img src="${photo.thumb_path}" alt="" onclick="openPhotoModal(${photo.id})">
                    `).join('')}
                    ${photos.length > 4 ? `<div class="more-photos">+${photos.length - 4}</div>` : ''}
                </div>
                <span class="week-count">${photos.length} 张照片</span>
            </div>
        `;
    }).join('');
}

// 按月视图
function renderMonthView() {
    const container = document.getElementById('month-calendar');
    if (!container) return;
    
    if (photosData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>还没有照片，快去上传吧~</p></div>';
        return;
    }
    
    // 按月分组
    const months = {};
    photosData.forEach(photo => {
        const date = new Date(photo.taken_at || photo.uploaded_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!months[monthKey]) months[monthKey] = [];
        months[monthKey].push(photo);
    });
    
    const sortedMonths = Object.keys(months).sort((a, b) => b.localeCompare(a));
    
    container.innerHTML = sortedMonths.map(monthKey => {
        const photos = months[monthKey];
        const [year, month] = monthKey.split('-');
        const date = new Date(year, month - 1);
        
        return `
            <div class="month-card">
                <h4 class="month-title">${date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</h4>
                <div class="month-grid">
                    ${photos.map(photo => `
                        <div class="month-photo" onclick="openPhotoModal(${photo.id})">
                            <img src="${photo.thumb_path}" alt="">
                        </div>
                    `).join('')}
                </div>
                <span class="month-count">共 ${photos.length} 张</span>
            </div>
        `;
    }).join('');
}

// 打开照片详情
function openPhotoModal(photoId) {
    const photo = photosData.find(p => p.id == photoId);
    if (!photo) return;
    
    const modal = document.getElementById('photo-modal');
    const img = document.getElementById('photo-image');
    const title = document.getElementById('photo-title');
    const date = document.getElementById('photo-date');
    const likes = document.getElementById('photo-likes');
    
    img.src = photo.file_path;
    title.textContent = photo.original_name;
    date.textContent = new Date(photo.taken_at || photo.uploaded_at).toLocaleString('zh-CN');
    likes.textContent = photo.likes || 0;
    
    // 绑定点赞按钮
    const likeBtn = document.getElementById('photo-like');
    likeBtn.onclick = () => toggleLike(photoId);
    
    // 绑定关闭按钮
    document.getElementById('close-photo').onclick = () => {
        modal.classList.remove('active');
    };
    
    // 绑定下载按钮
    const downloadBtn = document.getElementById('photo-download');
    downloadBtn.onclick = () => downloadPhoto(photo.file_path, photo.original_name);
    
    modal.classList.add('active');
}

// 下载照片
function downloadPhoto(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 点赞功能
async function toggleLike(photoId) {
    try {
        const response = await fetch('api/gallery.php?action=like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo_id: photoId })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('photo-likes').textContent = data.likes;
            // 更新本地数据
            const photo = photosData.find(p => p.id == photoId);
            if (photo) photo.likes = data.likes;
            updateStats();
            renderView(currentView);
        }
    } catch (error) {
        console.error('点赞失败:', error);
    }
}



// 切换个人介绍页
let isProfilePageVisible = false;

function toggleProfilePage() {
    const profileView = document.getElementById('profile-view');
    const viewContainer = document.getElementById('view-container');
    const dailyQuote = document.getElementById('daily-quote');
    const statsBar = document.querySelector('.stats-bar');
    const filterTabs = document.querySelector('.filter-tabs');
    
    isProfilePageVisible = !isProfilePageVisible;
    
    if (isProfilePageVisible) {
        // 显示个人介绍页
        profileView.style.display = 'block';
        
        // 隐藏其他内容
        if (dailyQuote) dailyQuote.style.display = 'none';
        if (statsBar) statsBar.style.display = 'none';
        if (filterTabs) filterTabs.style.display = 'none';
        
        // 隐藏当前视图
        document.querySelectorAll('.view').forEach(view => {
            if (view.id !== 'profile-view') {
                view.classList.remove('active');
            }
        });
        
        // 更新个人页统计数据
        document.getElementById('profile-photo-count').textContent = photosData.length;
        const totalLikes = photosData.reduce((sum, p) => sum + (p.likes || 0), 0);
        document.getElementById('profile-like-count').textContent = totalLikes;
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // 返回相册
        profileView.style.display = 'none';
        
        // 显示其他内容
        if (dailyQuote) dailyQuote.style.display = 'block';
        if (statsBar) statsBar.style.display = 'flex';
        if (filterTabs) filterTabs.style.display = 'flex';
        
        // 恢复当前视图
        switchView(currentView);
    }
}

// 个人介绍页功能
function copyQQ() {
    navigator.clipboard.writeText('3889687544').then(() => {
        showToast('QQ号已复制到剪贴板！', 'success');
    }).catch(() => {
        // 降级方案
        const input = document.createElement('input');
        input.value = '3889687544';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('QQ号已复制到剪贴板！', 'success');
    });
}

function addFriend() {
    showToast('添加小麦为好友吧！\nQQ：3889687544', 'info');
}

function sendMessage() {
    showToast('给小麦发消息吧！\nQQ：3889687544', 'info');
}

// 移动端操作菜单功能
let isMobileMenuOpen = false;

function initMobileActionsMenu() {
    const toggleBtn = document.getElementById('mobile-actions-toggle');
    const menu = document.getElementById('mobile-actions-menu');
    const overlay = document.getElementById('mobile-actions-overlay');
    
    if (!toggleBtn || !menu || !overlay) return;
    
    // 切换菜单显示/隐藏
    toggleBtn.addEventListener('click', () => {
        isMobileMenuOpen = !isMobileMenuOpen;
        toggleMobileMenu(isMobileMenuOpen);
    });
    
    // 点击遮罩关闭菜单
    overlay.addEventListener('click', () => {
        isMobileMenuOpen = false;
        toggleMobileMenu(false);
    });
    
    // 移动端操作按钮事件绑定
    initMobileActionButtons();
}

function toggleMobileMenu(show) {
    const toggleBtn = document.getElementById('mobile-actions-toggle');
    const menu = document.getElementById('mobile-actions-menu');
    const overlay = document.getElementById('mobile-actions-overlay');
    
    if (show) {
        toggleBtn.classList.add('active');
        menu.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        toggleBtn.classList.remove('active');
        menu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initMobileActionButtons() {
    // 上传按钮
    const mobileUploadBtn = document.getElementById('mobile-upload-btn');
    mobileUploadBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        // 触发桌面端上传按钮的点击事件
        document.getElementById('upload-btn')?.click();
    });
    
    // 特效按钮
    const mobileEffectBtn = document.getElementById('mobile-effect-btn');
    mobileEffectBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        document.getElementById('effect-btn')?.click();
    });
    
    // 音乐按钮
    const mobileMusicBtn = document.getElementById('mobile-music-btn');
    mobileMusicBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        document.getElementById('music-btn')?.click();
    });
    
    // 登录按钮
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    mobileLoginBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        window.location.href = 'login.html';
    });
    
    // 退出按钮
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    mobileLogoutBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        sessionStorage.removeItem('admin_logged_in');
        sessionStorage.removeItem('login_time');
        updateLoginUI();
        alert('已退出登录');
    });
    
    // 个人主页按钮
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    mobileProfileBtn?.addEventListener('click', () => {
        toggleMobileMenu(false);
        toggleProfilePage();
    });
}

// 更新移动端登录按钮状态
function updateMobileLoginUI() {
    const isLoggedIn = checkLoginStatus();
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    
    if (isLoggedIn) {
        mobileLoginBtn?.classList.add('hidden');
        mobileLogoutBtn?.classList.remove('hidden');
    } else {
        mobileLoginBtn?.classList.remove('hidden');
        mobileLogoutBtn?.classList.add('hidden');
    }
}

// 在DOM加载完成后初始化移动端菜单
document.addEventListener('DOMContentLoaded', () => {
    initMobileActionsMenu();
    updateMobileLoginUI();
});
