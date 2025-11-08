@echo off
echo ========================================
echo   GitHub Setup Helper
echo ========================================
echo.
echo This script will help you set up Git
echo and connect to GitHub.
echo.
echo Make sure you have:
echo   1. Created a repository on GitHub
echo   2. Installed Git on your computer
echo.
pause
echo.
echo ========================================
echo   Step 1: Git Configuration
echo ========================================
echo.
echo Enter your name (for Git commits):
set /p GIT_NAME=
echo.
echo Enter your email (for Git commits):
set /p GIT_EMAIL=
echo.
git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"
echo.
echo Git configured!
echo.
echo ========================================
echo   Step 2: Initialize Repository
echo ========================================
echo.
git init
echo.
echo ========================================
echo   Step 3: Add Files
echo ========================================
echo.
git add .
echo.
echo ========================================
echo   Step 4: First Commit
echo ========================================
echo.
git commit -m "Initial commit: Digital Studio Shop website"
echo.
echo ========================================
echo   Step 5: Connect to GitHub
echo ========================================
echo.
echo Enter your GitHub username:
set /p GITHUB_USER=
echo.
echo Enter your repository name:
set /p REPO_NAME=
echo.
git remote add origin https://github.com/%GITHUB_USER%/%REPO_NAME%.git
git branch -M main
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your repository is ready!
echo.
echo To push to GitHub, run:
echo   git push -u origin main
echo.
echo You'll need to enter your GitHub username
echo and Personal Access Token (not password).
echo.
echo To create a token:
echo   GitHub -^> Settings -^> Developer settings
echo   -^> Personal access tokens -^> Generate new token
echo.
pause

