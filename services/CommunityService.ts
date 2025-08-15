import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LearningChallenge, 
  ChallengeParticipant, 
  PeerMentor, 
  MentorshipRequest, 
  KnowledgeShare, 
  CommunityAnalytics, 
  SocialLearningCircle, 
  CircleMember, 
  CircleSession 
} from '@/types';

class CommunityService {
  private static instance: CommunityService;
  private userId: string | null = null;

  static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getStorageKey(key: string): string {
    return this.userId ? `community_${this.userId}_${key}` : `community_${key}`;
  }

  // Learning Challenges
  async createChallenge(challenge: Omit<LearningChallenge, 'id' | 'createdAt' | 'isActive' | 'progress'>): Promise<LearningChallenge> {
    try {
      const newChallenge: LearningChallenge = {
        ...challenge,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        progress: {
          completed: false,
          currentDay: 0,
          totalDays: challenge.duration,
          participantsCompleted: 0
        }
      };

      const challenges = await this.getChallenges();
      challenges.push(newChallenge);
      await AsyncStorage.setItem(this.getStorageKey('challenges'), JSON.stringify(challenges));

      return newChallenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  async getChallenges(): Promise<LearningChallenge[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('challenges'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting challenges:', error);
      return [];
    }
  }

  async joinChallenge(challengeId: string): Promise<ChallengeParticipant> {
    try {
      const participant: ChallengeParticipant = {
        userId: this.userId || 'anonymous',
        challengeId,
        joinedAt: new Date().toISOString(),
        progress: {
          currentDay: 0,
          completedDays: [],
          streak: 0,
          lastActivity: new Date().toISOString()
        },
        status: 'active'
      };

      const participants = await this.getChallengeParticipants();
      participants.push(participant);
      await AsyncStorage.setItem(this.getStorageKey('challenge_participants'), JSON.stringify(participants));

      return participant;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  async getChallengeParticipants(): Promise<ChallengeParticipant[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('challenge_participants'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting challenge participants:', error);
      return [];
    }
  }

  async updateChallengeProgress(challengeId: string, day: number): Promise<void> {
    try {
      const participants = await this.getChallengeParticipants();
      const participant = participants.find(p => p.userId === this.userId && p.challengeId === challengeId);
      
      if (participant) {
        participant.progress.currentDay = day;
        participant.progress.completedDays.push(day);
        participant.progress.lastActivity = new Date().toISOString();
        
        await AsyncStorage.setItem(this.getStorageKey('challenge_participants'), JSON.stringify(participants));
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }

  // Peer Mentorship
  async createMentorProfile(mentor: Omit<PeerMentor, 'id' | 'createdAt'>): Promise<PeerMentor> {
    try {
      const newMentor: PeerMentor = {
        ...mentor,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const mentors = await this.getMentors();
      mentors.push(newMentor);
      await AsyncStorage.setItem(this.getStorageKey('mentors'), JSON.stringify(mentors));

      return newMentor;
    } catch (error) {
      console.error('Error creating mentor profile:', error);
      throw error;
    }
  }

  async getMentors(): Promise<PeerMentor[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('mentors'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting mentors:', error);
      return [];
    }
  }

  async requestMentorship(request: Omit<MentorshipRequest, 'id' | 'createdAt'>): Promise<MentorshipRequest> {
    try {
      const newRequest: MentorshipRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const requests = await this.getMentorshipRequests();
      requests.push(newRequest);
      await AsyncStorage.setItem(this.getStorageKey('mentorship_requests'), JSON.stringify(requests));

      return newRequest;
    } catch (error) {
      console.error('Error requesting mentorship:', error);
      throw error;
    }
  }

  async getMentorshipRequests(): Promise<MentorshipRequest[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('mentorship_requests'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting mentorship requests:', error);
      return [];
    }
  }

  // Knowledge Sharing
  async createKnowledgeShare(share: Omit<KnowledgeShare, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'shares' | 'comments'>): Promise<KnowledgeShare> {
    try {
      const newShare: KnowledgeShare = {
        ...share,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likes: 0,
        shares: 0,
        comments: 0
      };

      const shares = await this.getKnowledgeShares();
      shares.push(newShare);
      await AsyncStorage.setItem(this.getStorageKey('knowledge_shares'), JSON.stringify(shares));

      return newShare;
    } catch (error) {
      console.error('Error creating knowledge share:', error);
      throw error;
    }
  }

  async getKnowledgeShares(): Promise<KnowledgeShare[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('knowledge_shares'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting knowledge shares:', error);
      return [];
    }
  }

  async likeKnowledgeShare(shareId: string): Promise<void> {
    try {
      const shares = await this.getKnowledgeShares();
      const share = shares.find(s => s.id === shareId);
      if (share) {
        share.likes += 1;
        await AsyncStorage.setItem(this.getStorageKey('knowledge_shares'), JSON.stringify(shares));
      }
    } catch (error) {
      console.error('Error liking knowledge share:', error);
    }
  }

  // Social Learning Circles
  async createLearningCircle(circle: Omit<SocialLearningCircle, 'id' | 'createdAt' | 'isActive' | 'currentMembers'>): Promise<SocialLearningCircle> {
    try {
      const newCircle: SocialLearningCircle = {
        ...circle,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        currentMembers: 1
      };

      const circles = await this.getLearningCircles();
      circles.push(newCircle);
      await AsyncStorage.setItem(this.getStorageKey('learning_circles'), JSON.stringify(circles));

      // Add creator as first member
      await this.joinLearningCircle(newCircle.id, 'leader');

      return newCircle;
    } catch (error) {
      console.error('Error creating learning circle:', error);
      throw error;
    }
  }

  async getLearningCircles(): Promise<SocialLearningCircle[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('learning_circles'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting learning circles:', error);
      return [];
    }
  }

  async joinLearningCircle(circleId: string, role: 'leader' | 'moderator' | 'member' = 'member'): Promise<CircleMember> {
    try {
      const member: CircleMember = {
        userId: this.userId || 'anonymous',
        circleId,
        role,
        joinedAt: new Date().toISOString(),
        contributions: 0,
        lastActivity: new Date().toISOString()
      };

      const members = await this.getCircleMembers();
      members.push(member);
      await AsyncStorage.setItem(this.getStorageKey('circle_members'), JSON.stringify(members));

      // Update circle member count
      const circles = await this.getLearningCircles();
      const circle = circles.find(c => c.id === circleId);
      if (circle) {
        circle.currentMembers += 1;
        await AsyncStorage.setItem(this.getStorageKey('learning_circles'), JSON.stringify(circles));
      }

      return member;
    } catch (error) {
      console.error('Error joining learning circle:', error);
      throw error;
    }
  }

  async getCircleMembers(): Promise<CircleMember[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('circle_members'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting circle members:', error);
      return [];
    }
  }

  async getCircleSessions(): Promise<CircleSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('circle_sessions'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting circle sessions:', error);
      return [];
    }
  }

  async createCircleSession(session: Omit<CircleSession, 'id' | 'createdAt'>): Promise<CircleSession> {
    try {
      const newSession: CircleSession = {
        ...session,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const sessions = await this.getCircleSessions();
      sessions.push(newSession);
      await AsyncStorage.setItem(this.getStorageKey('circle_sessions'), JSON.stringify(sessions));

      return newSession;
    } catch (error) {
      console.error('Error creating circle session:', error);
      throw error;
    }
  }

  // Community Analytics
  async getCommunityAnalytics(): Promise<CommunityAnalytics> {
    try {
      const [
        challenges,
        participants,
        mentors,
        mentorshipRequests,
        knowledgeShares,
        circles,
        members
      ] = await Promise.all([
        this.getChallenges(),
        this.getChallengeParticipants(),
        this.getMentors(),
        this.getMentorshipRequests(),
        this.getKnowledgeShares(),
        this.getLearningCircles(),
        this.getCircleMembers()
      ]);

      const totalMembers = new Set(members.map(m => m.userId)).size;
      const activeMembers = new Set(
        members.filter(m => {
          const lastActivity = new Date(m.lastActivity);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastActivity > weekAgo;
        }).map(m => m.userId)
      ).size;

      const challengesCompleted = participants.filter(p => p.status === 'completed').length;
      const mentorshipConnections = mentorshipRequests.filter(r => r.status === 'accepted').length;

      // Calculate engagement rate
      const totalInteractions = knowledgeShares.length + mentorshipConnections + challengesCompleted;
      const engagementRate = totalMembers > 0 ? (totalInteractions / totalMembers) * 100 : 0;

      // Get top contributors
      const contributorMap = new Map<string, { userId: string; contributions: number; impact: number }>();
      
      // Count knowledge shares
      knowledgeShares.forEach(share => {
        const current = contributorMap.get(share.authorId) || { userId: share.authorId, contributions: 0, impact: 0 };
        current.contributions += 1;
        current.impact += share.likes + share.shares;
        contributorMap.set(share.authorId, current);
      });

      const topContributors = Array.from(contributorMap.values())
        .sort((a, b) => b.impact - a.impact)
        .slice(0, 5)
        .map(contributor => ({
          ...contributor,
          name: `User ${contributor.userId.slice(-4)}` // Generate a simple name from userId
        }));

      return {
        totalMembers,
        activeMembers,
        challengesCreated: challenges.length,
        challengesCompleted,
        mentorshipConnections,
        knowledgeShares: knowledgeShares.length,
        engagementRate: Math.round(engagementRate),
        topContributors,
        popularTopics: this.getPopularTopics(knowledgeShares)
      };
    } catch (error) {
      console.error('Error getting community analytics:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        challengesCreated: 0,
        challengesCompleted: 0,
        mentorshipConnections: 0,
        knowledgeShares: 0,
        engagementRate: 0,
        topContributors: [],
        popularTopics: []
      };
    }
  }

  private getPopularTopics(knowledgeShares: KnowledgeShare[]): { topic: string; engagement: number }[] {
    const topicMap = new Map<string, number>();
    
    knowledgeShares.forEach(share => {
      share.tags.forEach(tag => {
        const current = topicMap.get(tag) || 0;
        topicMap.set(tag, current + share.likes + share.shares);
      });
    });

    return Array.from(topicMap.entries())
      .map(([topic, engagement]) => ({ topic, engagement }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
  }
}

export default CommunityService;
