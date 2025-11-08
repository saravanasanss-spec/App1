# GitHub Setup Guide - Push Your Project to GitHub

## Step-by-Step Instructions

### Step 1: Create a GitHub Account (if you don't have one)
1. Go to https://github.com
2. Sign up for a free account
3. Verify your email

### Step 2: Create a New Repository on GitHub
1. Log in to GitHub
2. Click the **"+"** icon in the top right → Select **"New repository"**
3. Fill in the details:
   - **Repository name:** `digital-studio-shop` (or any name you like)
   - **Description:** "Digital Studio and Xerox Shop Billing System"
   - **Visibility:** Choose **Public** (for free GitHub Pages) or **Private**
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

### Step 3: Install Git (if not already installed)
1. Download Git from: https://git-scm.com/download/win
2. Install with default settings
3. Verify installation: Open Command Prompt and type:
   ```bash
   git --version
   ```

### Step 4: Configure Git (First Time Only)
Open Command Prompt or PowerShell and run:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 5: Initialize Git in Your Project
1. Open Command Prompt/PowerShell
2. Navigate to your project folder:
   ```bash
   cd "D:\Learning\Cursor App\App1"
   ```

3. Initialize Git repository:
   ```bash
   git init
   ```

### Step 6: Create .gitignore File (Optional but Recommended)
Create a `.gitignore` file to exclude unnecessary files:
```
# OS files
.DS_Store
Thumbs.db
desktop.ini

# Editor files
.vscode/
.idea/
*.swp
*.swo

# Logs
*.log
```

### Step 7: Add Files to Git
```bash
# Add all files
git add .

# Or add specific files
git add index.html admin.html css/ js/
```

### Step 8: Commit Your Files
```bash
git commit -m "Initial commit: Digital Studio Shop website"
```

### Step 9: Connect to GitHub Repository
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/digital-studio-shop.git
```

**To find your repository URL:**
- Go to your GitHub repository page
- Click the green **"Code"** button
- Copy the HTTPS URL

### Step 10: Push to GitHub
```bash
# Set main branch (if first time)
git branch -M main

# Push to GitHub
git push -u origin main
```

You'll be prompted for your GitHub username and password (or Personal Access Token).

---

## Complete Command Sequence (Copy & Paste)

```bash
# Navigate to project folder
cd "D:\Learning\Cursor App\App1"

# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Digital Studio Shop website"

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Pulling Changes from GitHub

### If you make changes on another computer:

1. **Clone the repository** (first time):
   ```bash
   git clone https://github.com/YOUR_USERNAME/digital-studio-shop.git
   cd digital-studio-shop
   ```

2. **Pull latest changes** (if already cloned):
   ```bash
   git pull origin main
   ```

---

## Updating Your Project (Push Changes)

After making changes to your files:

```bash
# 1. Check what files changed
git status

# 2. Add changed files
git add .

# 3. Commit changes
git commit -m "Description of changes"

# 4. Push to GitHub
git push origin main
```

---

## GitHub Authentication

### Option 1: Personal Access Token (Recommended)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Select scopes: `repo` (full control)
4. Copy the token and use it as password when pushing

### Option 2: GitHub Desktop (Easier for Beginners)
1. Download: https://desktop.github.com
2. Sign in with GitHub account
3. Click "Add" → "Add existing repository"
4. Select your project folder
5. Click "Publish repository" to push to GitHub

---

## Enable GitHub Pages (Free Hosting)

After pushing to GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → Scroll to **Pages**
3. Under "Source":
   - Branch: Select **main**
   - Folder: Select **/ (root)**
4. Click **Save**
5. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/REPO_NAME/
   ```

**Example:**
```
https://john-doe.github.io/digital-studio-shop/
```

---

## Common Git Commands Reference

```bash
# Check status
git status

# See changes
git diff

# Add specific file
git add filename.html

# Add all files
git add .

# Commit with message
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Pull from GitHub
git pull origin main

# See commit history
git log

# Create new branch
git checkout -b new-feature

# Switch branches
git checkout main
```

---

## Troubleshooting

### "Repository not found" error
- Check your repository URL
- Make sure repository exists on GitHub
- Verify you have access (if private repo)

### "Authentication failed"
- Use Personal Access Token instead of password
- Or use GitHub Desktop app

### "Nothing to commit"
- Make sure you've saved your files
- Check `git status` to see what's changed

### "Permission denied"
- Check your GitHub username and token
- Make sure repository exists and you have write access

---

## Quick Setup Script

Save this as `setup-github.bat` in your project folder:

```batch
@echo off
echo Setting up GitHub repository...
echo.
echo Enter your GitHub username:
set /p USERNAME=
echo.
echo Enter your repository name:
set /p REPONAME=
echo.
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/%USERNAME%/%REPONAME%.git
echo.
echo Repository setup complete!
echo Now run: git push -u origin main
pause
```

---

## Next Steps After Pushing

1. ✅ Enable GitHub Pages for free hosting
2. ✅ Share the GitHub Pages URL with others
3. ✅ Continue making changes and pushing updates
4. ✅ Access your site from anywhere on mobile!

