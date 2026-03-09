@echo off
chcp 65001 >nul
echo ==========================================
echo     才不是你的小麦 - 停止服务
echo ==========================================
echo.

echo 正在停止服务...
docker-compose down

echo.
echo 服务已停止
echo 数据已保存在 ./data 目录中
echo ==========================================
pause
