// 才不是你的小麦 - 特效系统

class EffectsManager {
    constructor() {
        this.canvas = document.getElementById('effect-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.currentEffect = 'wheat';
        this.isActive = true;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 默认启动麦穗模式
        this.setEffect('wheat');
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setEffect(effectName) {
        this.currentEffect = effectName;
        this.particles = [];
        
        // 清除之前的动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 应用主题类
        document.body.className = `theme-${effectName}`;
        
        // 启动对应特效
        switch(effectName) {
            case 'dream':
                this.initDreamEffect();
                break;
            case 'starry':
                this.initStarryEffect();
                break;
            case 'sakura':
                this.initSakuraEffect();
                break;
            case 'bubble':
                this.initBubbleEffect();
                break;
            case 'wheat':
                this.initWheatEffect();
                break;
            case 'ai':
                this.initAIEffect();
                break;
            case 'retro':
                this.initRetroEffect();
                break;
            default:
                this.clearCanvas();
                return;
        }
        
        this.animate();
    }
    
    // 梦幻模式 - 漂浮光点
    initDreamEffect() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 20 + 5,
                speedY: Math.random() * 0.5 + 0.2,
                speedX: Math.random() * 0.4 - 0.2,
                opacity: Math.random() * 0.5 + 0.2,
                color: `hsla(${Math.random() * 60 + 280}, 70%, 80%,`,
                type: 'dream'
            });
        }
    }
    
    // 星空模式 - 闪烁星星
    initStarryEffect() {
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                type: 'star'
            });
        }
    }
    
    // 樱花模式 - 飘落花瓣
    initSakuraEffect() {
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                size: Math.random() * 15 + 10,
                speedY: Math.random() * 1 + 0.5,
                speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 2 - 1,
                sway: Math.random() * 2,
                type: 'petal'
            });
        }
    }
    
    // 泡泡模式 - 浮动泡泡
    initBubbleEffect() {
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 200,
                size: Math.random() * 40 + 20,
                speedY: Math.random() * 1 + 0.3,
                speedX: Math.random() * 0.4 - 0.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: Math.random() * 0.02 + 0.01,
                type: 'bubble'
            });
        }
    }
    
    // 麦穗模式 - 金色粒子
    initWheatEffect() {
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 6 + 2,
                speedY: Math.random() * 0.8 + 0.2,
                speedX: Math.random() * 0.6 - 0.3,
                opacity: Math.random() * 0.6 + 0.2,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: Math.random() * 0.02 + 0.01,
                type: 'wheat'
            });
        }
    }
    
    // AI模式 - 数据流
    initAIEffect() {
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: Math.random() * 100 + 50,
                speedY: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.1,
                type: 'datastream'
            });
        }
    }
    
    // 复古模式 - 胶片颗粒
    initRetroEffect() {
        // 复古模式使用CSS滤镜，不需要canvas动画
        this.clearCanvas();
    }
    
    animate() {
        if (!this.isActive) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateParticle(p) {
        switch(p.type) {
            case 'dream':
                p.y -= p.speedY;
                p.x += p.speedX;
                if (p.y < -50) {
                    p.y = this.canvas.height + 50;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
                
            case 'star':
                p.opacity += p.twinkleSpeed;
                if (p.opacity > 1 || p.opacity < 0.2) {
                    p.twinkleSpeed = -p.twinkleSpeed;
                }
                break;
                
            case 'petal':
                p.y += p.speedY;
                p.x += Math.sin(p.y * 0.01) * p.sway + p.speedX;
                p.rotation += p.rotationSpeed;
                if (p.y > this.canvas.height + 50) {
                    p.y = -50;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
                
            case 'bubble':
                p.y -= p.speedY;
                p.wobble += p.wobbleSpeed;
                p.x += Math.sin(p.wobble) * 0.5;
                if (p.y < -p.size) {
                    p.y = this.canvas.height + p.size;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
                
            case 'wheat':
                p.y -= p.speedY;
                p.sway += p.swaySpeed;
                p.x += Math.sin(p.sway) * 0.3;
                if (p.y < -10) {
                    p.y = this.canvas.height + 10;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
                
            case 'datastream':
                p.y += p.speedY;
                if (p.y > this.canvas.height) {
                    p.y = -p.length;
                    p.x = Math.random() * this.canvas.width;
                }
                break;
        }
    }
    
    drawParticle(p) {
        this.ctx.save();
        
        switch(p.type) {
            case 'dream':
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, p.color + p.opacity + ')');
                gradient.addColorStop(1, p.color + '0)');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'star':
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = 'white';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                break;
                
            case 'petal':
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation * Math.PI / 180);
                this.ctx.fillStyle = 'rgba(255, 183, 197, 0.8)';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.size / 2, p.size / 4, 0, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'bubble':
                const bubbleGradient = this.ctx.createRadialGradient(
                    p.x - p.size * 0.3, p.y - p.size * 0.3, 0,
                    p.x, p.y, p.size
                );
                bubbleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                bubbleGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
                bubbleGradient.addColorStop(1, 'rgba(135, 206, 235, 0.1)');
                this.ctx.fillStyle = bubbleGradient;
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                // 高光
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'wheat':
                this.ctx.fillStyle = `rgba(244, 208, 63, ${p.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
                
            case 'datastream':
                const streamGradient = this.ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
                streamGradient.addColorStop(0, 'rgba(0, 217, 255, 0)');
                streamGradient.addColorStop(0.5, `rgba(0, 217, 255, ${p.opacity})`);
                streamGradient.addColorStop(1, 'rgba(0, 217, 255, 0)');
                this.ctx.fillStyle = streamGradient;
                this.ctx.fillRect(p.x, p.y, 2, p.length);
                break;
        }
        
        this.ctx.restore();
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 创建爱心粒子效果
    createHeartBurst(x, y) {
        const hearts = [];
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${Math.random() * 20 + 15}px;
                pointer-events: none;
                z-index: 9999;
                animation: heartFloat 1s ease-out forwards;
            `;
            heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
            heart.style.setProperty('--ty', `${-Math.random() * 100 - 50}px`);
            document.body.appendChild(heart);
            
            setTimeout(() => heart.remove(), 1000);
        }
    }
    
    // 创建点击波纹效果
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border: 2px solid var(--wheat-gold);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
            animation: ripple 0.6s ease-out forwards;
        `;
        document.body.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes heartFloat {
        0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.5);
        }
    }
    
    @keyframes ripple {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化特效管理器
window.effectsManager = new EffectsManager();
