import { HabitCategory } from '@/types';

export const habitCategories: HabitCategory[] = [
  {
    id: 'wellness',
    name: 'wellness', // This will be used as translation key
    habits: [
      {
        id: 'wellness-1',
        title: 'drink_water',
        description: 'drink_water_desc',
        benefits: 'drink_water_benefits',
      },
      {
        id: 'wellness-2',
        title: 'stretch_break',
        description: 'stretch_break_desc',
        benefits: 'stretch_break_benefits',
      },
      {
        id: 'wellness-3',
        title: 'deep_breathing',
        description: 'deep_breathing_desc',
        benefits: 'deep_breathing_benefits',
      },
      {
        id: 'wellness-4',
        title: 'sunlight',
        description: 'sunlight_desc',
        benefits: 'sunlight_benefits',
      },
    ],
  },
  {
    id: 'mindfulness',
    name: 'mindfulness',
    habits: [
      {
        id: 'mindfulness-1',
        title: 'meditation',
        description: 'meditation_desc',
        benefits: 'meditation_benefits',
      },
      {
        id: 'mindfulness-2',
        title: 'gratitude',
        description: 'gratitude_desc',
        benefits: 'gratitude_benefits',
      },
      {
        id: 'mindfulness-3',
        title: 'device_break',
        description: 'device_break_desc',
        benefits: 'device_break_benefits',
      },
      {
        id: 'mindfulness-4',
        title: 'single_task',
        description: 'single_task_desc',
        benefits: 'single_task_benefits',
      },
    ],
  },
  {
    id: 'productivity',
    name: 'productivity',
    habits: [
      {
        id: 'productivity-1',
        title: 'daily_priorities',
        description: 'daily_priorities_desc',
        benefits: 'daily_priorities_benefits',
      },
      {
        id: 'productivity-2',
        title: 'clear_workspace',
        description: 'clear_workspace_desc',
        benefits: 'clear_workspace_benefits',
      },
      {
        id: 'productivity-3',
        title: 'planning_session',
        description: 'planning_session_desc',
        benefits: 'planning_session_benefits',
      },
      {
        id: 'productivity-4',
        title: 'learn_new',
        description: 'learn_new_desc',
        benefits: 'learn_new_benefits',
      },
    ],
  },
  {
    id: 'fitness',
    name: 'fitness',
    habits: [
      {
        id: 'fitness-1',
        title: 'squats',
        description: 'squats_desc',
        benefits: 'squats_benefits',
      },
      {
        id: 'fitness-2',
        title: 'walk',
        description: 'walk_desc',
        benefits: 'walk_benefits',
      },
      {
        id: 'fitness-3',
        title: 'jumping_jacks',
        description: 'jumping_jacks_desc',
        benefits: 'jumping_jacks_benefits',
      },
      {
        id: 'fitness-4',
        title: 'take_stairs',
        description: 'take_stairs_desc',
        benefits: 'take_stairs_benefits',
      },
    ],
  },
  {
    id: 'creativity',
    name: 'creativity',
    habits: [
      {
        id: 'creativity-1',
        title: 'doodle',
        description: 'doodle_desc',
        benefits: 'doodle_benefits',
      },
      {
        id: 'creativity-2',
        title: 'micro_story',
        description: 'micro_story_desc',
        benefits: 'micro_story_benefits',
      },
      {
        id: 'creativity-3',
        title: 'different_route',
        description: 'different_route_desc',
        benefits: 'different_route_benefits',
      },
      {
        id: 'creativity-4',
        title: 'observe_details',
        description: 'observe_details_desc',
        benefits: 'observe_details_benefits',
      },
    ],
  },
];