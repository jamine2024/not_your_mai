#!/bin/bash

# 创建上传目录并设置权限
echo "创建上传目录..."
mkdir -p /var/www/html/uploads/original /var/www/html/uploads/thumbs /var/www/html/uploads/music /var/www/html/data
chown -R www-data:www-data /var/www/html/uploads /var/www/html/data
chmod -R 777 /var/www/html/uploads /var/www/html/data

# 初始化 MariaDB 数据目录
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "初始化 MariaDB 数据目录..."
    mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
fi

# 启动 MariaDB
echo "启动 MariaDB..."
mysqld_safe --datadir=/var/lib/mysql & 

# 等待 MariaDB 启动
echo "等待 MariaDB 启动..."
for i in {1..30}; do
    if mariadb-admin ping --silent 2>/dev/null; then
        echo "MariaDB 已启动"
        break
    fi
    echo "等待 MariaDB... ($i/30)"
    sleep 1
done

# 设置 root 密码
mariadb -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';" 2>/dev/null || true

# 初始化数据库
if [ ! -d "/var/lib/mysql/wheat_album" ]; then
    echo "初始化数据库..."
    mariadb -uroot -proot -e "CREATE DATABASE IF NOT EXISTS wheat_album;"
    mariadb -uroot -proot -e "GRANT ALL PRIVILEGES ON wheat_album.* TO 'root'@'localhost' IDENTIFIED BY 'root' WITH GRANT OPTION;"
    mariadb -uroot -proot -e "FLUSH PRIVILEGES;"
    mariadb -uroot -proot wheat_album < /docker-entrypoint-initdb.d/init.sql
    echo "数据库初始化完成"
fi

# 再次确保权限正确
echo "确保目录权限..."
chown -R www-data:www-data /var/www/html/uploads /var/www/html/data
chmod -R 777 /var/www/html/uploads /var/www/html/data
ls -la /var/www/html/uploads/

# 启动 Apache
echo "启动 Apache..."
apache2-foreground
