import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get translated sample groups
const getTranslatedSampleGroups = (language: string) => {
  const translations = {
    en: {
      morningProductivityMasters: {
        name: 'Morning Productivity Masters',
        description: 'Join us for daily morning routines and productivity hacks. We focus on building sustainable habits that stick.',
        tags: ['morning', 'productivity', 'habits', 'routine'],
        rules: ['Be respectful', 'Share your progress', 'Support others'],
        topics: ['Morning routines', 'Time management', 'Goal setting'],
        sessions: {
          weeklyGoalReview: {
            title: 'Weekly Goal Review',
            description: 'Let\'s review our weekly goals and set new ones for next week.'
          }
        },
        chatMessages: {
          morningGreeting: 'Good morning everyone! Ready for another productive day? 🌅',
          meditationResponse: 'Morning Sarah! Just finished my 5-minute meditation. Feeling great! 🧘‍♂️'
        }
      },
      healthWellnessWarriors: {
        name: 'Health & Wellness Warriors',
        description: 'A supportive community focused on physical and mental wellness. Share your fitness journey and get motivated!',
        tags: ['fitness', 'wellness', 'mental-health', 'nutrition'],
        rules: ['Be supportive', 'Share progress', 'No judgment'],
        topics: ['Workout routines', 'Nutrition tips', 'Mental health']
      },
      learningEnthusiasts: {
        name: 'Learning Enthusiasts',
        description: 'Expand your knowledge with fellow learners. We explore various topics and share resources.',
        tags: ['learning', 'education', 'knowledge', 'skills'],
        rules: ['Share resources', 'Ask questions', 'Help others learn'],
        topics: ['Skill development', 'Book discussions', 'Online courses']
      },
      motivationBoosters: {
        name: 'Motivation Boosters',
        description: 'Stay motivated and inspired with daily encouragement and success stories.',
        tags: ['motivation', 'inspiration', 'success', 'mindset'],
        rules: ['Share wins', 'Encourage others', 'Stay positive'],
        topics: ['Success stories', 'Motivation techniques', 'Mindset shifts']
      }
    },
    es: {
      morningProductivityMasters: {
        name: 'Maestros de Productividad Matutina',
        description: 'Únete a nosotros para rutinas matutinas diarias y trucos de productividad. Nos enfocamos en construir hábitos sostenibles que perduren.',
        tags: ['mañana', 'productividad', 'hábitos', 'rutina'],
        rules: ['Sé respetuoso', 'Comparte tu progreso', 'Apoya a otros'],
        topics: ['Rutinas matutinas', 'Gestión del tiempo', 'Establecimiento de objetivos'],
        sessions: {
          weeklyGoalReview: {
            title: 'Revisión Semanal de Objetivos',
            description: 'Revisemos nuestros objetivos semanales y establezcamos nuevos para la próxima semana.'
          }
        },
        chatMessages: {
          morningGreeting: '¡Buenos días a todos! ¿Listos para otro día productivo? 🌅',
          meditationResponse: '¡Buenos días Sarah! Acabo de terminar mi meditación de 5 minutos. ¡Me siento genial! 🧘‍♂️'
        }
      },
      healthWellnessWarriors: {
        name: 'Guerreros de Salud y Bienestar',
        description: 'Una comunidad de apoyo enfocada en el bienestar físico y mental. ¡Comparte tu viaje de fitness y mantente motivado!',
        tags: ['fitness', 'bienestar', 'salud-mental', 'nutrición'],
        rules: ['Sé solidario', 'Comparte progreso', 'Sin juicios'],
        topics: ['Rutinas de ejercicio', 'Consejos de nutrición', 'Salud mental']
      },
      learningEnthusiasts: {
        name: 'Entusiastas del Aprendizaje',
        description: 'Expande tu conocimiento con otros aprendices. Exploramos varios temas y compartimos recursos.',
        tags: ['aprendizaje', 'educación', 'conocimiento', 'habilidades'],
        rules: ['Comparte recursos', 'Haz preguntas', 'Ayuda a otros a aprender'],
        topics: ['Desarrollo de habilidades', 'Discusiones de libros', 'Cursos en línea']
      },
      motivationBoosters: {
        name: 'Impulsores de Motivación',
        description: 'Mantente motivado e inspirado con aliento diario e historias de éxito.',
        tags: ['motivación', 'inspiración', 'éxito', 'mentalidad'],
        rules: ['Comparte victorias', 'Anima a otros', 'Mantén una actitud positiva'],
        topics: ['Historias de éxito', 'Técnicas de motivación', 'Cambios de mentalidad']
      }
    },
    fr: {
      morningProductivityMasters: {
        name: 'Maîtres de la Productivité Matinale',
        description: 'Rejoignez-nous pour des routines matinales quotidiennes et des astuces de productivité. Nous nous concentrons sur la construction d\'habitudes durables qui perdurent.',
        tags: ['matin', 'productivité', 'habitudes', 'routine'],
        rules: ['Soyez respectueux', 'Partagez votre progression', 'Soutenez les autres'],
        topics: ['Routines matinales', 'Gestion du temps', 'Fixation d\'objectifs'],
        sessions: {
          weeklyGoalReview: {
            title: 'Révision Hebdomadaire des Objectifs',
            description: 'Révisons nos objectifs hebdomadaires et fixons-en de nouveaux pour la semaine prochaine.'
          }
        },
        chatMessages: {
          morningGreeting: 'Bonjour à tous ! Prêts pour une autre journée productive ? 🌅',
          meditationResponse: 'Bonjour Sarah ! Je viens de terminer ma méditation de 5 minutes. Je me sens bien ! 🧘‍♂️'
        }
      },
      healthWellnessWarriors: {
        name: 'Guerriers de la Santé et du Bien-être',
        description: 'Une communauté de soutien axée sur le bien-être physique et mental. Partagez votre parcours fitness et restez motivé !',
        tags: ['fitness', 'bien-être', 'santé-mentale', 'nutrition'],
        rules: ['Soyez solidaire', 'Partagez les progrès', 'Pas de jugement'],
        topics: ['Routines d\'exercice', 'Conseils nutritionnels', 'Santé mentale']
      },
      learningEnthusiasts: {
        name: 'Passionnés d\'Apprentissage',
        description: 'Élargissez vos connaissances avec d\'autres apprenants. Nous explorons divers sujets et partageons des ressources.',
        tags: ['apprentissage', 'éducation', 'connaissances', 'compétences'],
        rules: ['Partagez les ressources', 'Posez des questions', 'Aidez les autres à apprendre'],
        topics: ['Développement de compétences', 'Discussions de livres', 'Cours en ligne']
      },
      motivationBoosters: {
        name: 'Boosters de Motivation',
        description: 'Restez motivé et inspiré avec des encouragements quotidiens et des histoires de réussite.',
        tags: ['motivation', 'inspiration', 'succès', 'état-d\'esprit'],
        rules: ['Partagez les victoires', 'Encouragez les autres', 'Restez positif'],
        topics: ['Histoires de réussite', 'Techniques de motivation', 'Changements d\'état d\'esprit']
      }
    },
    zh: {
      morningProductivityMasters: {
        name: '晨间生产力大师',
        description: '加入我们的每日晨间例行公事和生产力技巧。我们专注于建立持久的可持续习惯。',
        tags: ['晨间', '生产力', '习惯', '例行公事'],
        rules: ['保持尊重', '分享你的进步', '支持他人'],
        topics: ['晨间例行公事', '时间管理', '目标设定'],
        sessions: {
          weeklyGoalReview: {
            title: '每周目标回顾',
            description: '让我们回顾我们的每周目标并为下周设定新的目标。'
          }
        },
        chatMessages: {
          morningGreeting: '大家早上好！准备好迎接另一个富有成效的一天了吗？🌅',
          meditationResponse: '早上好Sarah！我刚完成了5分钟的冥想。感觉很好！🧘‍♂️'
        }
      },
      healthWellnessWarriors: {
        name: '健康与福祉战士',
        description: '一个专注于身心健康支持的社区。分享你的健身之旅并获得动力！',
        tags: ['健身', '福祉', '心理健康', '营养'],
        rules: ['保持支持', '分享进步', '不评判'],
        topics: ['锻炼例行公事', '营养技巧', '心理健康']
      },
      learningEnthusiasts: {
        name: '学习爱好者',
        description: '与其他学习者一起扩展你的知识。我们探索各种主题并分享资源。',
        tags: ['学习', '教育', '知识', '技能'],
        rules: ['分享资源', '提出问题', '帮助他人学习'],
        topics: ['技能发展', '书籍讨论', '在线课程']
      },
      motivationBoosters: {
        name: '动力助推器',
        description: '通过每日鼓励和成功故事保持动力和灵感。',
        tags: ['动力', '灵感', '成功', '心态'],
        rules: ['分享胜利', '鼓励他人', '保持积极'],
        topics: ['成功故事', '动力技巧', '心态转变']
      }
    }
  };

  return translations[language as keyof typeof translations] || translations.en;
};

// Helper function to get category key (consistent across languages)
const getCategoryKey = (category: string): string => {
  // Map any translated category back to its key
  const categoryMap: { [key: string]: string } = {
    // English
    'Productivity': 'productivity',
    'Health': 'health',
    'Learning': 'learning',
    'Motivation': 'motivation',
    // Spanish
    'Productividad': 'productivity',
    'Salud': 'health',
    'Aprendizaje': 'learning',
    'Motivación': 'motivation',
    // French
    'Productivité': 'productivity',
    'Santé': 'health',
    'Apprentissage': 'learning',
    // Chinese
    '生产力': 'productivity',
    '健康': 'health',
    '学习': 'learning',
    '动力': 'motivation'
  };
  
  return categoryMap[category] || 'productivity';
};

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  maxMembers: number;
  currentMembers: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  tags: string[];
  meetingSchedule?: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number;
    time?: string;
    duration: number; // minutes
  };
  rules: string[];
  topics: string[];
  members?: StudyGroupMember[];
  analytics?: StudyGroupAnalytics;
  chatMessages?: ChatMessage[];
  upcomingSessions?: StudySession[];
}

export interface StudyGroupMember {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  role: 'leader' | 'member' | 'moderator';
  contributionScore: number;
  lastActive: string;
}

export interface StudyGroupAnalytics {
  totalSessions: number;
  averageAttendance: number;
  completionRate: number;
  memberEngagement: number;
  topContributors: StudyGroupMember[];
  recentActivity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  type: 'session_created' | 'member_joined' | 'message_sent' | 'resource_shared';
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: string[];
}

export interface StudySession {
  id: string;
  groupId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  duration: number; // minutes
  maxParticipants: number;
  currentParticipants: number;
  leader: string;
  topics: string[];
  materials?: string[];
  isCompleted: boolean;
  notes?: string;
  participants?: StudySessionParticipant[];
  meetingLink?: string;
  recordingUrl?: string;
}

export interface StudySessionParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: 'confirmed' | 'pending' | 'declined';
  joinedAt?: string;
  leftAt?: string;
}

export interface LearningCircle {
  id: string;
  name: string;
  description: string;
  focus: string;
  maxMembers: number;
  currentMembers: number;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
  commitment: 'casual' | 'moderate' | 'intensive';
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  nextMeeting?: string;
}

export interface PeerRecommendation {
  id: string;
  fromUserId: string;
  toUserId: string;
  courseId: string;
  courseTitle: string;
  reason: string;
  confidence: number; // 1-5 scale
  createdAt: string;
  isAccepted?: boolean;
  feedback?: string;
  category?: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  // New fields for enhanced recommendations
  title: string;
  description: string;
  personalExperience: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  timeCommitment: string;
  isActive: boolean; // for weekly refresh
  featured: boolean;
  totalRatings: number;
  averageRating: number;
  comments: RecommendationComment[];
  userName?: string; // Display name of the user who created it
}

export interface RecommendationComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  helpfulVotes: number;
  isHelpful?: boolean; // for current user
}

export interface SocialLearningStats {
  studyGroupsCreated: number;
  studyGroupsJoined: number;
  studySessionsCompleted: number;
  studySessionsLed: number;
  learningCirclesJoined: number;
  peerRecommendationsGiven: number;
  peerRecommendationsReceived: number;
  totalLearningTime: number; // minutes
  collaborativeProjects: number;
  knowledgeShared: number;
}

class SocialLearningService {
  private static instance: SocialLearningService;
  private userId: string | null = null;

  static getInstance(): SocialLearningService {
    if (!SocialLearningService.instance) {
      SocialLearningService.instance = new SocialLearningService();
    }
    return SocialLearningService.instance;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private getStorageKey(key: string): string {
    return this.userId ? `social_learning_${this.userId}_${key}` : `social_learning_${key}`;
  }

  // Enhanced Study Groups
  async createStudyGroup(group: Omit<StudyGroup, 'id' | 'createdAt' | 'currentMembers' | 'members' | 'analytics' | 'chatMessages' | 'upcomingSessions'>): Promise<StudyGroup> {
    const newGroup: StudyGroup = {
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      currentMembers: 1,
      members: [{
        id: this.userId || 'unknown',
        name: 'You',
        joinedAt: new Date().toISOString(),
        role: 'leader',
        contributionScore: 0,
        lastActive: new Date().toISOString()
      }],
      analytics: {
        totalSessions: 0,
        averageAttendance: 0,
        completionRate: 0,
        memberEngagement: 0,
        topContributors: [],
        recentActivity: []
      },
      chatMessages: [],
      upcomingSessions: []
    };

    const groups = await this.getStudyGroups();
    groups.push(newGroup);
    await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));

    // Add activity log
    await this.addActivityLog(newGroup.id, 'session_created', 'Group created');

    return newGroup;
  }

  async clearStoredGroups(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getStorageKey('study_groups'));
    } catch (error) {
      console.error('Error clearing stored groups:', error);
    }
  }

  async clearStoredRecommendations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getStorageKey('peer_recommendations'));
    } catch (error) {
      console.error('Error clearing stored recommendations:', error);
    }
  }

  async getStudyGroups(language: string = 'en'): Promise<StudyGroup[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('study_groups'));
      const storedGroups = data ? JSON.parse(data) : [];
      
      // If no groups exist, create sample groups for demonstration
      if (storedGroups.length === 0) {
        const translatedData = getTranslatedSampleGroups(language);
        
        const sampleGroups: StudyGroup[] = [
          {
            id: 'sample_group_1',
            name: translatedData.morningProductivityMasters.name,
            description: translatedData.morningProductivityMasters.description,
            category: 'productivity',
            maxMembers: 20,
            currentMembers: 8,
            createdBy: this.userId || 'sample_user_1', // Use current user ID if available
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            tags: translatedData.morningProductivityMasters.tags,
            rules: translatedData.morningProductivityMasters.rules,
            topics: translatedData.morningProductivityMasters.topics,
            members: [
              {
                id: this.userId || 'sample_user_1',
                name: 'You',
                joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'leader',
                contributionScore: 95,
                lastActive: new Date().toISOString()
              },
              {
                id: 'sample_user_2',
                name: 'Mike Johnson',
                joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'member',
                contributionScore: 78,
                lastActive: new Date().toISOString()
              }
            ],
            analytics: {
              totalSessions: 12,
              averageAttendance: 6.5,
              completionRate: 85,
              memberEngagement: 92,
              topContributors: [],
              recentActivity: []
            },
            chatMessages: [
              {
                id: 'msg_1',
                groupId: 'sample_group_1',
                userId: this.userId || 'sample_user_1',
                userName: 'You',
                message: translatedData.morningProductivityMasters.chatMessages.morningGreeting,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                type: 'text'
              },
              {
                id: 'msg_2',
                groupId: 'sample_group_1',
                userId: 'sample_user_2',
                userName: 'Mike Johnson',
                message: translatedData.morningProductivityMasters.chatMessages.meditationResponse,
                timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
                type: 'text'
              }
            ],
            upcomingSessions: [
              {
                id: 'session_1',
                groupId: 'sample_group_1',
                title: translatedData.morningProductivityMasters.sessions.weeklyGoalReview.title,
                description: translatedData.morningProductivityMasters.sessions.weeklyGoalReview.description,
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                startTime: '09:00',
                duration: 60,
                maxParticipants: 15,
                currentParticipants: 6,
                leader: this.userId || 'sample_user_1',
                topics: ['Goal setting', 'Progress review'],
                isCompleted: false
              }
            ]
          },
          {
            id: 'sample_group_2',
            name: translatedData.healthWellnessWarriors.name,
            description: translatedData.healthWellnessWarriors.description,
            category: 'health',
            maxMembers: 25,
            currentMembers: 15,
            createdBy: 'sample_user_3',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            tags: translatedData.healthWellnessWarriors.tags,
            rules: translatedData.healthWellnessWarriors.rules,
            topics: translatedData.healthWellnessWarriors.topics,
            members: [
              {
                id: 'sample_user_3',
                name: 'Alex Rodriguez',
                joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'leader',
                contributionScore: 88,
                lastActive: new Date().toISOString()
              }
            ],
            analytics: {
              totalSessions: 8,
              averageAttendance: 12,
              completionRate: 78,
              memberEngagement: 85,
              topContributors: [],
              recentActivity: []
            },
            chatMessages: [],
            upcomingSessions: []
          },
          {
            id: 'sample_group_3',
            name: translatedData.learningEnthusiasts.name,
            description: translatedData.learningEnthusiasts.description,
            category: 'learning',
            maxMembers: 30,
            currentMembers: 22,
            createdBy: 'sample_user_4',
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            tags: translatedData.learningEnthusiasts.tags,
            rules: translatedData.learningEnthusiasts.rules,
            topics: translatedData.learningEnthusiasts.topics,
            members: [
              {
                id: 'sample_user_4',
                name: 'Emma Wilson',
                joinedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'leader',
                contributionScore: 92,
                lastActive: new Date().toISOString()
              }
            ],
            analytics: {
              totalSessions: 15,
              averageAttendance: 18,
              completionRate: 91,
              memberEngagement: 89,
              topContributors: [],
              recentActivity: []
            },
            chatMessages: [],
            upcomingSessions: []
          },
          {
            id: 'sample_group_4',
            name: translatedData.motivationBoosters.name,
            description: translatedData.motivationBoosters.description,
            category: 'motivation',
            maxMembers: 18,
            currentMembers: 12,
            createdBy: 'sample_user_5',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            tags: translatedData.motivationBoosters.tags,
            rules: translatedData.motivationBoosters.rules,
            topics: translatedData.motivationBoosters.topics,
            members: [
              {
                id: 'sample_user_5',
                name: 'David Kim',
                joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'leader',
                contributionScore: 87,
                lastActive: new Date().toISOString()
              }
            ],
            analytics: {
              totalSessions: 6,
              averageAttendance: 10,
              completionRate: 82,
              memberEngagement: 94,
              topContributors: [],
              recentActivity: []
            },
            chatMessages: [],
            upcomingSessions: []
          }
        ];
        
        // Save sample groups to storage
        await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(sampleGroups));
        return sampleGroups;
      }
      
      return storedGroups;
    } catch (error) {
      console.error('Error getting study groups:', error);
      return [];
    }
  }

  async joinStudyGroup(groupId: string): Promise<boolean> {
    try {
      const groups = await this.getStudyGroups();
      const groupIndex = groups.findIndex(g => g.id === groupId);
      
      if (groupIndex === -1 || groups[groupIndex].currentMembers >= groups[groupIndex].maxMembers) {
        return false;
      }

      groups[groupIndex].currentMembers++;
      
      // Add member to group
      if (!groups[groupIndex].members) {
        groups[groupIndex].members = [];
      }
      
      groups[groupIndex].members.push({
        id: this.userId || 'unknown',
        name: 'You',
        joinedAt: new Date().toISOString(),
        role: 'member',
        contributionScore: 0,
        lastActive: new Date().toISOString()
      });

      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
      
      // Add activity log
      await this.addActivityLog(groupId, 'member_joined', 'New member joined');

      return true;
    } catch (error) {
      console.error('Error joining study group:', error);
      return false;
    }
  }

  async leaveStudyGroup(groupId: string): Promise<boolean> {
    try {
      const groups = await this.getStudyGroups();
      const groupIndex = groups.findIndex(g => g.id === groupId);
      
      if (groupIndex === -1) {
        return false;
      }

      if (groups[groupIndex].currentMembers > 0) {
        groups[groupIndex].currentMembers--;
      }
      
      // Remove member from group
      if (groups[groupIndex].members) {
        groups[groupIndex].members = groups[groupIndex].members.filter(m => m.id !== this.userId);
      }
      
      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
      return true;
    } catch (error) {
      console.error('Error leaving study group:', error);
      return false;
    }
  }

  // Chat functionality
  async sendChatMessage(groupId: string, message: string, type: 'text' | 'image' | 'file' = 'text', attachments?: string[]): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      userId: this.userId || 'unknown',
      userName: 'You',
      message,
      timestamp: new Date().toISOString(),
      type,
      attachments
    };

    const groups = await this.getStudyGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      if (!groups[groupIndex].chatMessages) {
        groups[groupIndex].chatMessages = [];
      }
      groups[groupIndex].chatMessages.push(chatMessage);
      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
      
      // Add activity log
      await this.addActivityLog(groupId, 'message_sent', 'Message sent');
    }

    return chatMessage;
  }

  async getChatMessages(groupId: string): Promise<ChatMessage[]> {
    const groups = await this.getStudyGroups();
    const group = groups.find(g => g.id === groupId);
    return group?.chatMessages || [];
  }

  // Scheduling functionality
  async createStudySession(groupId: string, session: Omit<StudySession, 'id' | 'currentParticipants' | 'participants'>): Promise<StudySession> {
    const newSession: StudySession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentParticipants: 1,
      participants: [{
        id: this.userId || 'unknown',
        name: 'You',
        status: 'confirmed',
        joinedAt: new Date().toISOString()
      }]
    };

    const groups = await this.getStudyGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      if (!groups[groupIndex].upcomingSessions) {
        groups[groupIndex].upcomingSessions = [];
      }
      groups[groupIndex].upcomingSessions.push(newSession);
      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
      
      // Add activity log
      await this.addActivityLog(groupId, 'session_created', `Session created: ${newSession.title}`);
    }

    return newSession;
  }

  async joinStudySession(groupId: string, sessionId: string): Promise<boolean> {
    const groups = await this.getStudyGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return false;

    const group = groups[groupIndex];
    if (!group.upcomingSessions) return false;
    
    const sessionIndex = group.upcomingSessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return false;

    const session = group.upcomingSessions[sessionIndex];
    if (session.currentParticipants >= session.maxParticipants) return false;

    session.currentParticipants++;
    if (!session.participants) {
      session.participants = [];
    }
    
    session.participants.push({
      id: this.userId || 'unknown',
      name: 'You',
      status: 'confirmed',
      joinedAt: new Date().toISOString()
    });

    await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
    return true;
  }

  // Analytics functionality
  async getStudyGroupAnalytics(groupId: string): Promise<StudyGroupAnalytics | null> {
    const groups = await this.getStudyGroups();
    const group = groups.find(g => g.id === groupId);
    return group?.analytics || null;
  }

  async updateStudyGroupAnalytics(groupId: string, analytics: Partial<StudyGroupAnalytics>): Promise<void> {
    const groups = await this.getStudyGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      if (!groups[groupIndex].analytics) {
        groups[groupIndex].analytics = {
          totalSessions: 0,
          averageAttendance: 0,
          completionRate: 0,
          memberEngagement: 0,
          topContributors: [],
          recentActivity: []
        };
      }
      
      groups[groupIndex].analytics = { ...groups[groupIndex].analytics!, ...analytics };
      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
    }
  }

  // Activity logging
  private async addActivityLog(groupId: string, type: ActivityLog['type'], details: string): Promise<void> {
    const groups = await this.getStudyGroups();
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      if (!groups[groupIndex].analytics) {
        groups[groupIndex].analytics = {
          totalSessions: 0,
          averageAttendance: 0,
          completionRate: 0,
          memberEngagement: 0,
          topContributors: [],
          recentActivity: []
        };
      }

      const activityLog: ActivityLog = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId: this.userId || 'unknown',
        userName: 'You',
        timestamp: new Date().toISOString(),
        details
      };

      groups[groupIndex].analytics!.recentActivity.unshift(activityLog);
      
      // Keep only last 50 activities
      if (groups[groupIndex].analytics!.recentActivity.length > 50) {
        groups[groupIndex].analytics!.recentActivity = groups[groupIndex].analytics!.recentActivity.slice(0, 50);
      }

      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
    }
  }

  // Learning Circles
  async createLearningCircle(circle: Omit<LearningCircle, 'id' | 'createdAt' | 'currentMembers'>): Promise<LearningCircle> {
    const newCircle: LearningCircle = {
      ...circle,
      id: `circle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      currentMembers: 1,
    };

    const circles = await this.getLearningCircles();
    circles.push(newCircle);
    await AsyncStorage.setItem(this.getStorageKey('learning_circles'), JSON.stringify(circles));

    return newCircle;
  }

  async getLearningCircles(): Promise<LearningCircle[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('learning_circles'));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting learning circles:', error);
      return [];
    }
  }

  async joinLearningCircle(circleId: string): Promise<boolean> {
    try {
      const circles = await this.getLearningCircles();
      const circleIndex = circles.findIndex(c => c.id === circleId);
      
      if (circleIndex === -1 || circles[circleIndex].currentMembers >= circles[circleIndex].maxMembers) {
        return false;
      }

      circles[circleIndex].currentMembers++;
      await AsyncStorage.setItem(this.getStorageKey('learning_circles'), JSON.stringify(circles));
      return true;
    } catch (error) {
      console.error('Error joining learning circle:', error);
      return false;
    }
  }

  // Peer Recommendations
  async createPeerRecommendation(recommendation: Omit<PeerRecommendation, 'id' | 'createdAt'>): Promise<PeerRecommendation> {
    const newRecommendation: PeerRecommendation = {
      ...recommendation,
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const recommendations = await this.getPeerRecommendations();
    recommendations.push(newRecommendation);
    await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));

    return newRecommendation;
  }

  // Enhanced method for creating user-generated recommendations
  async createUserRecommendation(recommendation: {
    title: string;
    description: string;
    personalExperience: string;
    category: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    timeCommitment: string;
    tags: string[];
    userName: string;
  }): Promise<PeerRecommendation> {
    const newRecommendation: PeerRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId: this.userId || 'unknown',
      toUserId: 'community',
      courseId: `habit_${Date.now()}`,
      courseTitle: recommendation.title,
      reason: recommendation.description,
      confidence: 5,
      createdAt: new Date().toISOString(),
      category: recommendation.category,
      tags: recommendation.tags,
      title: recommendation.title,
      description: recommendation.description,
      personalExperience: recommendation.personalExperience,
      difficultyLevel: recommendation.difficultyLevel,
      timeCommitment: recommendation.timeCommitment,
      isActive: true,
      featured: false,
      totalRatings: 0,
      averageRating: 0,
      comments: [],
      userName: recommendation.userName,
    };

    const recommendations = await this.getPeerRecommendations();
    recommendations.push(newRecommendation);
    await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));

    return newRecommendation;
  }

  async getPeerRecommendations(language: string = 'en'): Promise<PeerRecommendation[]> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey('peer_recommendations'));
      let recommendations = data ? JSON.parse(data) : [];
      
      // If no recommendations exist, create sample data for demonstration
      if (recommendations.length === 0) {
        const sampleRecommendations = this.getTranslatedSampleRecommendations(language);
        recommendations = sampleRecommendations;
        await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting peer recommendations:', error);
      return [];
    }
  }

  private getTranslatedSampleRecommendations(language: string): PeerRecommendation[] {
    const translations = {
      en: {
        morningMeditation: {
          title: 'Morning Meditation Routine',
          description: 'Start your day with a peaceful 10-minute meditation session',
          personalExperience: 'I started this habit 3 months ago and it has completely transformed my mornings. I feel more centered and ready to tackle the day ahead.',
          comment1: 'This has been a game-changer for my stress levels!',
          comment2: 'I love how simple yet effective this is. Perfect for beginners!',
          timeCommitment: '10 minutes daily'
        },
        readingChallenge: {
          title: '30-Day Reading Challenge',
          description: 'Read for at least 20 minutes every day for 30 days',
          personalExperience: 'I used to struggle with reading consistently. This challenge helped me build the habit, and now I read 2-3 books per month!',
          comment1: 'Just finished the challenge! My reading speed has improved so much.',
          timeCommitment: '20 minutes daily'
        },
        hydrationTracker: {
          title: 'Hydration Tracker',
          description: 'Drink 8 glasses of water daily and track your intake',
          personalExperience: 'I was always dehydrated and tired. This simple habit changed everything - I have more energy and my skin looks better too!',
          timeCommitment: 'Throughout the day'
        },
        gratitudeJournal: {
          title: 'Evening Gratitude Journal',
          description: 'Write down 3 things you\'re grateful for every evening',
          personalExperience: 'This habit has made me more positive and appreciative of the little things in life. Highly recommend for anyone feeling stressed!',
          timeCommitment: '5 minutes daily'
        }
      },
      es: {
        morningMeditation: {
          title: 'Rutina de Meditación Matutina',
          description: 'Comienza tu día con una sesión de meditación pacífica de 10 minutos',
          personalExperience: 'Comencé este hábito hace 3 meses y ha transformado completamente mis mañanas. Me siento más centrado y listo para enfrentar el día.',
          comment1: '¡Esto ha sido un cambio total para mis niveles de estrés!',
          comment2: 'Me encanta lo simple pero efectivo que es. ¡Perfecto para principiantes!',
          timeCommitment: '10 minutos diarios'
        },
        readingChallenge: {
          title: 'Desafío de Lectura de 30 Días',
          description: 'Lee durante al menos 20 minutos todos los días durante 30 días',
          personalExperience: 'Solía tener problemas para leer consistentemente. Este desafío me ayudó a construir el hábito, ¡y ahora leo 2-3 libros por mes!',
          comment1: '¡Acabo de terminar el desafío! Mi velocidad de lectura ha mejorado mucho.',
          timeCommitment: '20 minutos diarios'
        },
        hydrationTracker: {
          title: 'Rastreador de Hidratación',
          description: 'Bebe 8 vasos de agua diariamente y rastrea tu consumo',
          personalExperience: 'Siempre estaba deshidratado y cansado. Este simple hábito cambió todo - ¡tengo más energía y mi piel se ve mejor también!',
          timeCommitment: 'Durante todo el día'
        },
        gratitudeJournal: {
          title: 'Diario de Gratitud Nocturno',
          description: 'Escribe 3 cosas por las que estés agradecido cada noche',
          personalExperience: 'Este hábito me ha hecho más positivo y agradecido por las pequeñas cosas de la vida. ¡Altamente recomendado para cualquiera que se sienta estresado!',
          timeCommitment: '5 minutos diarios'
        }
      },
      fr: {
        morningMeditation: {
          title: 'Routine de Méditation Matinale',
          description: 'Commencez votre journée par une séance de méditation paisible de 10 minutes',
          personalExperience: 'J\'ai commencé cette habitude il y a 3 mois et cela a complètement transformé mes matins. Je me sens plus centré et prêt à affronter la journée.',
          comment1: 'Cela a été un changement total pour mes niveaux de stress !',
          comment2: 'J\'aime à quel point c\'est simple mais efficace. Parfait pour les débutants !',
          timeCommitment: '10 minutes quotidiennes'
        },
        readingChallenge: {
          title: 'Défi de Lecture de 30 Jours',
          description: 'Lisez pendant au moins 20 minutes chaque jour pendant 30 jours',
          personalExperience: 'J\'avais du mal à lire régulièrement. Ce défi m\'a aidé à construire l\'habitude, et maintenant je lis 2-3 livres par mois !',
          comment1: 'Je viens de terminer le défi ! Ma vitesse de lecture s\'est tellement améliorée.',
          timeCommitment: '20 minutes quotidiennes'
        },
        hydrationTracker: {
          title: 'Suivi d\'Hydratation',
          description: 'Buvez 8 verres d\'eau quotidiennement et suivez votre consommation',
          personalExperience: 'J\'étais toujours déshydraté et fatigué. Cette simple habitude a tout changé - j\'ai plus d\'énergie et ma peau a l\'air mieux aussi !',
          timeCommitment: 'Tout au long de la journée'
        },
        gratitudeJournal: {
          title: 'Journal de Gratitude du Soir',
          description: 'Écrivez 3 choses pour lesquelles vous êtes reconnaissant chaque soir',
          personalExperience: 'Cette habitude m\'a rendu plus positif et reconnaissant pour les petites choses de la vie. Très recommandé pour quiconque se sent stressé !',
          timeCommitment: '5 minutes quotidiennes'
        }
      },
      zh: {
        morningMeditation: {
          title: '晨间冥想习惯',
          description: '以10分钟的平静冥想开始您的一天',
          personalExperience: '我3个月前开始这个习惯，它完全改变了我的早晨。我感到更加专注，准备好迎接新的一天。',
          comment1: '这对我的压力水平来说是一个巨大的改变！',
          comment2: '我喜欢它简单而有效。对初学者来说很完美！',
          timeCommitment: '每天10分钟'
        },
        readingChallenge: {
          title: '30天阅读挑战',
          description: '连续30天每天至少阅读20分钟',
          personalExperience: '我以前很难坚持阅读。这个挑战帮助我养成了习惯，现在我每月读2-3本书！',
          comment1: '刚完成挑战！我的阅读速度提高了很多。',
          timeCommitment: '每天20分钟'
        },
        hydrationTracker: {
          title: '水分追踪器',
          description: '每天喝8杯水并记录摄入量',
          personalExperience: '我以前总是脱水和疲劳。这个简单的习惯改变了一切 - 我更有精力，皮肤也看起来更好了！',
          timeCommitment: '全天'
        },
        gratitudeJournal: {
          title: '晚间感恩日记',
          description: '每天晚上写下3件您感恩的事情',
          personalExperience: '这个习惯让我对生活中的小事更加积极和感恩。强烈推荐给任何感到压力的人！',
          timeCommitment: '每天5分钟'
        }
      }
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    return [
      {
        id: 'sample_rec_1',
        fromUserId: 'user_1',
        toUserId: 'community',
        courseId: 'habit_1',
        courseTitle: t.morningMeditation.title,
        reason: 'A simple 10-minute meditation practice',
        confidence: 5,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        title: t.morningMeditation.title,
        description: t.morningMeditation.description,
        personalExperience: t.morningMeditation.personalExperience,
        difficultyLevel: 'beginner',
        timeCommitment: t.morningMeditation.timeCommitment,
        isActive: true,
        featured: false,
        totalRatings: 12,
        averageRating: 4.8,
        comments: [
          {
            id: 'comment_1',
            userId: 'user_2',
            userName: 'Sarah M.',
            comment: t.morningMeditation.comment1,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            helpfulVotes: 5
          },
          {
            id: 'comment_2',
            userId: 'user_3',
            userName: 'Mike R.',
            comment: t.morningMeditation.comment2,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            helpfulVotes: 3
          }
        ],
        userName: 'Emma Johnson',
        category: 'mindfulness',
        tags: ['peerRecommendations.tags.meditation', 'peerRecommendations.tags.morning', 'peerRecommendations.tags.stress-relief', 'peerRecommendations.tags.beginner-friendly']
      },
      {
        id: 'sample_rec_2',
        fromUserId: 'user_2',
        toUserId: 'community',
        courseId: 'habit_2',
        courseTitle: t.readingChallenge.title,
        reason: 'Build a consistent reading habit',
        confidence: 5,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        title: t.readingChallenge.title,
        description: t.readingChallenge.description,
        personalExperience: t.readingChallenge.personalExperience,
        difficultyLevel: 'intermediate',
        timeCommitment: t.readingChallenge.timeCommitment,
        isActive: true,
        featured: true,
        totalRatings: 28,
        averageRating: 4.9,
        comments: [
          {
            id: 'comment_3',
            userId: 'user_4',
            userName: 'Alex K.',
            comment: t.readingChallenge.comment1,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            helpfulVotes: 8
          }
        ],
        userName: 'David Chen',
        category: 'learning',
        tags: ['peerRecommendations.tags.reading', 'peerRecommendations.tags.challenge', 'peerRecommendations.tags.productivity', 'peerRecommendations.tags.knowledge']
      },
      {
        id: 'sample_rec_3',
        fromUserId: 'user_3',
        toUserId: 'community',
        courseId: 'habit_3',
        courseTitle: t.hydrationTracker.title,
        reason: 'Stay properly hydrated throughout the day',
        confidence: 5,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        title: t.hydrationTracker.title,
        description: t.hydrationTracker.description,
        personalExperience: t.hydrationTracker.personalExperience,
        difficultyLevel: 'beginner',
        timeCommitment: t.hydrationTracker.timeCommitment,
        isActive: true,
        featured: false,
        totalRatings: 15,
        averageRating: 4.6,
        comments: [],
        userName: 'Lisa Wang',
        category: 'healthFitness',
        tags: ['peerRecommendations.tags.hydration', 'peerRecommendations.tags.health', 'peerRecommendations.tags.energy', 'peerRecommendations.tags.wellness']
      },
      {
        id: 'sample_rec_4',
        fromUserId: 'user_4',
        toUserId: 'community',
        courseId: 'habit_4',
        courseTitle: t.gratitudeJournal.title,
        reason: 'Practice gratitude and improve mental well-being',
        confidence: 5,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        title: t.gratitudeJournal.title,
        description: t.gratitudeJournal.description,
        personalExperience: t.gratitudeJournal.personalExperience,
        difficultyLevel: 'beginner',
        timeCommitment: t.gratitudeJournal.timeCommitment,
        isActive: true,
        featured: false,
        totalRatings: 7,
        averageRating: 4.7,
        comments: [],
        userName: 'Maria Garcia',
        category: 'mindfulness',
        tags: ['peerRecommendations.tags.gratitude', 'peerRecommendations.tags.journaling', 'peerRecommendations.tags.mental-health', 'peerRecommendations.tags.positivity']
      }
    ];
  }

  // Get active recommendations for weekly display
  async getActiveRecommendations(language: string = 'en'): Promise<PeerRecommendation[]> {
    const allRecommendations = await this.getPeerRecommendations(language);
    return allRecommendations.filter(rec => rec.isActive);
  }

  // Get featured recommendations (top-rated from previous weeks)
  async getFeaturedRecommendations(language: string = 'en'): Promise<PeerRecommendation[]> {
    const allRecommendations = await this.getPeerRecommendations(language);
    return allRecommendations
      .filter(rec => rec.featured && rec.averageRating >= 4)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }

  // Rate a recommendation
  async rateRecommendation(recommendationId: string, rating: number, language: string = 'en'): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations(language);
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      const recommendation = recommendations[recIndex];
      const newTotalRatings = recommendation.totalRatings + 1;
      const newAverageRating = ((recommendation.averageRating * recommendation.totalRatings) + rating) / newTotalRatings;

      recommendations[recIndex] = {
        ...recommendation,
        totalRatings: newTotalRatings,
        averageRating: Math.round(newAverageRating * 10) / 10, // Round to 1 decimal
      };
      
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error rating recommendation:', error);
      return false;
    }
  }

  // Add comment to a recommendation
  async addComment(recommendationId: string, comment: string, userName: string, language: string = 'en'): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations(language);
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      const newComment: RecommendationComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: this.userId || 'unknown',
        userName: userName,
        comment: comment,
        createdAt: new Date().toISOString(),
        helpfulVotes: 0,
      };

      recommendations[recIndex].comments = recommendations[recIndex].comments || [];
      recommendations[recIndex].comments.push(newComment);
      
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }

  // Vote on comment helpfulness
  async voteComment(recommendationId: string, commentId: string, isHelpful: boolean, language: string = 'en'): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations(language);
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      const commentIndex = recommendations[recIndex].comments?.findIndex(c => c.id === commentId);
      if (commentIndex === -1 || !recommendations[recIndex].comments) {
        return false;
      }

      if (isHelpful) {
        recommendations[recIndex].comments[commentIndex].helpfulVotes += 1;
      } else {
        recommendations[recIndex].comments[commentIndex].helpfulVotes = Math.max(0, recommendations[recIndex].comments[commentIndex].helpfulVotes - 1);
      }
      
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error voting on comment:', error);
      return false;
    }
  }

  // Weekly refresh - deactivate old recommendations and activate new ones
  async refreshWeeklyRecommendations(): Promise<void> {
    try {
      const recommendations = await this.getPeerRecommendations();
      
      // Deactivate all current recommendations
      recommendations.forEach(rec => {
        rec.isActive = false;
      });

      // Mark top-rated recommendations as featured
      recommendations
        .filter(rec => rec.averageRating >= 4 && rec.totalRatings >= 3)
        .forEach(rec => {
          rec.featured = true;
        });

      // Activate new recommendations (in a real app, this would be based on new submissions)
      const newRecommendations = recommendations
        .filter(rec => !rec.featured)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      newRecommendations.forEach(rec => {
        rec.isActive = true;
      });

      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
    } catch (error) {
      console.error('Error refreshing weekly recommendations:', error);
    }
  }

  // Search recommendations
  async searchRecommendations(query: string, category?: string, language: string = 'en'): Promise<PeerRecommendation[]> {
    const recommendations = await this.getActiveRecommendations(language);
    
    return recommendations.filter(rec => {
      const matchesQuery = query === '' || 
        rec.title.toLowerCase().includes(query.toLowerCase()) ||
        rec.description.toLowerCase().includes(query.toLowerCase()) ||
        rec.personalExperience.toLowerCase().includes(query.toLowerCase()) ||
        rec.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || rec.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  async acceptPeerRecommendation(recommendationId: string, feedback?: string, language: string = 'en'): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations(language);
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      recommendations[recIndex].isAccepted = true;
      if (feedback) {
        recommendations[recIndex].feedback = feedback;
      }
      
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error accepting peer recommendation:', error);
      return false;
    }
  }

  async rejectPeerRecommendation(recommendationId: string, feedback?: string, language: string = 'en'): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations(language);
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      recommendations[recIndex].isAccepted = false;
      if (feedback) {
        recommendations[recIndex].feedback = feedback;
      }
      
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error rejecting peer recommendation:', error);
      return false;
    }
  }

  // Statistics
  async getSocialLearningStats(language: string = 'en'): Promise<SocialLearningStats> {
    try {
      const groups = await this.getStudyGroups(language);
      const circles = await this.getLearningCircles();
      const recommendations = await this.getPeerRecommendations(language);

      // Calculate sessions from groups
      const allSessions: StudySession[] = [];
      groups.forEach(group => {
        if (group.upcomingSessions) {
          allSessions.push(...group.upcomingSessions);
        }
      });

      const stats: SocialLearningStats = {
        studyGroupsCreated: groups.filter(g => g.createdBy === this.userId).length,
        studyGroupsJoined: groups.filter(g => g.currentMembers > 0).length,
        studySessionsCompleted: allSessions.filter(s => s.isCompleted).length,
        studySessionsLed: allSessions.filter(s => s.leader === this.userId).length,
        learningCirclesJoined: circles.filter(c => c.currentMembers > 0).length,
        peerRecommendationsGiven: recommendations.filter(r => r.fromUserId === this.userId).length,
        peerRecommendationsReceived: recommendations.filter(r => r.toUserId === this.userId).length,
        totalLearningTime: allSessions.filter(s => s.isCompleted).reduce((total: number, s: StudySession) => total + s.duration, 0),
        collaborativeProjects: 0, // Placeholder
        knowledgeShared: 0, // Placeholder
      };

      return stats;
    } catch (error) {
      console.error('Error getting social learning stats:', error);
      return {
        studyGroupsCreated: 0,
        studyGroupsJoined: 0,
        studySessionsCompleted: 0,
        studySessionsLed: 0,
        learningCirclesJoined: 0,
        peerRecommendationsGiven: 0,
        peerRecommendationsReceived: 0,
        totalLearningTime: 0,
        collaborativeProjects: 0,
        knowledgeShared: 0,
      };
    }
  }

  // Search and Discovery
  async searchStudyGroups(query: string, category?: string): Promise<StudyGroup[]> {
    const groups = await this.getStudyGroups();
    return groups.filter(group => {
      const matchesQuery = group.name.toLowerCase().includes(query.toLowerCase()) ||
                          group.description.toLowerCase().includes(query.toLowerCase()) ||
                          group.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || group.category === category;
      
      return matchesQuery && matchesCategory && group.isActive;
    });
  }

  async getRecommendedStudyGroups(): Promise<StudyGroup[]> {
    // Simple recommendation based on user's learning history
    const groups = await this.getStudyGroups();
    return groups
      .filter(g => g.isActive && g.currentMembers < g.maxMembers)
      .sort((a, b) => b.currentMembers - a.currentMembers)
      .slice(0, 5);
  }

  async getRecommendedCoursesForUser(userId: string): Promise<string[]> {
    // Placeholder for course recommendation logic
    // In a real implementation, this would use ML/AI to recommend courses
    return ['course_1', 'course_2', 'course_3'];
  }

  // Delete methods
  async deleteStudyGroup(groupId: string): Promise<boolean> {
    try {
      const groups = await this.getStudyGroups();
      const groupIndex = groups.findIndex(g => g.id === groupId);
      
      if (groupIndex === -1) {
        return false;
      }

      // Remove the group from the array
      groups.splice(groupIndex, 1);
      
      // Save the updated groups back to storage
      await AsyncStorage.setItem(this.getStorageKey('study_groups'), JSON.stringify(groups));
      return true;
    } catch (error) {
      console.error('Error deleting study group:', error);
      return false;
    }
  }

  async deletePeerRecommendation(recommendationId: string): Promise<boolean> {
    try {
      const recommendations = await this.getPeerRecommendations();
      const recIndex = recommendations.findIndex(r => r.id === recommendationId);
      
      if (recIndex === -1) {
        return false;
      }

      // Remove the recommendation from the array
      recommendations.splice(recIndex, 1);
      
      // Save the updated recommendations back to storage
      await AsyncStorage.setItem(this.getStorageKey('peer_recommendations'), JSON.stringify(recommendations));
      return true;
    } catch (error) {
      console.error('Error deleting peer recommendation:', error);
      return false;
    }
  }
}

export default SocialLearningService;
