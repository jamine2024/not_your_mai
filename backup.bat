@echo off
chcp 65001 >nul
echo ==========================================
echo     才不是你的小麦 - 数据备份
echo ==========================================
echo.

set BACKUP_DIR=backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

echo [1/2] 备份数据目录...
tar -czvf %BACKUP_DIR%\data_%TIMESTAMP%.tar.gz data/

echo [2/2] 备份数据库...
docker-compose exec -T mysql mysqldump -u wheat_user -pwheat_pass_2024 wheat_album > %BACKUP_DIR%\database_%TIMESTAMP%.sql

echo.
echo ==========================================
echo  备份完成！
echo  备份文件保存在: %BACKUP_DIR%\
echo    - 数据备份: data_%TIMESTAMP%.tar.gz
echo    - 数据库: database_%TIMESTAMP%.sql
echo ==========================================
pause
