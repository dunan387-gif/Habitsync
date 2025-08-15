import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import HabitEducationService, { HabitCourse, HabitModule } from '@/services/HabitEducationService';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  Star,
  Users,
  CheckCircle,
  Circle,
  Video,
  Headphones,
  Gamepad2,
  FileText,
  Award,
  Trophy,
  Brain,
  Zap,
  Target,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentTheme } = useTheme();
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { trackCourseCompletion, gamificationData } = useGamification();
  
  const [course, setCourse] = useState<HabitCourse | null>(null);
  const [modules, setModules] = useState<HabitModule[]>([]);
  const [currentModule, setCurrentModule] = useState<HabitModule | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  const styles = createStyles(currentTheme.colors);

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    try {
      const [courseData, userProgress] = await Promise.all([
        HabitEducationService.getCourse(id as string, currentLanguage.code),
        HabitEducationService.getUserProgress(user.id),
      ]);

      if (courseData) {
        setCourse(courseData);
        setModules(courseData.modules || []);
        
        // Find current module and progress
        const progressData = userProgress.find(p => p.courseId === id);
        if (progressData) {
          setProgress(progressData.progress || 0);
          setCompletedModules(progressData.completedModules || []);
          
          // Set current module
          if (progressData.currentModule) {
            const current = courseData.modules?.find(m => m.id === progressData.currentModule);
            if (current) {
              setCurrentModule(current);
            } else {
              setCurrentModule(courseData.modules?.[0] || null);
            }
          } else {
            setCurrentModule(courseData.modules?.[0] || null);
          }
        } else {
          setCurrentModule(courseData.modules?.[0] || null);
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      Alert.alert('Error', 'Failed to load course data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleSelect = (module: HabitModule) => {
    setCurrentModule(module);
  };

  const handleModuleComplete = async (moduleId: string) => {
    if (!user || !course) return;
    
    try {
      await HabitEducationService.completeModule(user.id, course.id, moduleId);
      
      // Update local state
      setCompletedModules(prev => [...prev, moduleId]);
      
      // Calculate new progress
      const totalModules = modules.length;
      const newCompletedCount = completedModules.length + 1;
      const newProgress = Math.round((newCompletedCount / totalModules) * 100);
      setProgress(newProgress);
      
      // Check if course is completed
      if (newProgress === 100) {
        await trackCourseCompletion(course.id, course.title);
        Alert.alert(
          'Congratulations!',
          'You have completed this course!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
      
      // Move to next module if available
      const currentIndex = modules.findIndex(m => m.id === moduleId);
      if (currentIndex < modules.length - 1) {
        setCurrentModule(modules[currentIndex + 1]);
      }
      
    } catch (error) {
      console.error('Error completing module:', error);
      Alert.alert('Error', 'Failed to complete module');
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={20} color={currentTheme.colors.primary} />;
      case 'audio':
        return <Headphones size={20} color={currentTheme.colors.primary} />;
      case 'interactive':
        return <Gamepad2 size={20} color={currentTheme.colors.primary} />;
      case 'text':
        return <FileText size={20} color={currentTheme.colors.primary} />;
      default:
        return <BookOpen size={20} color={currentTheme.colors.primary} />;
    }
  };

  const isModuleCompleted = (moduleId: string) => {
    return completedModules.includes(moduleId);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={styles.loadingText}>{t('courses.courseLoading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('courses.courseNotFound')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.errorText}>{t('courses.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={currentTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.betaBadge}>
              <Text style={styles.betaText}>BETA</Text>
            </View>
          </View>
          <Text style={styles.courseDescription}>{course.description}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{t('courses.yourProgress')}</Text>
          <Text style={styles.progressPercentage}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {completedModules.length} of {modules.length} {t('courses.modulesCompleted')}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={16} color={currentTheme.colors.textSecondary} />
            <Text style={styles.statText}>{course.duration} {t('courses.minutes')}</Text>
          </View>
          <View style={styles.statItem}>
            <Star size={16} color={currentTheme.colors.warning} />
            <Text style={styles.statText}>{course.rating}</Text>
          </View>
          <View style={styles.statItem}>
            <Users size={16} color={currentTheme.colors.textSecondary} />
            <Text style={styles.statText}>{course.enrolledUsers} {t('courses.enrolled')}</Text>
          </View>
        </View>

        {/* Modules Section */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionTitle}>{t('courses.courseModules')}</Text>
          {modules.map((module, index) => (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleCard,
                currentModule?.id === module.id && styles.activeModuleCard,
                isModuleCompleted(module.id) && styles.completedModuleCard,
              ]}
              onPress={() => handleModuleSelect(module)}
            >
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIcon}>
                  {getModuleIcon(module.type)}
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>{module.title}</Text>
                  <Text style={styles.moduleDescription}>{module.description}</Text>
                  <Text style={styles.moduleDuration}>{module.duration} min</Text>
                </View>
                <View style={styles.moduleStatus}>
                  {isModuleCompleted(module.id) ? (
                    <CheckCircle size={20} color={currentTheme.colors.success} />
                  ) : (
                    <Circle size={20} color={currentTheme.colors.textSecondary} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Module Content */}
        {currentModule && (
          <View style={styles.currentModuleSection}>
            <Text style={styles.sectionTitle}>{t('courses.currentModule')}{currentModule.title}</Text>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleContentText}>{t(`contentStrings.${currentModule.content}`, { defaultValue: currentModule.content })}</Text>
              
              {!isModuleCompleted(currentModule.id) && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleModuleComplete(currentModule.id)}
                >
                  <CheckCircle size={16} color={currentTheme.colors.background} />
                  <Text style={styles.completeButtonText}>{t('courses.completeModule')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Achievements */}
        {gamificationData?.unlockedAchievements && gamificationData.unlockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>{t('courses.yourAchievements')}</Text>
            <View style={styles.achievementsGrid}>
              {gamificationData.unlockedAchievements.slice(0, 6).map((achievement, index) => (
                <View key={index} style={styles.achievementBadge}>
                  <Award size={16} color={currentTheme.colors.warning} />
                  <Text style={styles.achievementText}>{t(`achievements.${achievement}.title`, { defaultValue: achievement.replace('_', ' ') })}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 40, // Add top margin to create space from the top of the screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  betaBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  betaText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.warning,
  },
  courseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressSection: {
    padding: 16,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modulesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  moduleCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeModuleCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  completedModuleCard: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleIcon: {
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  moduleDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moduleStatus: {
    marginLeft: 8,
  },
  currentModuleSection: {
    marginBottom: 24,
  },
  moduleContent: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  moduleContentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  achievementText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
});
