import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';

export interface CommunityPost {
  id: string;
  type: 'pattern' | 'story' | 'support' | 'celebration';
  content: any;
  userId: string;
  userName: string;
  userAvatar?: string;
  likes: string[];
  bookmarks: string[];
  comments_count: number;
  created_at: any;
  updated_at: any;
}

export interface CommunityFilters {
  timeframe: string;
  sortBy: string;
}

class CommunityService {
  private postsCollection = collection(db, 'community_posts');
  private usersCollection = collection(db, 'users');

  // Create a new post
  async createPost(type: CommunityPost['type'], content: any): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user profile
      const userDoc = await getDoc(doc(this.usersCollection, user.uid));
      const userData = userDoc.data();

      const postData = {
        type,
        content,
        userId: user.uid,
        userName: userData?.name || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: userData?.avatar || null,
        likes: [],
        bookmarks: [],
        comments_count: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      const docRef = await addDoc(this.postsCollection, postData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Get all posts with optional filtering
  async getFeed(filters?: CommunityFilters): Promise<{
    patterns: CommunityPost[];
    stories: CommunityPost[];
    support: CommunityPost[];
    celebrations: CommunityPost[];
  }> {
    try {
      let q = query(this.postsCollection, orderBy('created_at', 'desc'));
      
      if (filters?.timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(q, where('created_at', '>=', weekAgo));
      }

      const querySnapshot = await getDocs(q);
      const posts: CommunityPost[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as CommunityPost);
      });

      return {
        patterns: posts.filter(post => post.type === 'pattern'),
        stories: posts.filter(post => post.type === 'story'),
        support: posts.filter(post => post.type === 'support'),
        celebrations: posts.filter(post => post.type === 'celebration')
      };
    } catch (error) {
      console.error('Error getting feed:', error);
      throw error;
    }
  }

  // Toggle like on a post
  async toggleLike(postId: string): Promise<{ liked: boolean }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const postRef = doc(this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      const likes = postData.likes || [];
      const isLiked = likes.includes(user.uid);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }

      return { liked: !isLiked };
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Toggle bookmark on a post
  async toggleBookmark(postId: string): Promise<{ bookmarked: boolean }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const postRef = doc(this.postsCollection, postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      const bookmarks = postData.bookmarks || [];
      const isBookmarked = bookmarks.includes(user.uid);

      if (isBookmarked) {
        await updateDoc(postRef, {
          bookmarks: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          bookmarks: arrayUnion(user.uid)
        });
      }

      return { bookmarked: !isBookmarked };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw error;
    }
  }

  // Get user's bookmarked posts
  async getBookmarkedPosts(): Promise<CommunityPost[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return [];
      }

      const q = query(
        this.postsCollection,
        where('bookmarks', 'array-contains', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const posts: CommunityPost[] = [];

      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as CommunityPost);
      });

      return posts;
    } catch (error) {
      console.error('Error getting bookmarked posts:', error);
      return [];
    }
  }

  // Search posts
  async searchPosts(query: string, filters?: CommunityFilters): Promise<CommunityPost[]> {
    try {
      // Note: Firestore doesn't support full-text search out of the box
      // For now, we'll get all posts and filter client-side
      // In production, you'd want to use Algolia or similar service
      const feed = await this.getFeed(filters);
      const allPosts = [
        ...feed.patterns,
        ...feed.stories,
        ...feed.support,
        ...feed.celebrations
      ];

      return allPosts.filter(post => {
        const searchTerm = query.toLowerCase();
        const content = JSON.stringify(post.content).toLowerCase();
        const userName = post.userName.toLowerCase();
        
        return content.includes(searchTerm) || userName.includes(searchTerm);
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  // Generate content from user data
  async generateContentFromUserData(
    moodData: any[],
    habitMoodData: any[],
    habits: any[]
  ): Promise<{
    patterns: any[];
    stories: any[];
    celebrations: any[];
  }> {
    try {
      // Generate patterns from habit data
      const patterns = habits.map(habit => ({
        patternType: 'habit_consistency',
        anonymizedData: {
          habitName: habit.name,
          completionRate: Math.random() * 100,
          duration: Math.floor(Math.random() * 30) + 1
        },
        insights: `Consistent ${habit.name} practice shows positive results`
      }));

      // Generate stories from mood data
      const stories = moodData.length > 0 ? [{
        title: 'Mood Journey',
        story: 'Tracking mood patterns has revealed interesting insights',
        category: 'wellness',
        timeline: '2 weeks',
        keyFactors: ['sleep', 'exercise', 'social'],
        challenges: ['stress', 'time management'],
        outcomes: ['improved mood', 'better habits'],
        anonymized: true,
        inspirationLevel: 'high'
      }] : [];

      // Generate celebrations
      const celebrations = habits.filter(h => h.streak > 7).map(habit => ({
        type: 'streak',
        achievement: {
          title: `${habit.streak} Day Streak!`,
          description: `Maintained ${habit.name} for ${habit.streak} days`
        },
        moodJourney: 'positive',
        celebrationStyle: 'milestone',
        anonymized: true
      }));

      return { patterns, stories, celebrations };
    } catch (error) {
      console.error('Error generating content:', error);
      return { patterns: [], stories: [], celebrations: [] };
    }
  }

  // Subscribe to real-time updates (placeholder for now)
  subscribeToFeed(callback: (payload: any) => void) {
    // In a real implementation, you'd use onSnapshot from Firestore
    // For now, return a mock subscription
    return {
      unsubscribe: () => {
        console.log('Unsubscribed from feed updates');
      }
    };
  }
}

export const FirebaseCommunityService = new CommunityService();
export default FirebaseCommunityService; 