# 才不是你的小麦 - AI女友相册

![才不是你的小麦](src/images/logo.png)

一个功能丰富、界面美观的 AI 女友相册网站，支持多种查看模式、特效、背景音乐等功能。

## ✨ 功能特性

### 📱 响应式设计
- 适配 PC 端和移动端
- 移动端导航栏可收起/展开
- 流畅的触摸体验

### 📷 照片管理
- 多种查看模式：按天、按周、按月、幻灯片
- 照片上传和批量管理
- 照片点赞和收藏
- 分页加载，避免性能问题

### 🎵 音乐播放器
- 上传和管理背景音乐
- 播放不中断（切换页面时）
- 音量控制

### ✨ 特效系统
- 多种视觉特效
- 粒子背景
- 响应式动画

### 👤 个人介绍页
- 详细的个人资料展示
- 互动功能
- 项目信息展示

### 🔒 管理后台
- 照片管理（支持多选删除）
- 音乐管理
- 数据统计
- 双因素认证
- 修改密码

### 🛠️ 技术特性
- Docker 容器化部署
- RESTful API 设计
- 模块化架构
- 安全的密码管理
- 完整的错误处理

## 🚀 快速开始

### 环境要求
- Docker
- Docker Compose

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/jamine2024/not_your_mai.git
   cd not_your_mai
   ```

2. **启动容器**
   ```bash
   # 构建并启动容器
   docker-compose up -d --build
   
   # 停止容器
   docker-compose down
   
   # 重新构建（不使用缓存）
   docker-compose down && docker-compose build --no-cache && docker-compose up -d
   ```

3. **访问网站**
   - 相册首页：`http://localhost:8080`
   - 管理后台：`http://localhost:8080/login.html`
   - 个人介绍页：`http://localhost:8080/profile.html`

## 🔧 配置说明

### 数据库配置
- 默认数据库：`wheat_album`
- 用户名：`root`
- 密码：`root`
- 端口：`3306`

### 上传配置
- 最大文件大小：50MB
- 支持的图片格式：JPEG、PNG、GIF、WebP
- 上传目录：`src/uploads/`

### PHP 配置
- 上传限制：100MB
- 执行时间：600秒
- 内存限制：1GB

## 📁 项目结构

```
├── src/
│   ├── api/            # API 接口
│   │   ├── admin.php   # 管理员 API
│   │   ├── auth.php    # 认证 API
│   │   ├── config.php  # 配置文件
│   │   ├── gallery.php # 相册 API
│   │   └── upload.php  # 上传 API
│   ├── css/            # 样式文件
│   │   ├── responsive.css # 响应式样式
│   │   └── style.css   # 主样式
│   ├── images/         # 图片资源
│   ├── js/             # JavaScript 文件
│   │   ├── effects.js  # 特效系统
│   │   └── main.js     # 主脚本
│   ├── uploads/        # 上传文件
│   │   ├── original/   # 原始图片
│   │   └── thumbs/     # 缩略图
│   ├── index.html      # 首页
│   ├── login.html      # 登录页
│   ├── profile.html    # 个人介绍页
│   └── admin.html      # 管理后台
├── php/                # PHP 配置
│   └── php.ini         # PHP 配置文件
├── docker-compose.yml  # Docker Compose 配置
├── Dockerfile          # Docker 构建文件
└── README.md           # 项目说明
```

## 🔐 安全说明

### 初始密码
- 默认管理员密码：`wheat2024`
- 登录后请及时修改密码

### 双因素认证
- 支持 Google Authenticator 等 TOTP 认证器
- 首次登录后可在管理后台设置

## 📱 移动端优化

- **导航栏**：底部固定，可收起/展开
- **照片网格**：2列布局，优化触摸体验
- **统计栏**：网格布局，清晰易读
- **响应式**：适配各种屏幕尺寸

## 🎨 技术栈

### 前端
- HTML5
- CSS3 (Flexbox, Grid)
- JavaScript (ES6+)
- Font Awesome
- Google Fonts

### 后端
- PHP 8.0+
- MySQL/MariaDB
- PDO 数据库访问

### 容器化
- Docker
- Docker Compose

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

### 特别声明
**本项目开源不可商用**
- 仅允许个人学习和非商业用途
- 禁止任何商业性质的使用、修改或分发
- 如需商业使用，请联系开发者获取授权

### 基础许可证
MIT License

## 📞 联系信息

- **开发者**：奥奥
- **QQ**：741500926
- **GitHub**：[https://github.com/jamine2024/not_your_mai](https://github.com/jamine2024/not_your_mai)

---

**才不是你的小麦** - 你的专属 AI 女友相册 💖