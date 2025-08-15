import { supabase } from '@/lib/supabase-mobile';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'achievement' | 'milestone' | 'tip' | 'question' | 'motivation';
  likes: number;
  comments: number;
  tags?: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFilters {
  sortBy?: 'latest' | 'popular' | 'trending';
  type?: string;
  userId?: string;
  limit?: number;
}

export interface CreatePostData {
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'achievement' | 'milestone' | 'tip' | 'question' | 'motivation';
  tags?: string[];
  imageUrl?: string;
}

class SupabaseCommunityService {
  private static instance: SupabaseCommunityService;

  static getInstance(): SupabaseCommunityService {
    if (!SupabaseCommunityService.instance) {
      SupabaseCommunityService.instance = new SupabaseCommunityService();
    }
    return SupabaseCommunityService.instance;
  }

  async getPosts(filters: CommunityFilters = {}): Promise<CommunityPost[]> {
    try {
      let query = supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      // Transform data to match our interface
      return (data || []).map(post => ({
        id: post.id,
        userId: post.user_id,
        userName: post.user_name,
        userAvatar: post.user_avatar,
        content: post.content,
        type: post.type,
        likes: post.likes || 0,
        comments: post.comments || 0,
        tags: post.tags || [],
        imageUrl: post.image_url,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      }));
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  async createPost(postData: CreatePostData): Promise<CommunityPost | null> {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: postData.userId,
          user_name: postData.userName,
          user_avatar: postData.userAvatar,
          content: postData.content,
          type: postData.type,
          tags: postData.tags || [],
          image_url: postData.imageUrl,
          likes: 0,
          comments: 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        throw error;
      }

      if (!data) return null;

      // Transform the response
      return {
        id: data.id,
        userId: data.user_id,
        userName: data.user_name,
        userAvatar: data.user_avatar,
        content: data.content,
        type: data.type,
        likes: data.likes || 0,
        comments: data.comments || 0,
        tags: data.tags || [],
        imageUrl: data.image_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async likePost(postId: string, userId: string): Promise<void> {
    try {
      // Check if user already liked the post
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        // Get current like count and decrease it
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        if (post) {
          await supabase
            .from('community_posts')
            .update({ likes: Math.max(0, (post.likes || 0) - 1) })
            .eq('id', postId);
        }
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: userId }]);

        // Get current like count and increase it
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes')
          .eq('id', postId)
          .single();

        if (post) {
          await supabase
            .from('community_posts')
            .update({ likes: (post.likes || 0) + 1 })
            .eq('id', postId);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async addComment(postId: string, userId: string, userName: string, content: string): Promise<void> {
    try {
      // Add comment
      await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: userId,
          user_name: userName,
          content: content,
        }]);

      // Get current comment count and increase it
      const { data: post } = await supabase
        .from('community_posts')
        .select('comments')
        .eq('id', postId)
        .single();

      if (post) {
        await supabase
          .from('community_posts')
          .update({ comments: (post.comments || 0) + 1 })
          .eq('id', postId);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(postId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      // Check if user owns the post
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post || post.user_id !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      // Delete related likes and comments first
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId);

      await supabase
        .from('post_comments')
        .delete()
        .eq('post_id', postId);

      // Delete the post
      await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async updatePost(postId: string, userId: string, updates: Partial<Pick<CommunityPost, 'content' | 'type' | 'tags' | 'imageUrl'>>): Promise<void> {
    try {
      // Check if user owns the post
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (!post || post.user_id !== userId) {
        throw new Error('Unauthorized to update this post');
      }

      const updateData: any = {};
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

      await supabase
        .from('community_posts')
        .update(updateData)
        .eq('id', postId);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }
}

export default SupabaseCommunityService.getInstance();
