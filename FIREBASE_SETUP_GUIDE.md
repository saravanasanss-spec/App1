# Firebase Setup Guide - Cloud Storage for Transactions

This guide will help you set up Firebase to store transactions in the cloud, making them accessible across all devices and users.

## Why Firebase?

- ✅ **Free tier** - Generous free quota for small projects
- ✅ **Real-time sync** - Data updates across all devices instantly
- ✅ **No backend needed** - Works directly from browser
- ✅ **Secure** - Built-in security rules
- ✅ **Scalable** - Grows with your business

## Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `digital-studio-shop` (or any name)
4. Click **Continue**
5. Disable Google Analytics (optional) or enable it
6. Click **Create project**
7. Wait for project creation (30 seconds)

### Step 2: Enable Firestore Database

1. In Firebase Console, click **Firestore Database** in left menu
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose a location (closest to your users)
5. Click **Enable**

### Step 3: Get Your Firebase Config

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. Register app:
   - App nickname: `Digital Studio Shop`
   - Check "Also set up Firebase Hosting" (optional)
   - Click **Register app**
6. Copy the `firebaseConfig` object

### Step 4: Update Your Code

1. Open `js/firebase-config.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...", // Your actual API key
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### Step 5: Set Up Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Transactions - read/write for everyone (adjust as needed)
    match /transactions/{transactionId} {
      allow read, write: if true;
    }
    
    // Menu items - read/write for everyone
    match /menuItems/{itemId} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**

**⚠️ Security Note:** These rules allow anyone to read/write. For production:
- Add authentication
- Restrict write access to admin only
- See "Advanced Security" section below

### Step 6: Test Your Setup

1. Open your website
2. Make a test transaction
3. Go to Firebase Console → Firestore Database
4. You should see a `transactions` collection with your data!

## Data Structure

### Transactions Collection
```
transactions/
  └── {transactionId}/
      ├── id: "1234567890"
      ├── date: "2024-01-15T10:30:00.000Z"
      ├── items: [
      │     { name: "Xerox", quantity: 2, price: 2, total: 4 }
      │   ]
      ├── total: 4.00
      └── createdAt: Timestamp
```

### Menu Items Collection
```
menuItems/
  └── {itemId}/
      ├── id: "1"
      ├── name: "Xerox"
      ├── image: "https://..."
      └── defaultPrice: 2
```

## Features Enabled

✅ **Cloud Storage** - Transactions saved to Firebase
✅ **Cross-Device Sync** - Access from any device
✅ **Real-time Updates** - See new transactions instantly
✅ **Backup** - Data stored in cloud (won't be lost)
✅ **Offline Support** - Works offline, syncs when online

## Advanced Security (Production)

For production use, implement proper security:

### Option 1: Simple Password Protection
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read: if true; // Anyone can read
      allow write: if request.auth != null; // Only authenticated users
    }
  }
}
```

### Option 2: Admin-Only Writes
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

## Troubleshooting

### "Firebase not initialized"
- Check that Firebase scripts are loaded in HTML
- Verify your config in `firebase-config.js`
- Check browser console for errors

### "Permission denied"
- Check Firestore security rules
- Make sure rules are published
- For test mode, rules should allow read/write

### "Transactions not syncing"
- Check internet connection
- Verify Firebase config is correct
- Check browser console for errors
- Ensure Firestore is enabled in Firebase Console

### Data not appearing
- Refresh the page
- Check Firestore Console to see if data is saved
- Check browser console for errors

## Firebase Free Tier Limits

- **Storage:** 1 GB
- **Reads:** 50,000/day
- **Writes:** 20,000/day
- **Deletes:** 20,000/day

For a small shop, this is more than enough!

## Cost Estimation

- **Free tier** covers most small businesses
- **Blaze Plan** (pay-as-you-go) starts after free tier
- Typical small shop: **$0/month** (stays in free tier)

## Alternative: Supabase (Open Source)

If you prefer an open-source alternative:
- Similar setup process
- PostgreSQL database
- Also has free tier
- More control over data

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Configure Firestore
3. ✅ Update `firebase-config.js`
4. ✅ Test with a transaction
5. ✅ Verify data in Firebase Console
6. ✅ Access from multiple devices!

## Support

- Firebase Docs: https://firebase.google.com/docs
- Firestore Docs: https://firebase.google.com/docs/firestore
- Community: https://firebase.google.com/support

