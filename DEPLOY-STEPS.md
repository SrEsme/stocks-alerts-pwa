# 🚀 DEPLOY TO FIREBASE - Steps

## ✅ PRE-SETUP (DONE)
- [x] Fix iOS login issues (committed)  
- [x] Firebase config exists
- [x] .env variables configured
- [x] PWA manifest ready

## 🔥 DEPLOY PROCESS

### 1. Install Firebase CLI (once)
```bash
npm install -g firebase-tools
firebase --version  # Check it works
```

### 2. Login to Firebase
```bash
firebase login
# Opens browser, sign in with your Google account
# Use the same account that owns the Firebase project
```

### 3. Verify project 
```bash
firebase projects:list
firebase use stocks-alert-app-848e5  # Your project ID
```

### 4. Build for production
```bash
npm run build
# Creates optimized dist/ folder
```

### 5. Deploy
```bash
# Deploy everything:
firebase deploy

# Or just hosting:
firebase deploy --only hosting

# Or with message:
firebase deploy -m "Fix iOS login redirect issues"
```

## 🎯 POST-DEPLOY

### Test on iOS:
1. Open Safari iOS → Go to your Firebase URL
2. "Add to Home Screen"  
3. Open PWA → Test Google login
4. Should work smoothly now! 🎉

### Firebase URL:
Your app: `https://stocks-alert-app-848e5.web.app`

## 🐞 IF DEPLOY FAILS

### Common issues:
```bash
# 1. Not authenticated
firebase login --reauth

# 2. Wrong project  
firebase use --add

# 3. Missing permissions
# Check Firebase console → Project settings → Users

# 4. Build failed
rm -rf dist/ node_modules/
npm install
npm run build
```

## ⚡ CONTINUOUS DEPLOYMENT (Optional)

Setup GitHub Actions for auto-deploy on push:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: stocks-alert-app-848e5
```