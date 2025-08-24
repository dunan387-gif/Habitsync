import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, GraduationCap, TrendingUp, Lightbulb } from 'lucide-react-native';

interface LearningImpactCardProps {
  onLearningPress?: () => void;
  compact?: boolean;
}

export default function LearningImpactCard({ onLearningPress, compact = false }: LearningImpactCardProps) {
  const { state } = useCrossTabInsights();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const learning = state.learningInsight;
  const libraryData = state.data.library;

  if (!learning) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
        <View style={styles.header}>
          <BookOpen size={20} color={currentTheme.colors.primary} />
          <Text style={[styles.title, { color: currentTheme.colors.text }]}>
            {t('analytics.learningImpact.title')}
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: currentTheme.colors.textSecondary }]}>
          {t('analytics.learningImpact.loading')}
        </Text>
      </View>
    );
  }

  const getImpactScoreColor = (score: number) => {
    if (score >= 80) return currentTheme.colors.success;
    if (score >= 60) return currentTheme.colors.warning;
    if (score >= 40) return currentTheme.colors.primary;
    return currentTheme.colors.error;
  };

  const getImpactLevel = (score: number) => {
    if (score >= 80) return t('analytics.learningImpact.excellent');
    if (score >= 60) return t('analytics.learningImpact.good');
    if (score >= 40) return t('analytics.learningImpact.fair');
    return t('analytics.learningImpact.needsImprovement');
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surface }]}>
      <View style={styles.header}>
        <BookOpen size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.title, { color: currentTheme.colors.text }]}>
          {t('analytics.learningImpact.title')}
        </Text>
        <View style={styles.scoreBadge}>
          <GraduationCap size={16} color={getImpactScoreColor(learning.impactScore)} />
          <Text style={[styles.scoreText, { color: getImpactScoreColor(learning.impactScore) }]}>
            {learning.impactScore}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.impactSection}>
          <Text style={[styles.impactLabel, { color: currentTheme.colors.textSecondary }]}>
            {t('analytics.learningImpact.courseImpact')}
          </Text>
          <Text style={[styles.impactText, { color: currentTheme.colors.text }]}>
            {learning.courseImpact}
          </Text>
        </View>

        <View style={styles.knowledgeSection}>
          <View style={styles.knowledgeHeader}>
            <Lightbulb size={16} color={currentTheme.colors.primary} />
            <Text style={[styles.knowledgeLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.learningImpact.knowledgeApplied')}
            </Text>
          </View>
          <Text style={[styles.knowledgeText, { color: currentTheme.colors.text }]}>
            {learning.knowledgeApplied}
          </Text>
        </View>

        {!compact && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
              <TrendingUp size={16} color={currentTheme.colors.primary} />
              <Text style={[styles.recommendationLabel, { color: currentTheme.colors.textSecondary }]}>
                {t('analytics.learningImpact.nextLearning')}
              </Text>
            </View>
            <Text style={[styles.recommendationText, { color: currentTheme.colors.text }]}>
              {learning.nextLearning}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
              onPress={onLearningPress}
            >
              <Text style={styles.actionButtonText}>
                {t('analytics.learningImpact.exploreLibrary')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {compact && (
        <View style={styles.compactFooter}>
          <Text style={[styles.compactLearning, { color: currentTheme.colors.primary }]}>
            {learning.nextLearning}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.impactLevel, { color: getImpactScoreColor(learning.impactScore) }]}>
          {getImpactLevel(learning.impactScore)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    gap: 16,
  },
  impactSection: {
    gap: 4,
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  impactText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  knowledgeSection: {
    gap: 8,
  },
  knowledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  knowledgeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  knowledgeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationSection: {
    gap: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  compactFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  compactLearning: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  impactLevel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
