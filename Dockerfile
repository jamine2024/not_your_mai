# 使用 DaoCloud 镜像
FROM m.daocloud.io/docker.io/library/php:8.2-apache

# 使用国内镜像源
RUN sed -i 's/deb.debian.org/mirrors.tencent.com/g' /etc/apt/sources.list.d/debian.sources && \
    sed -i 's/security.debian.org/mirrors.tencent.com/g' /etc/apt/sources.list.d/debian.sources

# 安装 MariaDB 和 PHP 依赖
RUN apt-get update && apt-get install -y \
    mariadb-server \
    mariadb-client \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql mysqli \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制 PHP 配置
COPY php/php.ini /usr/local/etc/php/

# 复制初始化脚本
COPY mysql/init.sql /docker-entrypoint-initdb.d/

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /var/www/html

EXPOSE 80

CMD ["/start.sh"]
