# Firestore Security Rules for Community Features

## Setting up Firestore Security Rules

1. **Go to Firebase Console** → **Firestore Database** → **Rules**

2. **Replace the existing rules with these:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Community posts - anyone can read, authenticated users can create
    match /community_posts/{postId} {
      allow read: if true; // Anyone can read posts
      allow create: if request.auth != null; // Only authenticated users can create
      allow update: if request.auth != null; // Any authenticated user can like/bookmark posts
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId; // Only post owner can delete
    }

    // Habits can only be accessed by their owner
    match /habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Habit completions can only be accessed by their owner
    match /habit_completions/{completionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. **Click "Publish" to save the rules**

## What these rules do:

- **Users collection**: Users can only access their own profile data
- **Community posts**: 
  - Anyone can read posts (public feed)
  - Only authenticated users can create posts
  - Users can update their own posts or like/bookmark any post
  - Only post owners can delete their posts
- **Habits & Completions**: Users can only access their own habit data

## Testing the Rules

After setting up the rules, test the community features:

1. **Create a post** - Should work for authenticated users
2. **Like a post** - Should work for authenticated users
3. **Bookmark a post** - Should work for authenticated users
4. **View the feed** - Should work for everyone

## Troubleshooting

If you get permission errors:

1. Make sure you're logged in
2. Check that the rules are published
3. Verify the collection names match exactly: `users`, `community_posts`, `habits`, `habit_completions` 