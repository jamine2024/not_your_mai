FROM php:8.2-fpm

# 安装扩展
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd \
    && docker-php-ext-install pdo pdo_mysql zip

# 复制PHP配置
COPY php.ini /usr/local/etc/php/

# 设置工作目录
WORKDIR /var/www/html

# 创建上传目录
RUN mkdir -p /var/www/html/uploads/original /var/www/html/uploads/thumbs \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 755 /var/www/html/uploads
