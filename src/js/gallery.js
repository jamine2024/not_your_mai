// 才不是你的小麦 - 相册功能

class GalleryManager {
    constructor() {
        this.photos = [];
        this.currentView = 'day';
        this.currentDate = new Date();
        this.uploadQueue = [];
        
        this.init();
    }
    
    init() {
        this.loadPhotos();
        this.setupEventListeners();
    }
    
    async loadPhotos() {
        try {
            // 前端加载所有照片，不分页
            const response = await fetch('api/gallery.php?action=list&per_page=99999');
            const data = await response.json();
            
            if (data.success) {
                this.photos = data.photos || [];
                
                this.updateStats();
                this.renderCurrentView();
            }
        } catch (error) {
            console.error('加载照片失败:', error);
            this.showToast('加载照片失败', 'error');
        }
    }
    
    updateStats() {
        const totalPhotos = this.photos.length;
        const totalLikes = this.photos.reduce((sum, p) => sum + (p.likes || 0), 0);
        
        // 计算不同天数
        const dates = new Set();
        this.photos.forEach(p => {
            const date = new Date(p.taken_at || p.uploaded_at);
            dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
        });
        
        document.getElementById('total-photos').textContent = totalPhotos;
        document.getElementById('total-likes').textContent = totalLikes;
        document.getElementById('total-days').textContent = dates.size;
    }
    
    renderCurrentView() {
        switch(this.currentView) {
            case 'day':
                this.renderDayView();
                break;
            case 'ranking':
                this.renderRankingView();
                break;
            case 'memory':
                if (window.memoryManager) {
                    window.memoryManager.loadMemoryPhotos();
                }
                break;
        }
    }
    
    // 按天视图
    renderDayView() {
        const container = document.getElementById('day-timeline');
        container.innerHTML = '';
        
        // 按日期分组
        const grouped = this.groupByDate(this.photos);
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        
        sortedDates.forEach((dateStr, index) => {
            const photos = grouped[dateStr];
            const date = new Date(dateStr);
            
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card bounce-in';
            dayCard.style.animationDelay = `${index * 0.1}s`;
            
            dayCard.innerHTML = `
                <div class="day-header">
                    <div class="day-date">
                        <div class="date-icon">
                            <span class="month">${date.getMonth() + 1}月</span>
                            <span class="day">${date.getDate()}</span>
                        </div>
                        <span class="date-full">${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${this.getWeekday(date)}</span>
                    </div>
                    <div class="day-count">
                        <i class="fas fa-images"></i>
                        <span>${photos.length} 张照片</span>
                    </div>
                </div>
                <div class="day-photos">
                    ${photos.map(photo => this.createPhotoCardHTML(photo)).join('')}
                </div>
            `;
            
            container.appendChild(dayCard);
        });
        
        if (sortedDates.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
        }
        
        this.attachPhotoEvents(container);
    }
    
    // 按周视图
    renderWeekView() {
        const container = document.getElementById('week-grid');
        container.innerHTML = '';
        
        const grouped = this.groupByWeek(this.photos);
        
        Object.entries(grouped).forEach(([weekKey, photos], index) => {
            const weekCard = document.createElement('div');
            weekCard.className = 'week-card slide-up';
            weekCard.style.animationDelay = `${index * 0.1}s`;
            
            const [year, week] = weekKey.split('-W');
            
            weekCard.innerHTML = `
                <div class="week-header">
                    <h3>第 ${week} 周</h3>
                    <span>${year}年</span>
                </div>
                <div class="week-photos">
                    ${photos.slice(0, 9).map(photo => this.createPhotoCardHTML(photo)).join('')}
                </div>
            `;
            
            container.appendChild(weekCard);
        });
        
        if (Object.keys(grouped).length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
        }
        
        this.attachPhotoEvents(container);
    }
    
    // 排行榜视图 - 根据爱心数量排序，展示前30张
    renderRankingView() {
        const container = document.getElementById('ranking-grid');
        container.innerHTML = '';
        
        // 按爱心数量排序，取前30张
        const sortedPhotos = [...this.photos]
            .sort((a, b) => (b.likes || 0) - (a.likes || 0))
            .slice(0, 30);
        
        if (sortedPhotos.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        // 创建排行榜网格
        const rankingGrid = document.createElement('div');
        rankingGrid.className = 'ranking-photos-grid';
        
        sortedPhotos.forEach((photo, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
            
            const photoCard = document.createElement('div');
            photoCard.className = `ranking-photo-card ${rankClass}`;
            photoCard.innerHTML = `
                <div class="rank-badge">${rank}</div>
                <div class="ranking-photo-image">
                    <img src="${photo.thumb_path || photo.file_path}" alt="${photo.title || ''}" loading="lazy">
                </div>
                <div class="ranking-photo-info">
                    <div class="ranking-likes">
                        <i class="fas fa-heart"></i>
                        <span>${photo.likes || 0}</span>
                    </div>
                    <div class="ranking-date">${new Date(photo.taken_at || photo.uploaded_at).toLocaleDateString('zh-CN')}</div>
                </div>
            `;
            
            // 点击打开照片详情
            photoCard.addEventListener('click', () => {
                this.openPhotoModal(photo.id);
            });
            
            rankingGrid.appendChild(photoCard);
        });
        
        container.appendChild(rankingGrid);
    }
    
    // 按月视图
    renderMonthView() {
        const container = document.getElementById('month-calendar');
        container.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.innerHTML = `
            <h2>${year}年 ${month + 1}月</h2>
            <div class="month-nav">
                <button id="prev-month"><i class="fas fa-chevron-left"></i></button>
                <button id="next-month"><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        container.appendChild(monthHeader);
        
        // 月份导航事件
        monthHeader.querySelector('#prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(month - 1);
            this.renderMonthView();
        });
        monthHeader.querySelector('#next-month').addEventListener('click', () => {
            this.currentDate.setMonth(month + 1);
            this.renderMonthView();
        });
        
        // 日历网格
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // 星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });
        
        // 获取该月照片
        const monthPhotos = this.photos.filter(p => {
            const date = new Date(p.taken_at || p.uploaded_at);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        
        const photosByDay = {};
        monthPhotos.forEach(p => {
            const day = new Date(p.taken_at || p.uploaded_at).getDate();
            photosByDay[day] = (photosByDay[day] || 0) + 1;
        });
        
        // 计算日历
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // 空白格
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarGrid.appendChild(emptyDay);
        }
        
        // 日期格
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            if (photosByDay[day]) {
                dayEl.classList.add('has-photos');
            }
            
            let indicators = '';
            if (photosByDay[day]) {
                const count = Math.min(photosByDay[day], 5);
                indicators = '<div class="photo-indicator">' + 
                    Array(count).fill('<span></span>').join('') + 
                    '</div>';
            }
            
            dayEl.innerHTML = `
                <span class="day-number">${day}</span>
                ${indicators}
            `;
            
            dayEl.addEventListener('click', () => {
                if (photosByDay[day]) {
                    this.showDayPhotos(year, month, day);
                }
            });
            
            calendarGrid.appendChild(dayEl);
        }
        
        container.appendChild(calendarGrid);
    }
    
    // 创建照片卡片HTML
    createPhotoCardHTML(photo) {
        return `
            <div class="photo-card" data-id="${photo.id}">
                <img src="${photo.thumb_path || photo.file_path}" alt="${photo.title || ''}" loading="lazy">
                <div class="photo-overlay">
                    <div class="photo-actions">
                        <button class="like-btn" data-id="${photo.id}">
                            <i class="${photo.is_liked ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <button class="favorite-btn" data-id="${photo.id}">
                            <i class="${photo.is_favorite ? 'fas' : 'far'} fa-star"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 空状态
    getEmptyStateHTML() {
        return `
            <div class="empty-state" style="text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🌾</div>
                <h3 style="color: var(--gray-600); margin-bottom: 0.5rem;">还没有照片哦</h3>
                <p style="color: var(--gray-500);">点击右上角的上传按钮，开始记录美好瞬间吧~</p>
            </div>
        `;
    }
    
    // 按日期分组
    groupByDate(photos) {
        const grouped = {};
        photos.forEach(photo => {
            const date = new Date(photo.taken_at || photo.uploaded_at);
            const dateStr = date.toISOString().split('T')[0];
            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }
            grouped[dateStr].push(photo);
        });
        return grouped;
    }
    
    // 按周分组
    groupByWeek(photos) {
        const grouped = {};
        photos.forEach(photo => {
            const date = new Date(photo.taken_at || photo.uploaded_at);
            const weekKey = this.getWeekKey(date);
            if (!grouped[weekKey]) {
                grouped[weekKey] = [];
            }
            grouped[weekKey].push(photo);
        });
        return grouped;
    }
    
    getWeekKey(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${weekNo}`;
    }
    
    getWeekday(date) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[date.getDay()];
    }
    
    // 附加照片事件
    attachPhotoEvents(container) {
        container.querySelectorAll('.photo-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.photo-actions')) {
                    const id = card.dataset.id;
                    this.openPhotoModal(id);
                }
            });
        });
        
        container.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.toggleLike(id, btn);
            });
        });
        
        container.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.toggleFavorite(id, btn);
            });
        });
    }
    
    // 打开照片详情
    openPhotoModal(photoId) {
        const photo = this.photos.find(p => p.id == photoId);
        if (!photo) return;
        
        const modal = document.getElementById('photo-modal');
        const photoIndex = this.photos.findIndex(p => p.id == photoId);
        
        document.getElementById('photo-image').src = photo.file_path;
        document.getElementById('photo-title').textContent = photo.title || '未命名';
        document.getElementById('photo-date').textContent = new Date(photo.taken_at || photo.uploaded_at).toLocaleString('zh-CN');
        document.getElementById('photo-likes').textContent = photo.likes || 0;
        
        const likeBtn = document.getElementById('photo-like');
        likeBtn.innerHTML = `<i class="${photo.is_liked ? 'fas' : 'far'} fa-heart"></i><span id="photo-likes">${photo.likes || 0}</span>`;
        
        modal.classList.add('active');
        modal.dataset.photoIndex = photoIndex;
        
        // 事件绑定
        document.getElementById('close-photo').onclick = () => modal.classList.remove('active');
        document.getElementById('photo-like').onclick = () => this.toggleLike(photoId);
        document.getElementById('photo-download').onclick = () => this.downloadPhoto(photo);
        
        // 左右切换
        document.getElementById('photo-modal').onkeydown = (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevPhoto();
            } else if (e.key === 'ArrowRight') {
                this.nextPhoto();
            }
        };
    }
    
    // 上一张照片
    prevPhoto() {
        const modal = document.getElementById('photo-modal');
        if (!modal.classList.contains('active')) return;
        
        let currentIndex = parseInt(modal.dataset.photoIndex) || 0;
        currentIndex = (currentIndex - 1 + this.photos.length) % this.photos.length;
        
        const photo = this.photos[currentIndex];
        this.openPhotoModal(photo.id);
    }
    
    // 下一张照片
    nextPhoto() {
        const modal = document.getElementById('photo-modal');
        if (!modal.classList.contains('active')) return;
        
        let currentIndex = parseInt(modal.dataset.photoIndex) || 0;
        currentIndex = (currentIndex + 1) % this.photos.length;
        
        const photo = this.photos[currentIndex];
        this.openPhotoModal(photo.id);
    }
    
    // 点赞
    async toggleLike(photoId, btnElement = null) {
        try {
            const response = await fetch('api/gallery.php?action=like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId })
            });
            
            const data = await response.json();
            if (data.success) {
                const photo = this.photos.find(p => p.id == photoId);
                if (photo) {
                    photo.likes = data.likes;
                    photo.is_liked = data.is_liked;
                }
                
                // 更新UI
                if (btnElement) {
                    const icon = btnElement.querySelector('i');
                    icon.className = data.is_liked ? 'fas fa-heart' : 'far fa-heart';
                    if (data.is_liked) {
                        icon.style.color = '#FF6B6B';
                        window.effectsManager?.createHeartBurst(
                            btnElement.getBoundingClientRect().left + 15,
                            btnElement.getBoundingClientRect().top + 15
                        );
                    }
                }
                
                this.updateStats();
            }
        } catch (error) {
            console.error('点赞失败:', error);
        }
    }
    
    // 收藏
    async toggleFavorite(photoId, btnElement = null) {
        try {
            const response = await fetch('api/gallery.php?action=favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_id: photoId })
            });
            
            const data = await response.json();
            if (data.success) {
                const photo = this.photos.find(p => p.id == photoId);
                if (photo) {
                    photo.is_favorite = data.is_favorite;
                }
                
                if (btnElement) {
                    const icon = btnElement.querySelector('i');
                    icon.className = data.is_favorite ? 'fas fa-star' : 'far fa-star';
                }
                
                this.showToast(data.is_favorite ? '已添加到收藏' : '已取消收藏', 'success');
            }
        } catch (error) {
            console.error('收藏失败:', error);
        }
    }
    
    // 下载照片
    downloadPhoto(photo) {
        const link = document.createElement('a');
        link.href = photo.file_path;
        link.download = photo.original_name || photo.filename;
        link.click();
    }
    
    // 显示某天照片
    showDayPhotos(year, month, day) {
        const dayPhotos = this.photos.filter(p => {
            const date = new Date(p.taken_at || p.uploaded_at);
            return date.getFullYear() === year && 
                   date.getMonth() === month && 
                   date.getDate() === day;
        });
        
        if (dayPhotos.length > 0) {
            // 显示第一张照片
            this.openPhotoModal(dayPhotos[0].id);
        }
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 视图切换
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    }
    
    // 切换视图
    switchView(view) {
        this.currentView = view;
        
        // 更新导航按钮
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 显示对应视图
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');
        
        if (view === 'memory') {
            if (window.memoryManager) {
                window.memoryManager.loadMemoryPhotos();
            }
        } else {
            this.renderCurrentView();
        }
    }
    
    // 显示提示
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
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
}

// 初始化
window.galleryManager = new GalleryManager();
