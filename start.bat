@echo off
chcp 65001 >nul
echo ==========================================
echo     才不是你的小麦 - AI女友相册
echo ==========================================
echo.

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker Compose 未安装
    pause
    exit /b 1
)

echo [1/4] 创建数据目录...
if not exist "data\mysql" mkdir "data\mysql"
if not exist "data\uploads\original" mkdir "data\uploads\original"
if not exist "data\uploads\thumbs" mkdir "data\uploads\thumbs"

echo [2/4] 构建并启动服务...
docker-compose up -d --build

if errorlevel 1 (
    echo [错误] 启动失败
    pause
    exit /b 1
)

echo [3/4] 等待数据库初始化...
timeout /t 5 /nobreak >nul

echo [4/4] 检查服务状态...
docker-compose ps

echo.
echo ==========================================
echo  服务已启动！
echo  访问地址: http://localhost
echo.
echo  常用命令:
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose down
echo    备份数据: backup.bat
echo ==========================================
pause
