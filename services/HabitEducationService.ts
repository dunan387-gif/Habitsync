import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get translated course content
const getTranslatedCourseContent = (courseId: string, language: string = 'en') => {
  const courseContentMap: { [key: string]: { [key: string]: { title: string; description: string } } } = {
    'habit-foundations': {
      en: { title: 'Habit Formation Foundations', description: 'Learn the science behind habit formation and build a solid foundation for lasting change.' },
      es: { title: 'Fundamentos de Formación de Hábitos', description: 'Aprende la ciencia detrás de la formación de hábitos y construye una base sólida para cambios duraderos.' },
      fr: { title: 'Fondements de la Formation d\'Habitudes', description: 'Apprenez la science derrière la formation d\'habitudes et construisez une base solide pour des changements durables.' },
      zh: { title: '习惯养成基础', description: '学习习惯养成背后的科学，为持久改变建立坚实基础。' }
    },
    'morning-routines': {
      en: { title: 'Mastering Morning Routines', description: 'Create a powerful morning routine that sets you up for success every day.' },
      es: { title: 'Dominando las Rutinas Matutinas', description: 'Crea una poderosa rutina matutina que te prepare para el éxito todos los días.' },
      fr: { title: 'Maîtriser les Routines Matinales', description: 'Créez une puissante routine matinale qui vous prépare au succès chaque jour.' },
      zh: { title: '掌握晨间习惯', description: '创建强大的晨间习惯，每天为成功做好准备。' }
    },
    'fitness-habits': {
      en: { title: 'Building Fitness Habits', description: 'Transform your health and fitness through sustainable habit formation.' },
      es: { title: 'Construyendo Hábitos de Fitness', description: 'Transforma tu salud y fitness a través de la formación sostenible de hábitos.' },
      fr: { title: 'Construire des Habitudes de Fitness', description: 'Transformez votre santé et fitness grâce à la formation durable d\'habitudes.' },
      zh: { title: '建立健身习惯', description: '通过可持续的习惯养成来改变您的健康和健身。' }
    },
    'productivity-mastery': {
      en: { title: 'Productivity Mastery', description: 'Master the art of productivity through effective habit systems.' },
      es: { title: 'Maestría en Productividad', description: 'Domina el arte de la productividad a través de sistemas efectivos de hábitos.' },
      fr: { title: 'Maîtrise de la Productivité', description: 'Maîtrisez l\'art de la productivité grâce à des systèmes d\'habitudes efficaces.' },
      zh: { title: '生产力掌握', description: '通过有效的习惯系统掌握生产力艺术。' }
    },
    'mindfulness-meditation': {
      en: { title: 'Mindfulness & Meditation Habits', description: 'Cultivate mindfulness and meditation habits for mental well-being.' },
      es: { title: 'Hábitos de Atención Plena y Meditación', description: 'Cultiva hábitos de atención plena y meditación para el bienestar mental.' },
      fr: { title: 'Habitudes de Pleine Conscience et Méditation', description: 'Cultivez des habitudes de pleine conscience et de méditation pour le bien-être mental.' },
      zh: { title: '正念与冥想习惯', description: '培养正念和冥想习惯，促进心理健康。' }
    },
    'learning-habits': {
      en: { title: 'Learning & Study Habits', description: 'Develop effective learning and study habits for continuous growth.' },
      es: { title: 'Hábitos de Aprendizaje y Estudio', description: 'Desarrolla hábitos efectivos de aprendizaje y estudio para el crecimiento continuo.' },
      fr: { title: 'Habitudes d\'Apprentissage et d\'Étude', description: 'Développez des habitudes d\'apprentissage et d\'étude efficaces pour une croissance continue.' },
      zh: { title: '学习与学习习惯', description: '发展有效的学习和学习习惯，实现持续成长。' }
    },
    'sleep-habits': {
      en: { title: 'Sleep Optimization Habits', description: 'Master the art of quality sleep through effective habit formation.' },
      es: { title: 'Hábitos de Optimización del Sueño', description: 'Domina el arte del sueño de calidad a través de la formación efectiva de hábitos.' },
      fr: { title: 'Habitudes d\'Optimisation du Sommeil', description: 'Maîtrisez l\'art du sommeil de qualité grâce à la formation efficace d\'habitudes.' },
      zh: { title: '睡眠优化习惯', description: '通过有效的习惯养成掌握优质睡眠艺术。' }
    },
    'communication-habits': {
      en: { title: 'Effective Communication Habits', description: 'Build powerful communication habits for personal and professional success.' },
      es: { title: 'Hábitos de Comunicación Efectiva', description: 'Construye hábitos poderosos de comunicación para el éxito personal y profesional.' },
      fr: { title: 'Habitudes de Communication Efficace', description: 'Construisez des habitudes de communication puissantes pour le succès personnel et professionnel.' },
      zh: { title: '有效沟通习惯', description: '建立强大的沟通习惯，实现个人和职业成功。' }
    },
    'creative-thinking-habits': {
      en: { title: 'Creative Thinking Habits', description: 'Unlock your creative potential through systematic habit formation.' },
      es: { title: 'Hábitos de Pensamiento Creativo', description: 'Desbloquea tu potencial creativo a través de la formación sistemática de hábitos.' },
      fr: { title: 'Habitudes de Pensée Créative', description: 'Libérez votre potentiel créatif grâce à la formation systématique d\'habitudes.' },
      zh: { title: '创造性思维习惯', description: '通过系统性的习惯养成释放您的创造潜力。' }
    },
    'productivity-habits': {
      en: { title: 'Productivity Habits', description: 'Build habits that will transform your productivity and efficiency.' },
      es: { title: 'Hábitos de Productividad', description: 'Construye hábitos que transformarán tu productividad y eficiencia.' },
      fr: { title: 'Habitudes de Productivité', description: 'Construisez des habitudes qui transformeront votre productivité et votre efficacité.' },
      zh: { title: '生产力习惯', description: '建立将改变您生产力和效率的习惯。' }
    },
    'financial-habits': {
      en: { title: 'Financial Habits', description: 'Build healthy financial habits for long-term security.' },
      es: { title: 'Hábitos Financieros', description: 'Construye hábitos financieros saludables para la seguridad a largo plazo.' },
      fr: { title: 'Habitudes Financières', description: 'Construisez des habitudes financières saines pour la sécurité à long terme.' },
      zh: { title: '财务习惯', description: '建立健康的财务习惯，实现长期安全。' }
    },
    'leadership-habits': {
      en: { title: 'Leadership Habits', description: 'Develop leadership habits for personal and professional growth.' },
      es: { title: 'Hábitos de Liderazgo', description: 'Desarrolla hábitos de liderazgo para el crecimiento personal y profesional.' },
      fr: { title: 'Habitudes de Leadership', description: 'Développez des habitudes de leadership pour la croissance personnelle et professionnelle.' },
      zh: { title: '领导力习惯', description: '培养领导力习惯，实现个人和职业成长。' }
    },
    'wellness-habits': {
      en: { title: 'Wellness Habits', description: 'Create comprehensive wellness habits for overall well-being.' },
      es: { title: 'Hábitos de Bienestar', description: 'Crea hábitos de bienestar integrales para el bienestar general.' },
      fr: { title: 'Habitudes de Bien-être', description: 'Créez des habitudes de bien-être complètes pour le bien-être général.' },
      zh: { title: '健康习惯', description: '创造全面的健康习惯，实现整体福祉。' }
    },
    "holistic-wellness-habits": {
      en: { title: 'Holistic Wellness Habits', description: 'Develop comprehensive wellness habits for mind, body, and spirit.' },
      es: { title: 'Hábitos de Bienestar Holístico', description: 'Desarrolla hábitos de bienestar integrales para mente, cuerpo y espíritu.' },
      fr: { title: 'Habitudes de Bien-être Holistique', description: 'Développez des habitudes de bien-être complètes pour l\'esprit, le corps et l\'esprit.' },
      zh: { title: '整体健康习惯', description: '培养全面的健康习惯，促进身心灵的和谐发展。' }
    },
    "leadership-development-habits": {
      en: { title: 'Leadership Development Habits', description: 'Cultivate leadership habits for personal and professional growth.' },
      es: { title: 'Hábitos de Desarrollo de Liderazgo', description: 'Cultiva hábitos de liderazgo para el crecimiento personal y profesional.' },
      fr: { title: 'Habitudes de Développement du Leadership', description: 'Cultivez des habitudes de leadership pour la croissance personnelle et professionnelle.' },
      zh: { title: '领导力发展习惯', description: '培养领导力习惯，实现个人和职业成长。' }
    },
    "financial-habits-money-management": {
      en: { title: 'Financial Habits & Money Management', description: 'Build healthy financial habits for long-term financial success.' },
      es: { title: 'Hábitos Financieros y Gestión del Dinero', description: 'Construye hábitos financieros saludables para el éxito financiero a largo plazo.' },
      fr: { title: 'Habitudes Financières et Gestion de l\'Argent', description: 'Construisez des habitudes financières saines pour le succès financier à long terme.' },
      zh: { title: '财务习惯与金钱管理', description: '建立健康的财务习惯，实现长期财务成功。' }
    },
    "effective-communication-habits": {
      en: { title: 'Effective Communication Habits', description: 'Build powerful communication habits for personal and professional success.' },
      es: { title: 'Hábitos de Comunicación Efectiva', description: 'Construye hábitos poderosos de comunicación para el éxito personal y profesional.' },
      fr: { title: 'Habitudes de Communication Efficace', description: 'Construisez des habitudes de communication puissantes pour le succès personnel et professionnel.' },
      zh: { title: '有效沟通习惯', description: '建立强大的沟通习惯，实现个人和职业成功。' }
    }
  };

  return courseContentMap[courseId]?.[language] || courseContentMap[courseId]?.['en'] || { title: '', description: '' };
};

// Helper function to get translated preview content
const getTranslatedPreviewContent = (courseId: string, language: string = 'en') => {
  const previewContentMap: { [key: string]: { [key: string]: string } } = {
    'habit-foundations': {
      en: 'This course covers the fundamental principles of habit formation, including the habit loop, cue identification, and reward systems.',
      es: 'Este curso cubre los principios fundamentales de la formación de hábitos, incluyendo el bucle de hábitos, identificación de señales y sistemas de recompensa.',
      fr: 'Ce cours couvre les principes fondamentaux de la formation d\'habitudes, y compris la boucle d\'habitude, l\'identification des déclencheurs et les systèmes de récompense.',
      zh: '本课程涵盖习惯养成的基本原则，包括习惯循环、线索识别和奖励系统。'
    },
    'creative-thinking-habits': {
      en: 'Unlock your creative potential through systematic habit formation. Learn techniques to boost creativity and build daily routines that enhance your innovative thinking.',
      es: 'Desbloquea tu potencial creativo a través de la formación sistemática de hábitos. Aprende técnicas para impulsar la creatividad y construir rutinas diarias que mejoren tu pensamiento innovador.',
      fr: 'Libérez votre potentiel créatif grâce à la formation systématique d\'habitudes. Apprenez des techniques pour stimuler la créativité et construire des routines quotidiennes qui améliorent votre pensée innovante.',
      zh: '通过系统性的习惯养成释放您的创造潜力。学习提升创造力的技巧，建立增强创新思维的日常习惯。'
    },
    'holistic-wellness-habits': {
      en: 'Develop comprehensive wellness habits for mind, body, and spirit. Learn to create balanced routines that promote overall well-being and sustainable health practices.',
      es: 'Desarrolla hábitos de bienestar integrales para mente, cuerpo y espíritu. Aprende a crear rutinas equilibradas que promuevan el bienestar general y prácticas de salud sostenibles.',
      fr: 'Développez des habitudes de bien-être complètes pour l\'esprit, le corps et l\'esprit. Apprenez à créer des routines équilibrées qui favorisent le bien-être général et les pratiques de santé durables.',
      zh: '培养全面的健康习惯，促进身心灵的和谐发展。学习创建促进整体福祉和可持续健康实践的平衡习惯。'
    },
    'leadership-development-habits': {
      en: 'Cultivate leadership habits for personal and professional growth. Master essential leadership skills and develop the mindset needed for effective team management.',
      es: 'Cultiva hábitos de liderazgo para el crecimiento personal y profesional. Domina habilidades esenciales de liderazgo y desarrolla la mentalidad necesaria para la gestión efectiva de equipos.',
      fr: 'Cultivez des habitudes de leadership pour la croissance personnelle et professionnelle. Maîtrisez les compétences de leadership essentielles et développez l\'état d\'esprit nécessaire pour une gestion d\'équipe efficace.',
      zh: '培养领导力习惯，实现个人和职业成长。掌握基本领导技能，培养有效团队管理所需的心态。'
    },
    'financial-habits-money-management': {
      en: 'Build healthy financial habits for long-term financial success. Learn budgeting, saving, investing, and debt management strategies for financial freedom.',
      es: 'Construye hábitos financieros saludables para el éxito financiero a largo plazo. Aprende estrategias de presupuesto, ahorro, inversión y gestión de deudas para la libertad financiera.',
      fr: 'Construisez des habitudes financières saines pour le succès financier à long terme. Apprenez les stratégies de budgétisation, d\'épargne, d\'investissement et de gestion de la dette pour la liberté financière.',
      zh: '建立健康的财务习惯，实现长期财务成功。学习预算、储蓄、投资和债务管理策略，实现财务自由。'
    },
    'effective-communication-habits': {
      en: 'Build powerful communication habits for personal and professional success. Master active listening, assertive communication, and conflict resolution skills.',
      es: 'Construye hábitos poderosos de comunicación para el éxito personal y profesional. Domina las habilidades de escucha activa, comunicación asertiva y resolución de conflictos.',
      fr: 'Construisez des habitudes de communication puissantes pour le succès personnel et professionnel. Maîtrisez les compétences d\'écoute active, de communication assertive et de résolution de conflits.',
      zh: '建立强大的沟通习惯，实现个人和职业成功。掌握积极倾听、自信沟通和冲突解决技能。'
    },
    'morning-routines': {
      en: 'Create a powerful morning routine that sets you up for success every day. Learn the science behind morning habits and design routines that transform your productivity.',
      es: 'Crea una poderosa rutina matutina que te prepare para el éxito todos los días. Aprende la ciencia detrás de los hábitos matutinos y diseña rutinas que transformen tu productividad.',
      fr: 'Créez une puissante routine matinale qui vous prépare au succès chaque jour. Apprenez la science derrière les habitudes matinales et concevez des routines qui transforment votre productivité.',
      zh: '创建强大的晨间习惯，每天为成功做好准备。学习晨间习惯背后的科学，设计改变生产力的习惯。'
    },
    'fitness-habits': {
      en: 'Transform your health and fitness through sustainable habit formation. Build lasting fitness routines that fit your lifestyle and help you achieve your health goals.',
      es: 'Transforma tu salud y fitness a través de la formación sostenible de hábitos. Construye rutinas de fitness duraderas que se adapten a tu estilo de vida y te ayuden a alcanzar tus objetivos de salud.',
      fr: 'Transformez votre santé et fitness grâce à la formation durable d\'habitudes. Construisez des routines de fitness durables qui s\'adaptent à votre mode de vie et vous aident à atteindre vos objectifs de santé.',
      zh: '通过可持续的习惯养成来改变您的健康和健身。建立适合您生活方式的持久健身习惯，帮助您实现健康目标。'
    },
    'productivity-mastery': {
      en: 'Master the art of productivity through effective habit systems. Learn advanced time management, focus techniques, and productivity frameworks for maximum efficiency.',
      es: 'Domina el arte de la productividad a través de sistemas efectivos de hábitos. Aprende gestión avanzada del tiempo, técnicas de enfoque y marcos de productividad para máxima eficiencia.',
      fr: 'Maîtrisez l\'art de la productivité grâce à des systèmes d\'habitudes efficaces. Apprenez la gestion avancée du temps, les techniques de concentration et les cadres de productivité pour une efficacité maximale.',
      zh: '通过有效的习惯系统掌握生产力艺术。学习高级时间管理、专注技巧和生产力框架，实现最大效率。'
    },
    'mindfulness-meditation': {
      en: 'Cultivate mindfulness and meditation habits for mental well-being. Learn practical techniques for stress reduction, emotional balance, and inner peace.',
      es: 'Cultiva hábitos de atención plena y meditación para el bienestar mental. Aprende técnicas prácticas para la reducción del estrés, el equilibrio emocional y la paz interior.',
      fr: 'Cultivez des habitudes de pleine conscience et de méditation pour le bien-être mental. Apprenez des techniques pratiques pour la réduction du stress, l\'équilibre émotionnel et la paix intérieure.',
      zh: '培养正念和冥想习惯，促进心理健康。学习减压、情绪平衡和内心平静的实用技巧。'
    },
    'learning-habits': {
      en: 'Develop effective learning and study habits for continuous growth. Master memory techniques, study strategies, and lifelong learning skills.',
      es: 'Desarrolla hábitos efectivos de aprendizaje y estudio para el crecimiento continuo. Domina técnicas de memoria, estrategias de estudio y habilidades de aprendizaje permanente.',
      fr: 'Développez des habitudes d\'apprentissage et d\'étude efficaces pour une croissance continue. Maîtrisez les techniques de mémoire, les stratégies d\'étude et les compétences d\'apprentissage tout au long de la vie.',
      zh: '发展有效的学习和学习习惯，实现持续成长。掌握记忆技巧、学习策略和终身学习技能。'
    },
    'financial-habits': {
      en: 'Build healthy financial habits for long-term security. Learn budgeting, saving, investing, and debt management strategies for financial freedom.',
      es: 'Construye hábitos financieros saludables para la seguridad a largo plazo. Aprende estrategias de presupuesto, ahorro, inversión y gestión de deudas para la libertad financiera.',
      fr: 'Construisez des habitudes financières saines pour la sécurité à long terme. Apprenez les stratégies de budgétisation, d\'épargne, d\'investissement et de gestion de la dette pour la liberté financière.',
      zh: '建立健康的财务习惯，实现长期安全。学习预算、储蓄、投资和债务管理策略，实现财务自由。'
    },
    'sleep-habits': {
      en: 'Master the art of quality sleep through effective habit formation. Learn sleep science, hygiene practices, and environment optimization for better rest.',
      es: 'Domina el arte del sueño de calidad a través de la formación efectiva de hábitos. Aprende ciencia del sueño, prácticas de higiene y optimización del entorno para mejor descanso.',
      fr: 'Maîtrisez l\'art du sommeil de qualité grâce à la formation efficace d\'habitudes. Apprenez la science du sommeil, les pratiques d\'hygiène et l\'optimisation de l\'environnement pour un meilleur repos.',
      zh: '通过有效的习惯养成掌握优质睡眠艺术。学习睡眠科学、卫生实践和环境优化，获得更好的休息。'
    },
    'communication-habits': {
      en: 'Build powerful communication habits for personal and professional success. Master active listening, assertive communication, and conflict resolution skills.',
      es: 'Construye hábitos poderosos de comunicación para el éxito personal y profesional. Domina las habilidades de escucha activa, comunicación asertiva y resolución de conflictos.',
      fr: 'Construisez des habitudes de communication puissantes pour le succès personnel et professionnel. Maîtrisez les compétences d\'écoute active, de communication assertive et de résolution de conflits.',
      zh: '建立强大的沟通习惯，实现个人和职业成功。掌握积极倾听、自信沟通和冲突解决技能。'
    },
    'creativity-habits': {
      en: 'Unlock your creative potential through systematic habit formation. Learn techniques to boost creativity and build daily routines that enhance your innovative thinking.',
      es: 'Desbloquea tu potencial creativo a través de la formación sistemática de hábitos. Aprende técnicas para impulsar la creatividad y construir rutinas diarias que mejoren tu pensamiento innovador.',
      fr: 'Libérez votre potentiel créatif grâce à la formation systématique d\'habitudes. Apprenez des techniques pour stimuler la créativité et construire des routines quotidiennes qui améliorent votre pensée innovante.',
      zh: '通过系统性的习惯养成释放您的创造潜力。学习提升创造力的技巧，建立增强创新思维的日常习惯。'
    }
  };

  return previewContentMap[courseId]?.[language] || previewContentMap[courseId]?.['en'] || 'Course preview content not available.';
};

// Helper function to get translated learning objectives
const getTranslatedLearningObjectives = (courseId: string, language: string = 'en') => {
  const objectivesMap: { [key: string]: { [key: string]: string[] } } = {
    'habit-foundations': {
      en: [
        'Understand the science of habit formation',
        'Identify your personal habit triggers',
        'Create effective reward systems',
        'Build sustainable habit routines'
      ],
      es: [
        'Entender la ciencia de la formación de hábitos',
        'Identificar tus desencadenantes de hábitos personales',
        'Crear sistemas de recompensa efectivos',
        'Construir rutinas de hábitos sostenibles'
      ],
      fr: [
        'Comprendre la science de la formation d\'habitudes',
        'Identifier vos déclencheurs d\'habitudes personnels',
        'Créer des systèmes de récompense efficaces',
        'Construire des routines d\'habitudes durables'
      ],
      zh: [
        '理解习惯养成的科学',
        '识别您的个人习惯触发因素',
        '创建有效的奖励系统',
        '建立可持续的习惯例程'
      ]
    },
    'creative-thinking-habits': {
      en: [
        'Understand creative thinking principles',
        'Learn techniques to boost creativity',
        'Build daily creative routines',
        'Apply creativity to problem-solving'
      ],
      es: [
        'Entender los principios del pensamiento creativo',
        'Aprender técnicas para impulsar la creatividad',
        'Construir rutinas creativas diarias',
        'Aplicar la creatividad a la resolución de problemas'
      ],
      fr: [
        'Comprendre les principes de la pensée créative',
        'Apprendre des techniques pour stimuler la créativité',
        'Construire des routines créatives quotidiennes',
        'Appliquer la créativité à la résolution de problèmes'
      ],
      zh: [
        '理解创造性思维原则',
        '学习提升创造力的技巧',
        '建立日常创造性习惯',
        '将创造力应用于问题解决'
      ]
    },
    'morning-routines': {
      en: [
        'Understand the science of morning routines',
        'Design personalized morning habits',
        'Implement sustainable morning practices',
        'Transform your daily productivity'
      ],
      es: [
        'Entender la ciencia de las rutinas matutinas',
        'Diseñar hábitos matutinos personalizados',
        'Implementar prácticas matutinas sostenibles',
        'Transformar tu productividad diaria'
      ],
      fr: [
        'Comprendre la science des routines matinales',
        'Concevoir des habitudes matinales personnalisées',
        'Implémenter des pratiques matinales durables',
        'Transformer votre productivité quotidienne'
      ],
      zh: [
        '理解晨间习惯的科学',
        '设计个性化的晨间习惯',
        '实施可持续的晨间实践',
        '改变您的日常生产力'
      ]
    },
    'fitness-habits': {
      en: [
        'Understand fitness psychology and motivation',
        'Create sustainable workout routines',
        'Build healthy nutrition habits',
        'Develop recovery and rest practices'
      ],
      es: [
        'Entender la psicología del fitness y la motivación',
        'Crear rutinas de ejercicio sostenibles',
        'Construir hábitos de nutrición saludables',
        'Desarrollar prácticas de recuperación y descanso'
      ],
      fr: [
        'Comprendre la psychologie du fitness et la motivation',
        'Créer des routines d\'entraînement durables',
        'Construire des habitudes de nutrition saines',
        'Développer des pratiques de récupération et de repos'
      ],
      zh: [
        '理解健身心理学和动机',
        '创建可持续的锻炼习惯',
        '建立健康的营养习惯',
        '发展恢复和休息实践'
      ]
    },
    'productivity-mastery': {
      en: [
        'Master advanced productivity principles',
        'Implement time management systems',
        'Develop deep focus habits',
        'Integrate multiple productivity frameworks'
      ],
      es: [
        'Dominar principios avanzados de productividad',
        'Implementar sistemas de gestión del tiempo',
        'Desarrollar hábitos de enfoque profundo',
        'Integrar múltiples marcos de productividad'
      ],
      fr: [
        'Maîtriser les principes avancés de productivité',
        'Implémenter des systèmes de gestion du temps',
        'Développer des habitudes de concentration profonde',
        'Intégrer plusieurs cadres de productivité'
      ],
      zh: [
        '掌握高级生产力原则',
        '实施时间管理系统',
        '发展深度专注习惯',
        '整合多种生产力框架'
      ]
    },
    'mindfulness-meditation': {
      en: [
        'Understand mindfulness fundamentals',
        'Learn meditation techniques',
        'Develop stress management skills',
        'Cultivate emotional balance'
      ],
      es: [
        'Entender los fundamentos de la atención plena',
        'Aprender técnicas de meditación',
        'Desarrollar habilidades de gestión del estrés',
        'Cultivar el equilibrio emocional'
      ],
      fr: [
        'Comprendre les fondamentaux de la pleine conscience',
        'Apprendre les techniques de méditation',
        'Développer les compétences de gestion du stress',
        'Cultiver l\'équilibre émotionnel'
      ],
      zh: [
        '理解正念基础',
        '学习冥想技巧',
        '发展压力管理技能',
        '培养情绪平衡'
      ]
    },
    'learning-habits': {
      en: [
        'Understand learning science principles',
        'Master effective study techniques',
        'Develop memory enhancement skills',
        'Create lifelong learning habits'
      ],
      es: [
        'Entender los principios de la ciencia del aprendizaje',
        'Dominar técnicas efectivas de estudio',
        'Desarrollar habilidades de mejora de memoria',
        'Crear hábitos de aprendizaje permanente'
      ],
      fr: [
        'Comprendre les principes de la science de l\'apprentissage',
        'Maîtriser les techniques d\'étude efficaces',
        'Développer les compétences d\'amélioration de la mémoire',
        'Créer des habitudes d\'apprentissage tout au long de la vie'
      ],
      zh: [
        '理解学习科学原理',
        '掌握有效的学习技巧',
        '发展记忆增强技能',
        '创建终身学习习惯'
      ]
    },
    'financial-habits': {
      en: [
        'Develop healthy money mindset',
        'Master budgeting and planning',
        'Learn saving and investing strategies',
        'Build debt management skills'
      ],
      es: [
        'Desarrollar mentalidad saludable sobre el dinero',
        'Dominar presupuesto y planificación',
        'Aprender estrategias de ahorro e inversión',
        'Construir habilidades de gestión de deudas'
      ],
      fr: [
        'Développer un état d\'esprit sain sur l\'argent',
        'Maîtriser la budgétisation et la planification',
        'Apprendre les stratégies d\'épargne et d\'investissement',
        'Construire des compétences de gestion de la dette'
      ],
      zh: [
        '发展健康的金钱心态',
        '掌握预算和规划',
        '学习储蓄和投资策略',
        '建立债务管理技能'
      ]
    },
    'sleep-habits': {
      en: [
        'Understand sleep science and cycles',
        'Master sleep hygiene practices',
        'Optimize sleep environment',
        'Manage sleep challenges effectively'
      ],
      es: [
        'Entender la ciencia del sueño y los ciclos',
        'Dominar prácticas de higiene del sueño',
        'Optimizar el entorno del sueño',
        'Manejar desafíos del sueño efectivamente'
      ],
      fr: [
        'Comprendre la science du sommeil et les cycles',
        'Maîtriser les pratiques d\'hygiène du sommeil',
        'Optimiser l\'environnement de sommeil',
        'Gérer efficacement les défis du sommeil'
      ],
      zh: [
        '理解睡眠科学和周期',
        '掌握睡眠卫生实践',
        '优化睡眠环境',
        '有效管理睡眠挑战'
      ]
    },
    'communication-habits': {
      en: [
        'Master communication fundamentals',
        'Develop active listening skills',
        'Learn assertive communication',
        'Build conflict resolution abilities'
      ],
      es: [
        'Dominar fundamentos de comunicación',
        'Desarrollar habilidades de escucha activa',
        'Aprender comunicación asertiva',
        'Construir habilidades de resolución de conflictos'
      ],
      fr: [
        'Maîtriser les fondamentaux de la communication',
        'Développer les compétences d\'écoute active',
        'Apprendre la communication assertive',
        'Construire les capacités de résolution de conflits'
      ],
      zh: [
        '掌握沟通基础',
        '发展积极倾听技能',
        '学习自信沟通',
        '建立冲突解决能力'
      ]
    },
    'creativity-habits': {
      en: [
        'Understand creative thinking principles',
        'Learn techniques to boost creativity',
        'Build daily creative routines',
        'Apply creativity to problem-solving'
      ],
      es: [
        'Entender los principios del pensamiento creativo',
        'Aprender técnicas para impulsar la creatividad',
        'Construir rutinas creativas diarias',
        'Aplicar la creatividad a la resolución de problemas'
      ],
      fr: [
        'Comprendre les principes de la pensée créative',
        'Apprendre des techniques pour stimuler la créativité',
        'Construire des routines créatives quotidiennes',
        'Appliquer la créativité à la résolution de problèmes'
      ],
      zh: [
        '理解创造性思维原则',
        '学习提升创造力的技巧',
        '建立日常创造性习惯',
        '将创造力应用于问题解决'
      ]
    }
  };

  return objectivesMap[courseId]?.[language] || objectivesMap[courseId]?.['en'] || [
    'Learn course-specific skills',
    'Apply knowledge in practice',
    'Develop new capabilities',
    'Achieve learning goals'
  ];
};

// Helper function to get translated what you will learn
const getTranslatedWhatYouWillLearn = (courseId: string, language: string = 'en') => {
  const learnMap: { [key: string]: { [key: string]: string[] } } = {
    'habit-foundations': {
      en: [
        'The habit loop and how it works',
        'How to identify and create effective cues',
        'Strategies for building lasting habits',
        'Common pitfalls and how to avoid them'
      ],
      es: [
        'El bucle de hábitos y cómo funciona',
        'Cómo identificar y crear señales efectivas',
        'Estrategias para construir hábitos duraderos',
        'Trampas comunes y cómo evitarlas'
      ],
      fr: [
        'La boucle d\'habitude et son fonctionnement',
        'Comment identifier et créer des déclencheurs efficaces',
        'Stratégies pour construire des habitudes durables',
        'Pièges courants et comment les éviter'
      ],
      zh: [
        '习惯循环及其工作原理',
        '如何识别和创建有效的线索',
        '建立持久习惯的策略',
        '常见陷阱及如何避免'
      ]
    },
    'creative-thinking-habits': {
      en: [
        'Creative thinking frameworks and methodologies',
        'Techniques to overcome creative blocks',
        'Daily practices to enhance creativity',
        'Applying creativity to real-world challenges'
      ],
      es: [
        'Marcos y metodologías de pensamiento creativo',
        'Técnicas para superar bloqueos creativos',
        'Prácticas diarias para mejorar la creatividad',
        'Aplicar la creatividad a desafíos del mundo real'
      ],
      fr: [
        'Cadres et méthodologies de pensée créative',
        'Techniques pour surmonter les blocages créatifs',
        'Pratiques quotidiennes pour améliorer la créativité',
        'Appliquer la créativité aux défis du monde réel'
      ],
      zh: [
        '创造性思维框架和方法论',
        '克服创造性障碍的技巧',
        '增强创造力的日常实践',
        '将创造力应用于现实世界的挑战'
      ]
    },
    'morning-routines': {
      en: [
        'The science behind morning routines and their impact',
        'How to design personalized morning habits',
        'Strategies for implementing sustainable morning practices',
        'Techniques to transform daily productivity'
      ],
      es: [
        'La ciencia detrás de las rutinas matutinas y su impacto',
        'Cómo diseñar hábitos matutinos personalizados',
        'Estrategias para implementar prácticas matutinas sostenibles',
        'Técnicas para transformar la productividad diaria'
      ],
      fr: [
        'La science derrière les routines matinales et leur impact',
        'Comment concevoir des habitudes matinales personnalisées',
        'Stratégies pour implémenter des pratiques matinales durables',
        'Techniques pour transformer la productivité quotidienne'
      ],
      zh: [
        '晨间习惯背后的科学及其影响',
        '如何设计个性化的晨间习惯',
        '实施可持续晨间实践的策略',
        '改变日常生产力的技巧'
      ]
    },
    'fitness-habits': {
      en: [
        'Fitness psychology and motivation strategies',
        'Sustainable workout routine design',
        'Healthy nutrition habit building',
        'Recovery and rest optimization'
      ],
      es: [
        'Psicología del fitness y estrategias de motivación',
        'Diseño de rutinas de ejercicio sostenibles',
        'Construcción de hábitos de nutrición saludables',
        'Optimización de recuperación y descanso'
      ],
      fr: [
        'Psychologie du fitness et stratégies de motivation',
        'Conception de routines d\'entraînement durables',
        'Construction d\'habitudes de nutrition saines',
        'Optimisation de la récupération et du repos'
      ],
      zh: [
        '健身心理学和动机策略',
        '可持续锻炼习惯设计',
        '健康营养习惯建立',
        '恢复和休息优化'
      ]
    },
    'productivity-mastery': {
      en: [
        'Advanced productivity principles and frameworks',
        'Time management system implementation',
        'Deep focus habit development',
        'Multiple productivity framework integration'
      ],
      es: [
        'Principios y marcos avanzados de productividad',
        'Implementación de sistemas de gestión del tiempo',
        'Desarrollo de hábitos de enfoque profundo',
        'Integración de múltiples marcos de productividad'
      ],
      fr: [
        'Principes et cadres de productivité avancés',
        'Implémentation de systèmes de gestion du temps',
        'Développement d\'habitudes de concentration profonde',
        'Intégration de plusieurs cadres de productivité'
      ],
      zh: [
        '高级生产力原则和框架',
        '时间管理系统实施',
        '深度专注习惯发展',
        '多种生产力框架整合'
      ]
    },
    'mindfulness-meditation': {
      en: [
        'Mindfulness fundamentals and principles',
        'Meditation techniques and practices',
        'Stress management and reduction strategies',
        'Emotional balance cultivation methods'
      ],
      es: [
        'Fundamentos y principios de la atención plena',
        'Técnicas y prácticas de meditación',
        'Estrategias de gestión y reducción del estrés',
        'Métodos de cultivo del equilibrio emocional'
      ],
      fr: [
        'Fondamentaux et principes de la pleine conscience',
        'Techniques et pratiques de méditation',
        'Stratégies de gestion et de réduction du stress',
        'Méthodes de cultivation de l\'équilibre émotionnel'
      ],
      zh: [
        '正念基础和原则',
        '冥想技巧和实践',
        '压力管理和减压策略',
        '情绪平衡培养方法'
      ]
    },
    'learning-habits': {
      en: [
        'Learning science principles and applications',
        'Effective study technique mastery',
        'Memory enhancement and retention strategies',
        'Lifelong learning habit development'
      ],
      es: [
        'Principios y aplicaciones de la ciencia del aprendizaje',
        'Dominio de técnicas efectivas de estudio',
        'Estrategias de mejora y retención de memoria',
        'Desarrollo de hábitos de aprendizaje permanente'
      ],
      fr: [
        'Principes et applications de la science de l\'apprentissage',
        'Maîtrise des techniques d\'étude efficaces',
        'Stratégies d\'amélioration et de rétention de la mémoire',
        'Développement d\'habitudes d\'apprentissage tout au long de la vie'
      ],
      zh: [
        '学习科学原理和应用',
        '有效学习技巧掌握',
        '记忆增强和保留策略',
        '终身学习习惯发展'
      ]
    },
    'financial-habits': {
      en: [
        'Healthy money mindset development',
        'Budgeting and financial planning mastery',
        'Saving and investing strategy implementation',
        'Debt management and elimination techniques'
      ],
      es: [
        'Desarrollo de mentalidad saludable sobre el dinero',
        'Dominio de presupuesto y planificación financiera',
        'Implementación de estrategias de ahorro e inversión',
        'Técnicas de gestión y eliminación de deudas'
      ],
      fr: [
        'Développement d\'un état d\'esprit sain sur l\'argent',
        'Maîtrise de la budgétisation et de la planification financière',
        'Implémentation de stratégies d\'épargne et d\'investissement',
        'Techniques de gestion et d\'élimination de la dette'
      ],
      zh: [
        '健康金钱心态发展',
        '预算和财务规划掌握',
        '储蓄和投资策略实施',
        '债务管理和消除技巧'
      ]
    },
    'sleep-habits': {
      en: [
        'Sleep science and cycle understanding',
        'Sleep hygiene practice mastery',
        'Sleep environment optimization techniques',
        'Sleep challenge management strategies'
      ],
      es: [
        'Comprensión de la ciencia del sueño y los ciclos',
        'Dominio de prácticas de higiene del sueño',
        'Técnicas de optimización del entorno del sueño',
        'Estrategias de manejo de desafíos del sueño'
      ],
      fr: [
        'Compréhension de la science du sommeil et des cycles',
        'Maîtrise des pratiques d\'hygiène du sommeil',
        'Techniques d\'optimisation de l\'environnement de sommeil',
        'Stratégies de gestion des défis du sommeil'
      ],
      zh: [
        '睡眠科学和周期理解',
        '睡眠卫生实践掌握',
        '睡眠环境优化技巧',
        '睡眠挑战管理策略'
      ]
    },
    'communication-habits': {
      en: [
        'Communication fundamentals and principles',
        'Active listening skill development',
        'Assertive communication techniques',
        'Conflict resolution and negotiation strategies'
      ],
      es: [
        'Fundamentos y principios de comunicación',
        'Desarrollo de habilidades de escucha activa',
        'Técnicas de comunicación asertiva',
        'Estrategias de resolución de conflictos y negociación'
      ],
      fr: [
        'Fondamentaux et principes de communication',
        'Développement des compétences d\'écoute active',
        'Techniques de communication assertive',
        'Stratégies de résolution de conflits et de négociation'
      ],
      zh: [
        '沟通基础和原则',
        '积极倾听技能发展',
        '自信沟通技巧',
        '冲突解决和谈判策略'
      ]
    },
    'creativity-habits': {
      en: [
        'Creative thinking frameworks and methodologies',
        'Techniques to overcome creative blocks',
        'Daily practices to enhance creativity',
        'Applying creativity to real-world challenges'
      ],
      es: [
        'Marcos y metodologías de pensamiento creativo',
        'Técnicas para superar bloqueos creativos',
        'Prácticas diarias para mejorar la creatividad',
        'Aplicar la creatividad a desafíos del mundo real'
      ],
      fr: [
        'Cadres et méthodologies de pensée créative',
        'Techniques pour surmonter les blocages créatifs',
        'Pratiques quotidiennes pour améliorer la créativité',
        'Appliquer la créativité aux défis du monde réel'
      ],
      zh: [
        '创造性思维框架和方法论',
        '克服创造性障碍的技巧',
        '增强创造力的日常实践',
        '将创造力应用于现实世界的挑战'
      ]
    }
  };

  return learnMap[courseId]?.[language] || learnMap[courseId]?.['en'] || [
    'Practical skills and techniques',
    'Real-world applications',
    'Best practices and strategies',
    'Tools and resources'
  ];
};

// Helper function to get translated instructor info
const getTranslatedInstructorInfo = (courseId: string, language: string = 'en') => {
  const instructorMap: { [key: string]: { [key: string]: { name: string; bio: string; expertise: string[] } } } = {
    'habit-foundations': {
      en: {
        name: 'Dr. Sarah Johnson',
        bio: 'Behavioral psychologist with 10+ years of experience in habit formation research.',
        expertise: ['Behavioral Psychology', 'Habit Formation', 'Motivation Science']
      },
      es: {
        name: 'Dra. Sarah Johnson',
        bio: 'Psicóloga conductual con más de 10 años de experiencia en investigación de formación de hábitos.',
        expertise: ['Psicología Conductual', 'Formación de Hábitos', 'Ciencia de la Motivación']
      },
      fr: {
        name: 'Dr. Sarah Johnson',
        bio: 'Psychologue comportementale avec plus de 10 ans d\'expérience en recherche sur la formation d\'habitudes.',
        expertise: ['Psychologie Comportementale', 'Formation d\'Habitudes', 'Science de la Motivation']
      },
      zh: {
        name: 'Sarah Johnson 博士',
        bio: '行为心理学家，在习惯养成研究方面拥有超过10年的经验。',
        expertise: ['行为心理学', '习惯养成', '动机科学']
      }
    },
    'creative-thinking-habits': {
      en: {
        name: 'Prof. Michael Chen',
        bio: 'Creative thinking expert and innovation consultant with 15+ years of experience.',
        expertise: ['Creative Thinking', 'Innovation', 'Problem Solving']
      },
      es: {
        name: 'Prof. Michael Chen',
        bio: 'Experto en pensamiento creativo y consultor de innovación con más de 15 años de experiencia.',
        expertise: ['Pensamiento Creativo', 'Innovación', 'Resolución de Problemas']
      },
      fr: {
        name: 'Prof. Michael Chen',
        bio: 'Expert en pensée créative et consultant en innovation avec plus de 15 ans d\'expérience.',
        expertise: ['Pensée Créative', 'Innovation', 'Résolution de Problèmes']
      },
      zh: {
        name: 'Michael Chen 教授',
        bio: '创造性思维专家和创新顾问，拥有超过15年的经验。',
        expertise: ['创造性思维', '创新', '问题解决']
      }
    },
    'morning-routines': {
      en: {
        name: 'Dr. Emily Rodriguez',
        bio: 'Productivity expert and morning routine specialist with 12+ years of experience.',
        expertise: ['Morning Routines', 'Productivity', 'Habit Formation']
      },
      es: {
        name: 'Dra. Emily Rodriguez',
        bio: 'Experta en productividad y especialista en rutinas matutinas con más de 12 años de experiencia.',
        expertise: ['Rutinas Matutinas', 'Productividad', 'Formación de Hábitos']
      },
      fr: {
        name: 'Dr. Emily Rodriguez',
        bio: 'Experte en productivité et spécialiste des routines matinales avec plus de 12 ans d\'expérience.',
        expertise: ['Routines Matinales', 'Productivité', 'Formation d\'Habitudes']
      },
      zh: {
        name: 'Emily Rodriguez 博士',
        bio: '生产力专家和晨间习惯专家，拥有超过12年的经验。',
        expertise: ['晨间习惯', '生产力', '习惯养成']
      }
    },
    'fitness-habits': {
      en: {
        name: 'Coach Marcus Johnson',
        bio: 'Certified fitness trainer and habit coach with 15+ years of experience.',
        expertise: ['Fitness Training', 'Habit Coaching', 'Nutrition']
      },
      es: {
        name: 'Entrenador Marcus Johnson',
        bio: 'Entrenador de fitness certificado y coach de hábitos con más de 15 años de experiencia.',
        expertise: ['Entrenamiento de Fitness', 'Coaching de Hábitos', 'Nutrición']
      },
      fr: {
        name: 'Coach Marcus Johnson',
        bio: 'Entraîneur de fitness certifié et coach d\'habitudes avec plus de 15 ans d\'expérience.',
        expertise: ['Entraînement de Fitness', 'Coaching d\'Habitudes', 'Nutrition']
      },
      zh: {
        name: 'Marcus Johnson 教练',
        bio: '认证健身教练和习惯教练，拥有超过15年的经验。',
        expertise: ['健身训练', '习惯教练', '营养']
      }
    },
    'productivity-mastery': {
      en: {
        name: 'Prof. David Chen',
        bio: 'Productivity researcher and systems expert with 20+ years of experience.',
        expertise: ['Productivity Systems', 'Time Management', 'Focus Techniques']
      },
      es: {
        name: 'Prof. David Chen',
        bio: 'Investigador de productividad y experto en sistemas con más de 20 años de experiencia.',
        expertise: ['Sistemas de Productividad', 'Gestión del Tiempo', 'Técnicas de Enfoque']
      },
      fr: {
        name: 'Prof. David Chen',
        bio: 'Chercheur en productivité et expert en systèmes avec plus de 20 ans d\'expérience.',
        expertise: ['Systèmes de Productivité', 'Gestion du Temps', 'Techniques de Concentration']
      },
      zh: {
        name: 'David Chen 教授',
        bio: '生产力研究员和系统专家，拥有超过20年的经验。',
        expertise: ['生产力系统', '时间管理', '专注技巧']
      }
    },
    'mindfulness-meditation': {
      en: {
        name: 'Dr. Sarah Williams',
        bio: 'Mindfulness expert and meditation teacher with 18+ years of experience.',
        expertise: ['Mindfulness', 'Meditation', 'Stress Management']
      },
      es: {
        name: 'Dra. Sarah Williams',
        bio: 'Experta en atención plena y maestra de meditación con más de 18 años de experiencia.',
        expertise: ['Atención Plena', 'Meditación', 'Gestión del Estrés']
      },
      fr: {
        name: 'Dr. Sarah Williams',
        bio: 'Experte en pleine conscience et enseignante de méditation avec plus de 18 ans d\'expérience.',
        expertise: ['Pleine Conscience', 'Méditation', 'Gestion du Stress']
      },
      zh: {
        name: 'Sarah Williams 博士',
        bio: '正念专家和冥想老师，拥有超过18年的经验。',
        expertise: ['正念', '冥想', '压力管理']
      }
    },
    'learning-habits': {
      en: {
        name: 'Dr. Lisa Thompson',
        bio: 'Learning scientist and study skills expert with 16+ years of experience.',
        expertise: ['Learning Science', 'Study Techniques', 'Memory Enhancement']
      },
      es: {
        name: 'Dra. Lisa Thompson',
        bio: 'Científica del aprendizaje y experta en técnicas de estudio con más de 16 años de experiencia.',
        expertise: ['Ciencia del Aprendizaje', 'Técnicas de Estudio', 'Mejora de Memoria']
      },
      fr: {
        name: 'Dr. Lisa Thompson',
        bio: 'Scientifique de l\'apprentissage et experte en techniques d\'étude avec plus de 16 ans d\'expérience.',
        expertise: ['Science de l\'Apprentissage', 'Techniques d\'Étude', 'Amélioration de la Mémoire']
      },
      zh: {
        name: 'Lisa Thompson 博士',
        bio: '学习科学家和学习技巧专家，拥有超过16年的经验。',
        expertise: ['学习科学', '学习技巧', '记忆增强']
      }
    },
    'financial-habits': {
      en: {
        name: 'Prof. Robert Kim',
        bio: 'Financial advisor and money mindset expert with 14+ years of experience.',
        expertise: ['Financial Planning', 'Money Mindset', 'Investment Strategies']
      },
      es: {
        name: 'Prof. Robert Kim',
        bio: 'Asesor financiero y experto en mentalidad del dinero con más de 14 años de experiencia.',
        expertise: ['Planificación Financiera', 'Mentalidad del Dinero', 'Estrategias de Inversión']
      },
      fr: {
        name: 'Prof. Robert Kim',
        bio: 'Conseiller financier et expert en état d\'esprit sur l\'argent avec plus de 14 ans d\'expérience.',
        expertise: ['Planification Financière', 'État d\'Esprit sur l\'Argent', 'Stratégies d\'Investissement']
      },
      zh: {
        name: 'Robert Kim 教授',
        bio: '财务顾问和金钱心态专家，拥有超过14年的经验。',
        expertise: ['财务规划', '金钱心态', '投资策略']
      }
    },
    'sleep-habits': {
      en: {
        name: 'Dr. Amanda Foster',
        bio: 'Sleep specialist and wellness expert with 13+ years of experience.',
        expertise: ['Sleep Science', 'Sleep Hygiene', 'Wellness']
      },
      es: {
        name: 'Dra. Amanda Foster',
        bio: 'Especialista en sueño y experta en bienestar con más de 13 años de experiencia.',
        expertise: ['Ciencia del Sueño', 'Higiene del Sueño', 'Bienestar']
      },
      fr: {
        name: 'Dr. Amanda Foster',
        bio: 'Spécialiste du sommeil et experte en bien-être avec plus de 13 ans d\'expérience.',
        expertise: ['Science du Sommeil', 'Hygiène du Sommeil', 'Bien-être']
      },
      zh: {
        name: 'Amanda Foster 博士',
        bio: '睡眠专家和健康专家，拥有超过13年的经验。',
        expertise: ['睡眠科学', '睡眠卫生', '健康']
      }
    },
    'communication-habits': {
      en: {
        name: 'Prof. Jennifer Lee',
        bio: 'Communication expert and interpersonal skills trainer with 17+ years of experience.',
        expertise: ['Communication', 'Interpersonal Skills', 'Conflict Resolution']
      },
      es: {
        name: 'Prof. Jennifer Lee',
        bio: 'Experta en comunicación y entrenadora de habilidades interpersonales con más de 17 años de experiencia.',
        expertise: ['Comunicación', 'Habilidades Interpersonales', 'Resolución de Conflictos']
      },
      fr: {
        name: 'Prof. Jennifer Lee',
        bio: 'Experte en communication et formatrice en compétences interpersonnelles avec plus de 17 ans d\'expérience.',
        expertise: ['Communication', 'Compétences Interpersonnelles', 'Résolution de Conflits']
      },
      zh: {
        name: 'Jennifer Lee 教授',
        bio: '沟通专家和人际技能培训师，拥有超过17年的经验。',
        expertise: ['沟通', '人际技能', '冲突解决']
      }
    },
    'creativity-habits': {
      en: {
        name: 'Prof. Michael Chen',
        bio: 'Creative thinking expert and innovation consultant with 15+ years of experience.',
        expertise: ['Creative Thinking', 'Innovation', 'Problem Solving']
      },
      es: {
        name: 'Prof. Michael Chen',
        bio: 'Experto en pensamiento creativo y consultor de innovación con más de 15 años de experiencia.',
        expertise: ['Pensamiento Creativo', 'Innovación', 'Resolución de Problemas']
      },
      fr: {
        name: 'Prof. Michael Chen',
        bio: 'Expert en pensée créative et consultant en innovation avec plus de 15 ans d\'expérience.',
        expertise: ['Pensée Créative', 'Innovation', 'Résolution de Problèmes']
      },
      zh: {
        name: 'Michael Chen 教授',
        bio: '创造性思维专家和创新顾问，拥有超过15年的经验。',
        expertise: ['创造性思维', '创新', '问题解决']
      }
    }
  };

  return instructorMap[courseId]?.[language] || instructorMap[courseId]?.['en'] || {
    name: 'Expert Instructor',
    bio: 'Experienced professional in the field.',
    expertise: ['Course Topic', 'Professional Development', 'Skill Building']
  };
};

// Helper function to get translated sample content
const getTranslatedSampleContent = (courseId: string, language: string = 'en') => {
  const sampleMap: { [key: string]: { [key: string]: { type: 'video' | 'text' | 'interactive'; title: string; content: string; duration: number } } } = {
    'habit-foundations': {
      en: {
        type: 'video',
        title: 'Introduction to Habit Formation',
        content: 'Welcome to Habit Formation 101. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a la Formación de Hábitos',
        content: 'Bienvenido a Formación de Hábitos 101. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction à la Formation d\'Habitudes',
        content: 'Bienvenue dans Formation d\'Habitudes 101. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '习惯养成导论',
        content: '欢迎来到习惯养成101。在本课程中，您将学习...',
        duration: 5
      }
    },
    'creative-thinking-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Creative Thinking',
        content: 'Welcome to Creative Thinking Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción al Pensamiento Creativo',
        content: 'Bienvenido a Hábitos de Pensamiento Creativo. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction à la Pensée Créative',
        content: 'Bienvenue dans Habitudes de Pensée Créative. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '创造性思维导论',
        content: '欢迎来到创造性思维习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'morning-routines': {
      en: {
        type: 'video',
        title: 'Introduction to Morning Routines',
        content: 'Welcome to Morning Routines. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a las Rutinas Matutinas',
        content: 'Bienvenido a Rutinas Matutinas. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Routines Matinales',
        content: 'Bienvenue dans Routines Matinales. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '晨间习惯导论',
        content: '欢迎来到晨间习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'fitness-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Fitness Habits',
        content: 'Welcome to Fitness Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos de Fitness',
        content: 'Bienvenido a Hábitos de Fitness. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes de Fitness',
        content: 'Bienvenue dans Habitudes de Fitness. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '健身习惯导论',
        content: '欢迎来到健身习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'productivity-mastery': {
      en: {
        type: 'video',
        title: 'Introduction to Productivity Mastery',
        content: 'Welcome to Productivity Mastery. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a la Maestría en Productividad',
        content: 'Bienvenido a Maestría en Productividad. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction à la Maîtrise de la Productivité',
        content: 'Bienvenue dans Maîtrise de la Productivité. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '生产力掌握导论',
        content: '欢迎来到生产力掌握。在本课程中，您将学习...',
        duration: 5
      }
    },
    'mindfulness-meditation': {
      en: {
        type: 'video',
        title: 'Introduction to Mindfulness & Meditation',
        content: 'Welcome to Mindfulness & Meditation Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a la Atención Plena y Meditación',
        content: 'Bienvenido a Hábitos de Atención Plena y Meditación. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction à la Pleine Conscience et Méditation',
        content: 'Bienvenue dans Habitudes de Pleine Conscience et Méditation. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '正念与冥想导论',
        content: '欢迎来到正念与冥想习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'learning-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Learning & Study Habits',
        content: 'Welcome to Learning & Study Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos de Aprendizaje y Estudio',
        content: 'Bienvenido a Hábitos de Aprendizaje y Estudio. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes d\'Apprentissage et d\'Étude',
        content: 'Bienvenue dans Habitudes d\'Apprentissage et d\'Étude. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '学习与学习习惯导论',
        content: '欢迎来到学习与学习习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'financial-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Financial Habits',
        content: 'Welcome to Financial Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos Financieros',
        content: 'Bienvenido a Hábitos Financieros. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes Financières',
        content: 'Bienvenue dans Habitudes Financières. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '财务习惯导论',
        content: '欢迎来到财务习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'sleep-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Sleep Optimization Habits',
        content: 'Welcome to Sleep Optimization Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos de Optimización del Sueño',
        content: 'Bienvenido a Hábitos de Optimización del Sueño. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes d\'Optimisation du Sommeil',
        content: 'Bienvenue dans Habitudes d\'Optimisation du Sommeil. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '睡眠优化习惯导论',
        content: '欢迎来到睡眠优化习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'communication-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Effective Communication Habits',
        content: 'Welcome to Effective Communication Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos de Comunicación Efectiva',
        content: 'Bienvenido a Hábitos de Comunicación Efectiva. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes de Communication Efficace',
        content: 'Bienvenue dans Habitudes de Communication Efficace. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '有效沟通习惯导论',
        content: '欢迎来到有效沟通习惯。在本课程中，您将学习...',
        duration: 5
      }
    },
    'creativity-habits': {
      en: {
        type: 'video',
        title: 'Introduction to Creativity Habits',
        content: 'Welcome to Creativity Habits. In this course, you\'ll learn...',
        duration: 5
      },
      es: {
        type: 'video',
        title: 'Introducción a los Hábitos de Creatividad',
        content: 'Bienvenido a Hábitos de Creatividad. En este curso, aprenderás...',
        duration: 5
      },
      fr: {
        type: 'video',
        title: 'Introduction aux Habitudes de Créativité',
        content: 'Bienvenue dans Habitudes de Créativité. Dans ce cours, vous apprendrez...',
        duration: 5
      },
      zh: {
        type: 'video',
        title: '创造力习惯导论',
        content: '欢迎来到创造力习惯。在本课程中，您将学习...',
        duration: 5
      }
    }
  };

  return sampleMap[courseId]?.[language] || sampleMap[courseId]?.['en'] || {
    type: 'video' as const,
    title: 'Course Introduction',
    content: 'Welcome to this course. You will learn valuable skills and knowledge.',
    duration: 5
  };
};

// Helper function to get translated reviews
const getTranslatedReviews = (courseId: string, language: string = 'en') => {
  const reviewsMap: { [key: string]: { [key: string]: { rating: number; comment: string; userName: string; date: string }[] } } = {
    'habit-foundations': {
      en: [
        {
          rating: 4.8,
          comment: 'Excellent course! Really helped me understand how habits work.',
          userName: 'Alex M.',
          date: '2024-01-15'
        }
      ],
      es: [
        {
          rating: 4.8,
          comment: '¡Excelente curso! Realmente me ayudó a entender cómo funcionan los hábitos.',
          userName: 'Alex M.',
          date: '2024-01-15'
        }
      ],
      fr: [
        {
          rating: 4.8,
          comment: 'Excellent cours ! Cela m\'a vraiment aidé à comprendre comment fonctionnent les habitudes.',
          userName: 'Alex M.',
          date: '2024-01-15'
        }
      ],
      zh: [
        {
          rating: 4.8,
          comment: '优秀的课程！真的帮助我理解了习惯是如何运作的。',
          userName: 'Alex M.',
          date: '2024-01-15'
        }
      ]
    },
    'creative-thinking-habits': {
      en: [
        {
          rating: 4.7,
          comment: 'Amazing course! Really helped me unlock my creative potential.',
          userName: 'Sarah L.',
          date: '2024-01-20'
        }
      ],
      es: [
        {
          rating: 4.7,
          comment: '¡Curso increíble! Realmente me ayudó a desbloquear mi potencial creativo.',
          userName: 'Sarah L.',
          date: '2024-01-20'
        }
      ],
      fr: [
        {
          rating: 4.7,
          comment: 'Cours incroyable ! Cela m\'a vraiment aidé à libérer mon potentiel créatif.',
          userName: 'Sarah L.',
          date: '2024-01-20'
        }
      ],
      zh: [
        {
          rating: 4.7,
          comment: '令人惊叹的课程！真的帮助我释放了创造潜力。',
          userName: 'Sarah L.',
          date: '2024-01-20'
        }
      ]
    },
    'morning-routines': {
      en: [
        {
          rating: 4.8,
          comment: 'This course completely transformed my mornings. The science behind morning routines is fascinating and the practical strategies are life-changing.',
          userName: 'Sarah M.',
          date: '2024-01-20'
        },
        {
          rating: 4.9,
          comment: 'Excellent course on morning routines. The instructor provides clear, actionable steps that have significantly improved my productivity.',
          userName: 'Michael R.',
          date: '2024-01-18'
        }
      ],
      es: [
        {
          rating: 4.8,
          comment: 'Este curso transformó completamente mis mañanas. La ciencia detrás de las rutinas matutinas es fascinante y las estrategias prácticas son transformadoras.',
          userName: 'Sarah M.',
          date: '2024-01-20'
        },
        {
          rating: 4.9,
          comment: 'Excelente curso sobre rutinas matutinas. El instructor proporciona pasos claros y accionables que han mejorado significativamente mi productividad.',
          userName: 'Michael R.',
          date: '2024-01-18'
        }
      ],
      fr: [
        {
          rating: 4.8,
          comment: 'Ce cours a complètement transformé mes matins. La science derrière les routines matinales est fascinante et les stratégies pratiques sont transformatrices.',
          userName: 'Sarah M.',
          date: '2024-01-20'
        },
        {
          rating: 4.9,
          comment: 'Excellent cours sur les routines matinales. L\'instructeur fournit des étapes claires et actionnables qui ont considérablement amélioré ma productivité.',
          userName: 'Michael R.',
          date: '2024-01-18'
        }
      ],
      zh: [
        {
          rating: 4.8,
          comment: '这门课程彻底改变了我的早晨。晨间习惯背后的科学令人着迷，实用策略具有改变生活的效果。',
          userName: 'Sarah M.',
          date: '2024-01-20'
        },
        {
          rating: 4.9,
          comment: '关于晨间习惯的优秀课程。讲师提供清晰、可操作的步骤，显著提高了我的生产力。',
          userName: 'Michael R.',
          date: '2024-01-18'
        }
      ]
    },
    'fitness-habits': {
      en: [
        {
          rating: 4.7,
          comment: 'Great course on building sustainable fitness habits. The approach focuses on long-term success rather than quick fixes.',
          userName: 'David L.',
          date: '2024-01-22'
        },
        {
          rating: 4.8,
          comment: 'This course helped me understand the psychology behind fitness motivation and build lasting workout routines.',
          userName: 'Emma W.',
          date: '2024-01-19'
        }
      ],
      es: [
        {
          rating: 4.7,
          comment: 'Excelente curso sobre construcción de hábitos de fitness sostenibles. El enfoque se centra en el éxito a largo plazo en lugar de soluciones rápidas.',
          userName: 'David L.',
          date: '2024-01-22'
        },
        {
          rating: 4.8,
          comment: 'Este curso me ayudó a entender la psicología detrás de la motivación del fitness y construir rutinas de ejercicio duraderas.',
          userName: 'Emma W.',
          date: '2024-01-19'
        }
      ],
      fr: [
        {
          rating: 4.7,
          comment: 'Excellent cours sur la construction d\'habitudes de fitness durables. L\'approche se concentre sur le succès à long terme plutôt que sur des solutions rapides.',
          userName: 'David L.',
          date: '2024-01-22'
        },
        {
          rating: 4.8,
          comment: 'Ce cours m\'a aidé à comprendre la psychologie derrière la motivation du fitness et à construire des routines d\'entraînement durables.',
          userName: 'Emma W.',
          date: '2024-01-19'
        }
      ],
      zh: [
        {
          rating: 4.7,
          comment: '关于建立可持续健身习惯的优秀课程。方法专注于长期成功而不是快速解决方案。',
          userName: 'David L.',
          date: '2024-01-22'
        },
        {
          rating: 4.8,
          comment: '这门课程帮助我理解健身动机背后的心理学，并建立持久的锻炼习惯。',
          userName: 'Emma W.',
          date: '2024-01-19'
        }
      ]
    },
    'productivity-mastery': {
      en: [
        {
          rating: 4.9,
          comment: 'Outstanding course on productivity mastery. The advanced techniques and frameworks have revolutionized my work efficiency.',
          userName: 'Alex K.',
          date: '2024-01-25'
        },
        {
          rating: 4.8,
          comment: 'This course provides comprehensive productivity systems that integrate seamlessly into daily life.',
          userName: 'Lisa P.',
          date: '2024-01-23'
        }
      ],
      es: [
        {
          rating: 4.9,
          comment: 'Curso excepcional sobre maestría en productividad. Las técnicas avanzadas y marcos han revolucionado mi eficiencia laboral.',
          userName: 'Alex K.',
          date: '2024-01-25'
        },
        {
          rating: 4.8,
          comment: 'Este curso proporciona sistemas de productividad integrales que se integran perfectamente en la vida diaria.',
          userName: 'Lisa P.',
          date: '2024-01-23'
        }
      ],
      fr: [
        {
          rating: 4.9,
          comment: 'Cours exceptionnel sur la maîtrise de la productivité. Les techniques avancées et les cadres ont révolutionné mon efficacité au travail.',
          userName: 'Alex K.',
          date: '2024-01-25'
        },
        {
          rating: 4.8,
          comment: 'Ce cours fournit des systèmes de productivité complets qui s\'intègrent parfaitement dans la vie quotidienne.',
          userName: 'Lisa P.',
          date: '2024-01-23'
        }
      ],
      zh: [
        {
          rating: 4.9,
          comment: '关于生产力掌握的杰出课程。高级技巧和框架彻底改变了我的工作效率。',
          userName: 'Alex K.',
          date: '2024-01-25'
        },
        {
          rating: 4.8,
          comment: '这门课程提供全面的生产力系统，无缝融入日常生活。',
          userName: 'Lisa P.',
          date: '2024-01-23'
        }
      ]
    },
    'mindfulness-meditation': {
      en: [
        {
          rating: 4.8,
          comment: 'Beautiful course on mindfulness and meditation. The practical techniques have brought peace and clarity to my daily life.',
          userName: 'Maria S.',
          date: '2024-01-28'
        },
        {
          rating: 4.9,
          comment: 'This course teaches mindfulness in a way that\'s accessible and immediately applicable. Highly recommended for stress management.',
          userName: 'James T.',
          date: '2024-01-26'
        }
      ],
      es: [
        {
          rating: 4.8,
          comment: 'Hermoso curso sobre atención plena y meditación. Las técnicas prácticas han traído paz y claridad a mi vida diaria.',
          userName: 'Maria S.',
          date: '2024-01-28'
        },
        {
          rating: 4.9,
          comment: 'Este curso enseña la atención plena de una manera accesible e inmediatamente aplicable. Altamente recomendado para la gestión del estrés.',
          userName: 'James T.',
          date: '2024-01-26'
        }
      ],
      fr: [
        {
          rating: 4.8,
          comment: 'Beau cours sur la pleine conscience et la méditation. Les techniques pratiques ont apporté paix et clarté à ma vie quotidienne.',
          userName: 'Maria S.',
          date: '2024-01-28'
        },
        {
          rating: 4.9,
          comment: 'Ce cours enseigne la pleine conscience d\'une manière accessible et immédiatement applicable. Très recommandé pour la gestion du stress.',
          userName: 'James T.',
          date: '2024-01-26'
        }
      ],
      zh: [
        {
          rating: 4.8,
          comment: '关于正念和冥想的精彩课程。实用技巧为我的日常生活带来了平静和清晰。',
          userName: 'Maria S.',
          date: '2024-01-28'
        },
        {
          rating: 4.9,
          comment: '这门课程以易于理解和立即应用的方式教授正念。强烈推荐用于压力管理。',
          userName: 'James T.',
          date: '2024-01-26'
        }
      ]
    },
    'learning-habits': {
      en: [
        {
          rating: 4.7,
          comment: 'Excellent course on learning and study habits. The memory techniques and study strategies are incredibly effective.',
          userName: 'Tom B.',
          date: '2024-01-30'
        },
        {
          rating: 4.8,
          comment: 'This course has transformed how I approach learning. The lifelong learning skills are invaluable.',
          userName: 'Rachel G.',
          date: '2024-01-27'
        }
      ],
      es: [
        {
          rating: 4.7,
          comment: 'Excelente curso sobre hábitos de aprendizaje y estudio. Las técnicas de memoria y estrategias de estudio son increíblemente efectivas.',
          userName: 'Tom B.',
          date: '2024-01-30'
        },
        {
          rating: 4.8,
          comment: 'Este curso ha transformado cómo abordo el aprendizaje. Las habilidades de aprendizaje permanente son invaluables.',
          userName: 'Rachel G.',
          date: '2024-01-27'
        }
      ],
      fr: [
        {
          rating: 4.7,
          comment: 'Excellent cours sur les habitudes d\'apprentissage et d\'étude. Les techniques de mémoire et les stratégies d\'étude sont incroyablement efficaces.',
          userName: 'Tom B.',
          date: '2024-01-30'
        },
        {
          rating: 4.8,
          comment: 'Ce cours a transformé ma façon d\'aborder l\'apprentissage. Les compétences d\'apprentissage tout au long de la vie sont inestimables.',
          userName: 'Rachel G.',
          date: '2024-01-27'
        }
      ],
      zh: [
        {
          rating: 4.7,
          comment: '关于学习和学习习惯的优秀课程。记忆技巧和学习策略非常有效。',
          userName: 'Tom B.',
          date: '2024-01-30'
        },
        {
          rating: 4.8,
          comment: '这门课程改变了我学习的方式。终身学习技能是无价的。',
          userName: 'Rachel G.',
          date: '2024-01-27'
        }
      ]
    },
    'financial-habits': {
      en: [
        {
          rating: 4.8,
          comment: 'Life-changing course on financial habits. The money mindset principles and practical strategies are game-changing.',
          userName: 'Kevin M.',
          date: '2024-02-02'
        },
        {
          rating: 4.9,
          comment: 'This course provides a comprehensive approach to building healthy financial habits for long-term security.',
          userName: 'Amanda H.',
          date: '2024-01-31'
        }
      ],
      es: [
        {
          rating: 4.8,
          comment: 'Curso transformador sobre hábitos financieros. Los principios de mentalidad del dinero y estrategias prácticas son revolucionarios.',
          userName: 'Kevin M.',
          date: '2024-02-02'
        },
        {
          rating: 4.9,
          comment: 'Este curso proporciona un enfoque integral para construir hábitos financieros saludables para la seguridad a largo plazo.',
          userName: 'Amanda H.',
          date: '2024-01-31'
        }
      ],
      fr: [
        {
          rating: 4.8,
          comment: 'Cours transformateur sur les habitudes financières. Les principes d\'état d\'esprit sur l\'argent et les stratégies pratiques sont révolutionnaires.',
          userName: 'Kevin M.',
          date: '2024-02-02'
        },
        {
          rating: 4.9,
          comment: 'Ce cours fournit une approche complète pour construire des habitudes financières saines pour la sécurité à long terme.',
          userName: 'Amanda H.',
          date: '2024-01-31'
        }
      ],
      zh: [
        {
          rating: 4.8,
          comment: '关于财务习惯的改变生活的课程。金钱心态原则和实用策略具有革命性。',
          userName: 'Kevin M.',
          date: '2024-02-02'
        },
        {
          rating: 4.9,
          comment: '这门课程提供了建立健康财务习惯以实现长期安全的综合方法。',
          userName: 'Amanda H.',
          date: '2024-01-31'
        }
      ]
    },
    'sleep-habits': {
      en: [
        {
          rating: 4.9,
          comment: 'Incredible course on sleep optimization. The science behind sleep and practical techniques have dramatically improved my rest quality.',
          userName: 'Chris L.',
          date: '2024-02-05'
        },
        {
          rating: 4.8,
          comment: 'This course provides evidence-based strategies for better sleep. The sleep hygiene practices are easy to implement.',
          userName: 'Nina R.',
          date: '2024-02-03'
        }
      ],
      es: [
        {
          rating: 4.9,
          comment: 'Curso increíble sobre optimización del sueño. La ciencia detrás del sueño y las técnicas prácticas han mejorado dramáticamente mi calidad de descanso.',
          userName: 'Chris L.',
          date: '2024-02-05'
        },
        {
          rating: 4.8,
          comment: 'Este curso proporciona estrategias basadas en evidencia para mejor sueño. Las prácticas de higiene del sueño son fáciles de implementar.',
          userName: 'Nina R.',
          date: '2024-02-03'
        }
      ],
      fr: [
        {
          rating: 4.9,
          comment: 'Cours incroyable sur l\'optimisation du sommeil. La science derrière le sommeil et les techniques pratiques ont considérablement amélioré ma qualité de repos.',
          userName: 'Chris L.',
          date: '2024-02-05'
        },
        {
          rating: 4.8,
          comment: 'Ce cours fournit des stratégies fondées sur des preuves pour un meilleur sommeil. Les pratiques d\'hygiène du sommeil sont faciles à mettre en œuvre.',
          userName: 'Nina R.',
          date: '2024-02-03'
        }
      ],
      zh: [
        {
          rating: 4.9,
          comment: '关于睡眠优化的精彩课程。睡眠背后的科学和实用技巧显著改善了我的休息质量。',
          userName: 'Chris L.',
          date: '2024-02-05'
        },
        {
          rating: 4.8,
          comment: '这门课程提供基于证据的更好睡眠策略。睡眠卫生实践易于实施。',
          userName: 'Nina R.',
          date: '2024-02-03'
        }
      ]
    },
    'communication-habits': {
      en: [
        {
          rating: 4.8,
          comment: 'Excellent course on communication habits. The active listening and conflict resolution skills are invaluable.',
          userName: 'Daniel W.',
          date: '2024-02-08'
        },
        {
          rating: 4.9,
          comment: 'This course has improved my communication skills dramatically. The practical techniques are immediately applicable.',
          userName: 'Sophie K.',
          date: '2024-02-06'
        }
      ],
      es: [
        {
          rating: 4.8,
          comment: 'Excelente curso sobre hábitos de comunicación. Las habilidades de escucha activa y resolución de conflictos son invaluables.',
          userName: 'Daniel W.',
          date: '2024-02-08'
        },
        {
          rating: 4.9,
          comment: 'Este curso ha mejorado mis habilidades de comunicación dramáticamente. Las técnicas prácticas son inmediatamente aplicables.',
          userName: 'Sophie K.',
          date: '2024-02-06'
        }
      ],
      fr: [
        {
          rating: 4.8,
          comment: 'Excellent cours sur les habitudes de communication. Les compétences d\'écoute active et de résolution de conflits sont inestimables.',
          userName: 'Daniel W.',
          date: '2024-02-08'
        },
        {
          rating: 4.9,
          comment: 'Ce cours a considérablement amélioré mes compétences de communication. Les techniques pratiques sont immédiatement applicables.',
          userName: 'Sophie K.',
          date: '2024-02-06'
        }
      ],
      zh: [
        {
          rating: 4.8,
          comment: '关于沟通习惯的优秀课程。积极倾听和冲突解决技能是无价的。',
          userName: 'Daniel W.',
          date: '2024-02-08'
        },
        {
          rating: 4.9,
          comment: '这门课程显著改善了我的沟通技能。实用技巧可以立即应用。',
          userName: 'Sophie K.',
          date: '2024-02-06'
        }
      ]
    },
    'creativity-habits': {
      en: [
        {
          rating: 4.9,
          comment: 'Amazing course on creativity habits. The techniques to overcome creative blocks and daily practices are transformative.',
          userName: 'Jessica P.',
          date: '2024-02-10'
        },
        {
          rating: 4.8,
          comment: 'This course has unlocked my creative potential. The systematic approach to creativity is brilliant.',
          userName: 'Mark T.',
          date: '2024-02-08'
        }
      ],
      es: [
        {
          rating: 4.9,
          comment: 'Curso increíble sobre hábitos de creatividad. Las técnicas para superar bloqueos creativos y prácticas diarias son transformadoras.',
          userName: 'Jessica P.',
          date: '2024-02-10'
        },
        {
          rating: 4.8,
          comment: 'Este curso ha desbloqueado mi potencial creativo. El enfoque sistemático de la creatividad es brillante.',
          userName: 'Mark T.',
          date: '2024-02-08'
        }
      ],
      fr: [
        {
          rating: 4.9,
          comment: 'Cours incroyable sur les habitudes de créativité. Les techniques pour surmonter les blocages créatifs et les pratiques quotidiennes sont transformatrices.',
          userName: 'Jessica P.',
          date: '2024-02-10'
        },
        {
          rating: 4.8,
          comment: 'Ce cours a libéré mon potentiel créatif. L\'approche systématique de la créativité est brillante.',
          userName: 'Mark T.',
          date: '2024-02-08'
        }
      ],
      zh: [
        {
          rating: 4.9,
          comment: '关于创造力习惯的精彩课程。克服创造性障碍的技巧和日常实践具有变革性。',
          userName: 'Jessica P.',
          date: '2024-02-10'
        },
        {
          rating: 4.8,
          comment: '这门课程释放了我的创造潜力。系统性的创造力方法很出色。',
          userName: 'Mark T.',
          date: '2024-02-08'
        }
      ]
    }
  };

  return reviewsMap[courseId]?.[language] || reviewsMap[courseId]?.['en'] || [
    {
      rating: 4.5,
      comment: 'Great course with valuable content.',
      userName: 'Student',
      date: '2024-01-01'
    }
  ];
};

// Helper function to get translated module content
const getTranslatedModuleContent = (moduleId: string, language: string = 'en') => {
  const moduleContentMap: { [key: string]: { [key: string]: { title: string; description: string } } } = {
    'sleep-science': {
      en: { title: 'The Science of Sleep', description: 'Understanding sleep cycles and their importance' },
      es: { title: 'La Ciencia del Sueño', description: 'Entendiendo los ciclos del sueño y su importancia' },
      fr: { title: 'La Science du Sommeil', description: 'Comprendre les cycles du sommeil et leur importance' },
      zh: { title: '睡眠科学', description: '理解睡眠周期及其重要性' }
    },
    'sleep-hygiene': {
      en: { title: 'Sleep Hygiene Practices', description: 'Learn essential sleep hygiene habits for better rest' },
      es: { title: 'Prácticas de Higiene del Sueño', description: 'Aprende hábitos esenciales de higiene del sueño para mejor descanso' },
      fr: { title: 'Pratiques d\'Hygiène du Sommeil', description: 'Apprenez les habitudes essentielles d\'hygiène du sommeil pour un meilleur repos' },
      zh: { title: '睡眠卫生实践', description: '学习更好的休息的基本睡眠卫生习惯' }
    },
    'sleep-environment': {
      en: { title: 'Optimizing Your Sleep Environment', description: 'Create the perfect sleep environment for quality rest' },
      es: { title: 'Optimizando Tu Entorno de Sueño', description: 'Crea el entorno de sueño perfecto para descanso de calidad' },
      fr: { title: 'Optimiser Votre Environnement de Sommeil', description: 'Créez l\'environnement de sommeil parfait pour un repos de qualité' },
      zh: { title: '优化您的睡眠环境', description: '为优质休息创建完美的睡眠环境' }
    },
    'sleep-disorders': {
      en: { title: 'Managing Sleep Challenges', description: 'Address common sleep issues and disorders' },
      es: { title: 'Manejando Desafíos del Sueño', description: 'Aborda problemas comunes del sueño y trastornos' },
      fr: { title: 'Gérer les Défis du Sommeil', description: 'Abordez les problèmes de sommeil courants et les troubles' },
      zh: { title: '管理睡眠挑战', description: '解决常见的睡眠问题和障碍' }
    }
  };

  return moduleContentMap[moduleId]?.[language] || moduleContentMap[moduleId]?.['en'] || { title: '', description: '' };
};

// Helper function to get translated content strings
const getTranslatedContentString = (contentKey: string, language: string = 'en') => {
  const contentStringMap: { [key: string]: { [key: string]: string } } = {
    'sleep-science-intro': {
      en: 'Introduction to Sleep Science',
      es: 'Introducción a la Ciencia del Sueño',
      fr: 'Introduction à la Science du Sommeil',
      zh: '睡眠科学导论'
    },
    'sleep-hygiene-guide': {
      en: 'Sleep Hygiene Guide',
      es: 'Guía de Higiene del Sueño',
      fr: 'Guide d\'Hygiène du Sommeil',
      zh: '睡眠卫生指南'
    },
    'sleep-environment-guide': {
      en: 'Sleep Environment Guide',
      es: 'Guía del Entorno de Sueño',
      fr: 'Guide de l\'Environnement de Sommeil',
      zh: '睡眠环境指南'
    },
    'sleep-disorders-quiz': {
      en: 'Sleep Disorders Quiz',
      es: 'Cuestionario de Trastornos del Sueño',
      fr: 'Quiz sur les Troubles du Sommeil',
      zh: '睡眠障碍测验'
    }
  };

  return contentStringMap[contentKey]?.[language] || contentStringMap[contentKey]?.['en'] || contentKey;
};

// Helper function to get translated guided setup content
const getTranslatedGuidedSetupContent = (setupId: string, language: string = 'en') => {
  const guidedSetupContentMap: { [key: string]: { [key: string]: { title: string; description: string } } } = {
    'first-habit-setup': {
      en: { title: 'Your First Habit', description: 'A guided walkthrough to help you create your first successful habit' },
      es: { title: 'Tu Primer Hábito', description: 'Una guía paso a paso para ayudarte a crear tu primer hábito exitoso' },
      fr: { title: 'Votre Premier Habitude', description: 'Un guide étape par étape pour vous aider à créer votre première habitude réussie' },
      zh: { title: '您的第一个习惯', description: '一个分步指南，帮助您创建第一个成功的习惯' }
    },
    'productivity-setup': {
      en: { title: 'Productivity Habits', description: 'Build habits that will transform your productivity' },
      es: { title: 'Hábitos de Productividad', description: 'Construye hábitos que transformarán tu productividad' },
      fr: { title: 'Habitudes de Productivité', description: 'Construisez des habitudes qui transformeront votre productivité' },
      zh: { title: '生产力习惯', description: '建立将改变您生产力的习惯' }
    }
  };

  return guidedSetupContentMap[setupId]?.[language] || guidedSetupContentMap[setupId]?.['en'] || { title: '', description: '' };
};

// Helper function to get translated guided setup step content
const getTranslatedGuidedSetupStepContent = (stepId: string, language: string = 'en') => {
  const stepContentMap: { [key: string]: { [key: string]: { title: string; description: string } } } = {
    'goal-setting': {
      en: { title: 'Set Your Goal', description: 'What do you want to achieve?' },
      es: { title: 'Establece Tu Meta', description: '¿Qué quieres lograr?' },
      fr: { title: 'Définissez Votre Objectif', description: 'Que voulez-vous accomplir?' },
      zh: { title: '设定您的目标', description: '您想要实现什么？' }
    },
    'habit-selection': {
      en: { title: 'Choose Your Habit', description: 'Select a habit that will help you reach your goal' },
      es: { title: 'Elige Tu Hábito', description: 'Selecciona un hábito que te ayude a alcanzar tu meta' },
      fr: { title: 'Choisissez Votre Habitude', description: 'Sélectionnez une habitude qui vous aidera à atteindre votre objectif' },
      zh: { title: '选择您的习惯', description: '选择一个能帮助您达到目标的习惯' }
    },
    'specificity': {
      en: { title: 'Make It Specific', description: 'Define exactly what, when, and where you will do this habit' },
      es: { title: 'Hazlo Específico', description: 'Define exactamente qué, cuándo y dónde harás este hábito' },
      fr: { title: 'Rendez-la Spécifique', description: 'Définissez exactement quoi, quand et où vous ferez cette habitude' },
      zh: { title: '使其具体化', description: '明确定义您将在何时何地做什么' }
    },
    'cue-identification': {
      en: { title: 'Identify Your Cue', description: 'What will trigger this habit?' },
      es: { title: 'Identifica Tu Señal', description: '¿Qué activará este hábito?' },
      fr: { title: 'Identifiez Votre Déclencheur', description: 'Qu\'est-ce qui déclenchera cette habitude?' },
      zh: { title: '识别您的触发因素', description: '什么会触发这个习惯？' }
    },
    'reward-planning': {
      en: { title: 'Plan Your Reward', description: 'How will you reward yourself for completing the habit?' },
      es: { title: 'Planifica Tu Recompensa', description: '¿Cómo te recompensarás por completar el hábito?' },
      fr: { title: 'Planifiez Votre Récompense', description: 'Comment vous récompenserez-vous pour avoir terminé l\'habitude?' },
      zh: { title: '计划您的奖励', description: '您将如何奖励自己完成习惯？' }
    },
    'confirmation': {
      en: { title: 'Confirm Your Plan', description: 'Review and confirm your habit plan' },
      es: { title: 'Confirma Tu Plan', description: 'Revisa y confirma tu plan de hábitos' },
      fr: { title: 'Confirmez Votre Plan', description: 'Révisez et confirmez votre plan d\'habitudes' },
      zh: { title: '确认您的计划', description: '审查并确认您的习惯计划' }
    },
    'productivity-assessment': {
      en: { title: 'Assess Your Current Productivity', description: 'Rate your current productivity in different areas' },
      es: { title: 'Evalúa Tu Productividad Actual', description: 'Califica tu productividad actual en diferentes áreas' },
      fr: { title: 'Évaluez Votre Productivité Actuelle', description: 'Évaluez votre productivité actuelle dans différents domaines' },
      zh: { title: '评估您当前的生产力', description: '评估您在不同领域的当前生产力' }
    },
    'productivity-goals': {
      en: { title: 'Set Productivity Goals', description: 'What productivity improvements do you want to make?' },
      es: { title: 'Establece Metas de Productividad', description: '¿Qué mejoras de productividad quieres hacer?' },
      fr: { title: 'Définissez les Objectifs de Productivité', description: 'Quelles améliorations de productivité voulez-vous apporter?' },
      zh: { title: '设定生产力目标', description: '您想要做出哪些生产力改进？' }
    },
    'implementation-plan': {
      en: { title: 'Create Implementation Plan', description: 'Plan how you will implement these habits' },
      es: { title: 'Crea Plan de Implementación', description: 'Planifica cómo implementarás estos hábitos' },
      fr: { title: 'Créez un Plan d\'Implémentation', description: 'Planifiez comment vous implémenterez ces habitudes' },
      zh: { title: '创建实施计划', description: '计划如何实施这些习惯' }
    }
  };

  return stepContentMap[stepId]?.[language] || stepContentMap[stepId]?.['en'] || { title: '', description: '' };
};

// Helper function to get translated guided setup options
const getTranslatedGuidedSetupOptions = (options: string[], language: string = 'en') => {
  const optionMap: { [key: string]: { [key: string]: string } } = {
    'Exercise': {
      en: 'Exercise',
      es: 'Ejercicio',
      fr: 'Exercice',
      zh: '锻炼'
    },
    'Reading': {
      en: 'Reading',
      es: 'Lectura',
      fr: 'Lecture',
      zh: '阅读'
    },
    'Meditation': {
      en: 'Meditation',
      es: 'Meditación',
      fr: 'Méditation',
      zh: '冥想'
    },
    'Journaling': {
      en: 'Journaling',
      es: 'Diario',
      fr: 'Journal',
      zh: '日记'
    },
    'Learning': {
      en: 'Learning',
      es: 'Aprendizaje',
      fr: 'Apprentissage',
      zh: '学习'
    },
    'Other': {
      en: 'Other',
      es: 'Otro',
      fr: 'Autre',
      zh: '其他'
    },
    'Time Blocking': {
      en: 'Time Blocking',
      es: 'Bloqueo de Tiempo',
      fr: 'Blocage de Temps',
      zh: '时间块'
    },
    'Task Prioritization': {
      en: 'Task Prioritization',
      es: 'Priorización de Tareas',
      fr: 'Priorisation des Tâches',
      zh: '任务优先级'
    },
    'Email Management': {
      en: 'Email Management',
      es: 'Gestión de Correo',
      fr: 'Gestion des Emails',
      zh: '邮件管理'
    },
    'Deep Work': {
      en: 'Deep Work',
      es: 'Trabajo Profundo',
      fr: 'Travail Profond',
      zh: '深度工作'
    },
    'Break Management': {
      en: 'Break Management',
      es: 'Gestión de Descansos',
      fr: 'Gestion des Pauses',
      zh: '休息管理'
    }
  };

  return options.map(option => optionMap[option]?.[language] || optionMap[option]?.['en'] || option);
};

export interface HabitCourse {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  modules: HabitModule[];
  prerequisites: string[];
  tags: string[];
  completionRate: number;
  rating: number;
  enrolledUsers: number;
  isPremium: boolean;
}

export interface HabitModule {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'interactive' | 'quiz' | 'exercise';
  content: string;
  duration: number; // in minutes
  order: number;
  isCompleted: boolean;
  exercises: HabitExercise[];
  resources: HabitResource[];
}

export interface HabitExercise {
  id: string;
  title: string;
  description: string;
  type: 'reflection' | 'practice' | 'planning' | 'tracking';
  instructions: string;
  estimatedTime: number; // in minutes
  isCompleted: boolean;
}

export interface HabitResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'worksheet' | 'template';
  url: string;
  description: string;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedModules: string[];
  currentModule: string;
  progress: number; // 0-100
  lastAccessed: string;
  timeSpent: number; // in minutes
  exercisesCompleted: string[];
  certificates: string[];
}

export interface GuidedSetup {
  id: string;
  title: string;
  description: string;
  steps: SetupStep[];
  estimatedTime: number;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'question' | 'selection' | 'input' | 'confirmation';
  options?: string[];
  validation?: (value: any) => boolean;
  isCompleted: boolean;
  order: number;
}

// NEW: Interfaces for enhanced course features
export interface CoursePreview {
  id: string;
  courseId: string;
  title: string;
  description: string;
  previewContent: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
  prerequisites: string[];
  whatYouWillLearn: string[];
  instructorInfo?: {
    name: string;
    bio: string;
    expertise: string[];
  };
  sampleContent?: {
    type: 'video' | 'text' | 'interactive';
    title: string;
    content: string;
    duration: number;
  };
  reviews?: {
    rating: number;
    comment: string;
    userName: string;
    date: string;
  }[];
}

export interface LearningStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  totalDaysCompleted: number;
  streakStartDate: string;
  weeklyGoal: number;
  weeklyProgress: number;
  achievements: string[];
}

export interface CourseCompletionCelebration {
  courseId: string;
  courseTitle: string;
  xpEarned: number;
  achievements: string[];
  completionDate: string;
  timeSpent: number;
  modulesCompleted: number;
  exercisesCompleted: number;
  shareMessage: string;
}

export interface AIRecommendationData {
  userId: string;
  habits: Array<{
    id: string;
    title: string;
    category: string;
    difficulty: string;
    completionRate: number;
    streak: number;
  }>;
  goals: string[];
  preferences: {
    preferredCategories: string[];
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    preferredDuration: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  completedCourses: string[];
  enrolledCourses: string[];
  learningStreak: number;
  timeAvailability: number; // minutes per day
}

class HabitEducationService {
  private static readonly COURSES_KEY = '@habit_courses';
  private static readonly USER_PROGRESS_KEY = '@user_progress';
  private static readonly GUIDED_SETUPS_KEY = '@guided_setups';
  private static readonly USER_PREFERENCES_KEY = '@user_education_preferences';
  private static readonly LEARNING_STREAKS_KEY = '@learning_streaks';
  private static readonly COURSE_PREVIEWS_KEY = '@course_previews';

  /**
   * Get all available courses
   */
  static async getCourses(language: string = 'en'): Promise<HabitCourse[]> {
    try {
      // Always return fresh courses with current language to ensure translations are applied
      return this.getDefaultCourses(language);
    } catch (error) {
      console.error('Error getting courses:', error);
      return this.getDefaultCourses(language);
    }
  }

  /**
   * Get AI-recommended courses based on user's habits and goals
   */
  static async getAIRecommendedCourses(userId: string, language: string = 'en'): Promise<HabitCourse[]> {
    try {
      const aiData = await this.getAIRecommendationData(userId);
      const allCourses = await this.getCourses(language);
      
      // Calculate relevance scores for each course
      const scoredCourses = allCourses.map(course => ({
        course,
        score: this.calculateAIRelevanceScore(course, aiData)
      }));
      
      // Sort by score and return top recommendations
      return scoredCourses
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(item => item.course);
    } catch (error) {
      console.error('Error getting AI recommended courses:', error);
      return [];
    }
  }

  /**
   * Get interactive course preview
   */
  static async getCoursePreview(courseId: string, language: string = 'en'): Promise<CoursePreview | null> {
    try {
      const data = await AsyncStorage.getItem(this.COURSE_PREVIEWS_KEY);
      if (data) {
        const previews = JSON.parse(data);
        const preview = previews.find((p: CoursePreview) => p.courseId === courseId);
        if (preview) return preview;
      }
      
      // Return default preview if none exists
      return this.getDefaultCoursePreview(courseId, language);
    } catch (error) {
      console.error('Error getting course preview:', error);
      return null;
    }
  }

  /**
   * Get user's learning streak
   */
  static async getLearningStreak(userId: string): Promise<LearningStreak> {
    try {
      const data = await AsyncStorage.getItem(this.LEARNING_STREAKS_KEY);
      if (data) {
        const streaks = JSON.parse(data);
        const userStreak = streaks.find((s: LearningStreak) => s.userId === userId);
        if (userStreak) return userStreak;
      }
      
      // Return default streak if none exists
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        totalDaysCompleted: 0,
        streakStartDate: new Date().toISOString(),
        weeklyGoal: 3,
        weeklyProgress: 0,
        achievements: []
      };
    } catch (error) {
      console.error('Error getting learning streak:', error);
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: '',
        totalDaysCompleted: 0,
        streakStartDate: new Date().toISOString(),
        weeklyGoal: 3,
        weeklyProgress: 0,
        achievements: []
      };
    }
  }

  /**
   * Update learning streak
   */
  static async updateLearningStreak(userId: string): Promise<void> {
    try {
      const currentStreak = await this.getLearningStreak(userId);
      const today = new Date().toISOString().split('T')[0];
      const lastCompleted = currentStreak.lastCompletedDate.split('T')[0];
      
      if (lastCompleted === today) return; // Already completed today
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = currentStreak.currentStreak;
      if (lastCompleted === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      
      const updatedStreak: LearningStreak = {
        ...currentStreak,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, currentStreak.longestStreak),
        lastCompletedDate: new Date().toISOString(),
        totalDaysCompleted: currentStreak.totalDaysCompleted + 1,
        weeklyProgress: currentStreak.weeklyProgress + 1
      };
      
      // Save updated streak
      const data = await AsyncStorage.getItem(this.LEARNING_STREAKS_KEY);
      const streaks = data ? JSON.parse(data) : [];
      const existingIndex = streaks.findIndex((s: LearningStreak) => s.userId === userId);
      
      if (existingIndex >= 0) {
        streaks[existingIndex] = updatedStreak;
      } else {
        streaks.push(updatedStreak);
      }
      
      await AsyncStorage.setItem(this.LEARNING_STREAKS_KEY, JSON.stringify(streaks));
    } catch (error) {
      console.error('Error updating learning streak:', error);
    }
  }

  /**
   * Complete a course and trigger celebration
   */
  static async completeCourse(userId: string, courseId: string): Promise<CourseCompletionCelebration> {
    try {
      const course = await this.getCourse(courseId);
      if (!course) throw new Error('Course not found');
      
      const progress = await this.getUserProgress(userId);
      const userProgress = progress.find(p => p.courseId === courseId);
      if (!userProgress) throw new Error('User not enrolled in course');
      
      // Calculate XP and achievements
      const xpEarned = this.calculateCourseXP(course, userProgress);
      const achievements = this.calculateCourseAchievements(course, userProgress);
      
      // Update progress to 100%
      userProgress.progress = 100;
      userProgress.completedModules = course.modules.map(m => m.id);
      await this.updateUserProgress(userId, courseId, userProgress);
      
      // Update learning streak
      await this.updateLearningStreak(userId);
      
      // Generate celebration data
      const celebration: CourseCompletionCelebration = {
        courseId,
        courseTitle: course.title,
        xpEarned,
        achievements,
        completionDate: new Date().toISOString(),
        timeSpent: userProgress.timeSpent,
        modulesCompleted: course.modules.length,
        exercisesCompleted: userProgress.exercisesCompleted.length,
        shareMessage: this.generateShareMessage(course, userProgress)
      };
      
      return celebration;
    } catch (error) {
      console.error('Error completing course:', error);
      throw error;
    }
  }

  /**
   * Get AI recommendation data for a user
   */
  static async getAIRecommendationData(userId: string): Promise<AIRecommendationData> {
    try {
      // This would typically fetch from a real AI service
      // For now, return mock data based on user preferences
      const preferences = await this.getUserPreferences(userId);
      const progress = await this.getUserProgress(userId);
      const learningStreak = await this.getLearningStreak(userId);
      
      return {
        userId,
        habits: [], // Would be populated from HabitContext
        goals: preferences?.goals || [],
        preferences: {
          preferredCategories: preferences?.preferredCategories || ['productivity', 'wellness'],
          preferredDifficulty: preferences?.preferredDifficulty || 'beginner',
          preferredDuration: preferences?.preferredDuration || 30,
          learningStyle: preferences?.learningStyle || 'visual'
        },
        completedCourses: progress.filter(p => p.progress === 100).map(p => p.courseId),
        enrolledCourses: progress.map(p => p.courseId),
        learningStreak: learningStreak.currentStreak,
        timeAvailability: preferences?.timeAvailability || 60
      };
    } catch (error) {
      console.error('Error getting AI recommendation data:', error);
      return {
        userId,
        habits: [],
        goals: [],
        preferences: {
          preferredCategories: ['productivity', 'wellness'],
          preferredDifficulty: 'beginner',
          preferredDuration: 30,
          learningStyle: 'visual'
        },
        completedCourses: [],
        enrolledCourses: [],
        learningStreak: 0,
        timeAvailability: 60
      };
    }
  }

  /**
   * Calculate AI relevance score for a course
   */
  private static calculateAIRelevanceScore(course: HabitCourse, aiData: AIRecommendationData): number {
    let score = 0;
    
    // Category preference match
    if (aiData.preferences.preferredCategories.some(cat => course.tags.includes(cat))) {
      score += 30;
    }
    
    // Difficulty preference match
    if (course.difficulty === aiData.preferences.preferredDifficulty) {
      score += 25;
    }
    
    // Duration preference match
    const durationDiff = Math.abs(course.duration - aiData.preferences.preferredDuration);
    if (durationDiff <= 15) {
      score += 20;
    } else if (durationDiff <= 30) {
      score += 10;
    }
    
    // Learning streak bonus
    if (aiData.learningStreak > 0) {
      score += Math.min(aiData.learningStreak * 2, 15);
    }
    
    // Course rating bonus
    score += course.rating * 2;
    
    // Completion rate bonus
    score += course.completionRate * 0.5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate XP earned for course completion
   */
  private static calculateCourseXP(course: HabitCourse, progress: UserProgress): number {
    let xp = course.duration * 2; // Base XP from duration
    xp += progress.exercisesCompleted.length * 10; // XP from exercises
    xp += course.modules.length * 5; // XP from modules
    xp += Math.floor(progress.timeSpent / 10); // XP from time spent
    
    // Bonus for completion rate
    if (progress.progress === 100) {
      xp += 50;
    }
    
    return xp;
  }

  /**
   * Calculate achievements for course completion
   */
  private static calculateCourseAchievements(course: HabitCourse, progress: UserProgress): string[] {
    const achievements: string[] = [];
    
    if (progress.progress === 100) {
      achievements.push('course_completion');
    }
    
    if (progress.exercisesCompleted.length >= course.modules.length) {
      achievements.push('exercise_master');
    }
    
    if (progress.timeSpent >= course.duration) {
      achievements.push('dedicated_learner');
    }
    
    if (course.difficulty === 'advanced' && progress.progress === 100) {
      achievements.push('advanced_achiever');
    }
    
    return achievements;
  }

  /**
   * Generate share message for course completion
   */
  private static generateShareMessage(course: HabitCourse, progress: UserProgress): string {
    return `I just completed "${course.title}" and earned ${this.calculateCourseXP(course, progress)} XP! 🎉`;
  }

  /**
   * Get default course preview
   */
  private static getDefaultCoursePreview(courseId: string, language: string = 'en'): CoursePreview | null {
    // Get the course data to use for the preview
    const course = this.getDefaultCourses(language).find(c => c.id === courseId);
    if (!course) return null;

    // Create a preview based on the course data
    const preview: CoursePreview = {
      id: `preview-${courseId}`,
      courseId: courseId,
      title: course.title,
      description: course.description,
      previewContent: getTranslatedPreviewContent(courseId, language),
      estimatedDuration: course.duration,
      difficulty: course.difficulty,
      learningObjectives: getTranslatedLearningObjectives(courseId, language),
      prerequisites: course.prerequisites.length > 0 ? course.prerequisites : ['None'],
      whatYouWillLearn: getTranslatedWhatYouWillLearn(courseId, language),
      instructorInfo: getTranslatedInstructorInfo(courseId, language),
      sampleContent: getTranslatedSampleContent(courseId, language),
      reviews: getTranslatedReviews(courseId, language)
    };
    
    return preview;
  }

  /**
   * Get course by ID
   */
  static async getCourse(courseId: string, language: string = 'en'): Promise<HabitCourse | null> {
    try {
      const courses = await this.getCourses(language);
      return courses.find(course => course.id === courseId) || null;
    } catch (error) {
      console.error('Error getting course:', error);
      return null;
    }
  }

  /**
   * Enroll user in a course
   */
  static async enrollUser(userId: string, courseId: string): Promise<void> {
    try {
      const progress: UserProgress = {
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        completedModules: [],
        currentModule: '',
        progress: 0,
        lastAccessed: new Date().toISOString(),
        timeSpent: 0,
        exercisesCompleted: [],
        certificates: [],
      };

      const existingProgress = await this.getUserProgress(userId);
      existingProgress.push(progress);
      
      // Get all progress data and update it
      const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
      const allProgress = data ? JSON.parse(data) : [];
      
      // Remove existing progress for this user and course if it exists
      const filteredProgress = allProgress.filter((p: UserProgress) => 
        !(p.userId === userId && p.courseId === courseId)
      );
      
      // Add the new progress
      filteredProgress.push(progress);
      
      await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(filteredProgress));
    } catch (error) {
      console.error('Error enrolling user:', error);
    }
  }

  /**
   * Get user progress for all courses
   */
  static async getUserProgress(userId: string): Promise<UserProgress[]> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
      if (data) {
        const allProgress = JSON.parse(data);
        return allProgress.filter((progress: UserProgress) => progress.userId === userId);
      }
      return [];
    } catch (error) {
      console.error('Error getting user progress:', error);
      return [];
    }
  }

  /**
   * Update user progress for a specific course
   */
  static async updateUserProgress(userId: string, courseId: string, progress: UserProgress): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
      const allProgress = data ? JSON.parse(data) : [];
      
      const existingIndex = allProgress.findIndex((p: UserProgress) => 
        p.userId === userId && p.courseId === courseId
      );
      
      if (existingIndex >= 0) {
        allProgress[existingIndex] = progress;
      } else {
        allProgress.push(progress);
      }
      
      await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  /**
   * Update module completion
   */
  static async completeModule(userId: string, courseId: string, moduleId: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      const courseProgress = progress.find(p => p.courseId === courseId);
      
      if (courseProgress) {
        if (!courseProgress.completedModules.includes(moduleId)) {
          courseProgress.completedModules.push(moduleId);
          courseProgress.lastAccessed = new Date().toISOString();
          
          // Calculate progress percentage
          const course = await this.getCourse(courseId);
          if (course) {
            courseProgress.progress = Math.round(
              (courseProgress.completedModules.length / course.modules.length) * 100
            );
          }
          
          // Update the progress in the main storage
          const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
          const allProgress = data ? JSON.parse(data) : [];
          
          const existingIndex = allProgress.findIndex((p: UserProgress) => 
            p.userId === userId && p.courseId === courseId
          );
          
          if (existingIndex >= 0) {
            allProgress[existingIndex] = courseProgress;
          } else {
            allProgress.push(courseProgress);
          }
          
          await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(allProgress));
        }
      }
    } catch (error) {
      console.error('Error completing module:', error);
    }
  }

  /**
   * Complete an exercise
   */
  static async completeExercise(userId: string, courseId: string, exerciseId: string): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId);
      const courseProgress = progress.find(p => p.courseId === courseId);
      
      if (courseProgress && !courseProgress.exercisesCompleted.includes(exerciseId)) {
        courseProgress.exercisesCompleted.push(exerciseId);
        courseProgress.lastAccessed = new Date().toISOString();
        
        // Update the progress in the main storage
        const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
        const allProgress = data ? JSON.parse(data) : [];
        
        const existingIndex = allProgress.findIndex((p: UserProgress) => 
          p.userId === userId && p.courseId === courseId
        );
        
        if (existingIndex >= 0) {
          allProgress[existingIndex] = courseProgress;
        } else {
          allProgress.push(courseProgress);
        }
        
        await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(allProgress));
      }
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  }

  /**
   * Get guided setups
   */
  static async getGuidedSetups(language: string = 'en'): Promise<GuidedSetup[]> {
    try {
      const data = await AsyncStorage.getItem(this.GUIDED_SETUPS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      
      return this.getDefaultGuidedSetups(language);
    } catch (error) {
      console.error('Error getting guided setups:', error);
      return this.getDefaultGuidedSetups(language);
    }
  }

  /**
   * Get guided setup by ID
   */
  static async getGuidedSetup(setupId: string, language: string = 'en'): Promise<GuidedSetup | null> {
    try {
      const setups = await this.getGuidedSetups(language);
      return setups.find(setup => setup.id === setupId) || null;
    } catch (error) {
      console.error('Error getting guided setup:', error);
      return null;
    }
  }

  /**
   * Get recommended courses based on user preferences
   */
  static async getRecommendedCourses(userId: string, language: string = 'en'): Promise<HabitCourse[]> {
    try {
      const courses = await this.getCourses(language);
      const userProgress = await this.getUserProgress(userId);
      const preferences = await this.getUserPreferences(userId);
      
      // Filter out completed courses
      const completedCourseIds = userProgress.map(p => p.courseId);
      const availableCourses = courses.filter(course => 
        !completedCourseIds.includes(course.id)
      );
      
      // Sort by relevance to user preferences
      return availableCourses.sort((a, b) => {
        const aScore = this.calculateRelevanceScore(a, preferences);
        const bScore = this.calculateRelevanceScore(b, preferences);
        return bScore - aScore;
      });
    } catch (error) {
      console.error('Error getting recommended courses:', error);
      return [];
    }
  }

  /**
   * Get user education preferences
   */
  static async getUserPreferences(userId: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(`${this.USER_PREFERENCES_KEY}_${userId}`);
      return data ? JSON.parse(data) : {
        preferredDifficulty: 'beginner',
        preferredCategories: [],
        preferredDuration: 30,
        learningStyle: 'visual',
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        preferredDifficulty: 'beginner',
        preferredCategories: [],
        preferredDuration: 30,
        learningStyle: 'visual',
      };
    }
  }

  /**
   * Update user education preferences
   */
  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.USER_PREFERENCES_KEY}_${userId}`,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Calculate relevance score for course recommendations
   */
  private static calculateRelevanceScore(course: HabitCourse, preferences: any): number {
    let score = 0;
    
    // Difficulty match
    if (course.difficulty === preferences.preferredDifficulty) {
      score += 3;
    }
    
    // Category match
    const categoryMatch = course.tags.some(tag => 
      preferences.preferredCategories.includes(tag)
    );
    if (categoryMatch) {
      score += 2;
    }
    
    // Duration preference
    if (course.duration <= preferences.preferredDuration) {
      score += 1;
    }
    
    // Popularity bonus
    score += Math.min(course.enrolledUsers / 100, 2);
    
    return score;
  }

  /**
   * Get default courses
   */
  private static getDefaultCourses(language: string = 'en'): HabitCourse[] {
    return [
      {
        id: 'habit-foundations',
        title: getTranslatedCourseContent('habit-foundations', language).title,
        description: getTranslatedCourseContent('habit-foundations', language).description,
        difficulty: 'beginner',
        duration: 45,
        modules: [
          {
            id: 'what-are-habits',
            title: 'What Are Habits?',
            description: 'Understanding the psychology behind habit formation',
            type: 'video',
            content: 'habit-formation-intro',
            duration: 10,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'habit-audit',
                title: 'Habit Audit',
                description: 'Identify your current habits and their impact',
                type: 'reflection',
                instructions: 'Take 10 minutes to list your current habits and rate their impact on your life.',
                estimatedTime: 10,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'habit-worksheet',
                title: 'Habit Audit Worksheet',
                type: 'worksheet',
                url: 'habit-audit-worksheet.pdf',
                description: 'Printable worksheet to help you audit your current habits',
              }
            ],
          },
          {
            id: 'habit-loop',
            title: 'The Habit Loop',
            description: 'Understanding cue, craving, response, and reward',
            type: 'interactive',
            content: 'habit-loop-explanation',
            duration: 15,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'identify-loops',
                title: 'Identify Your Habit Loops',
                description: 'Analyze your habits using the habit loop framework',
                type: 'practice',
                instructions: 'Choose one habit and break it down into cue, craving, response, and reward.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'building-habits',
            title: 'Building New Habits',
            description: 'Practical strategies for creating lasting habits',
            type: 'text',
            content: 'habit-building-strategies',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'habit-plan',
                title: 'Create Your Habit Plan',
                description: 'Design a plan for your first new habit',
                type: 'planning',
                instructions: 'Use the strategies learned to create a detailed plan for one new habit.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'habit-plan-template',
                title: 'Habit Planning Template',
                type: 'template',
                url: 'habit-plan-template.pdf',
                description: 'Template to help you plan your new habits',
              }
            ],
          }
        ],
        prerequisites: [],
        tags: ['foundations', 'psychology', 'science'],
        completionRate: 85,
        rating: 4.8,
        enrolledUsers: 1250,
        isPremium: false,
      },
      {
        id: 'morning-routines',
        title: getTranslatedCourseContent('morning-routines', language).title,
        description: getTranslatedCourseContent('morning-routines', language).description,
        difficulty: 'intermediate',
        duration: 60,
        modules: [
          {
            id: 'morning-science',
            title: 'The Science of Mornings',
            description: 'Why morning routines are so powerful',
            type: 'video',
            content: 'morning-routine-science',
            duration: 12,
            order: 1,
            isCompleted: false,
            exercises: [],
            resources: [],
          },
          {
            id: 'design-routine',
            title: 'Designing Your Routine',
            description: 'Step-by-step guide to creating your perfect morning routine',
            type: 'interactive',
            content: 'routine-design-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [],
            resources: [],
          },
          {
            id: 'implementation',
            title: 'Implementation Strategies',
            description: 'How to stick to your morning routine',
            type: 'text',
            content: 'implementation-strategies',
            duration: 23,
            order: 3,
            isCompleted: false,
            exercises: [],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['morning', 'routine', 'productivity'],
        completionRate: 78,
        rating: 4.6,
        enrolledUsers: 890,
        isPremium: false, // Temporarily changed to false for testing
      },
      {
        id: 'creative-thinking-habits',
        title: getTranslatedCourseContent('creative-thinking-habits', language).title,
        description: getTranslatedCourseContent('creative-thinking-habits', language).description,
        difficulty: 'intermediate',
        duration: 60,
        modules: [
          {
            id: 'creativity-basics',
            title: 'Creative Thinking Fundamentals',
            description: 'Understanding the basics of creative thinking',
            type: 'video',
            content: 'creativity-basics-intro',
            duration: 20,
            order: 1,
            isCompleted: false,
            exercises: [],
            resources: []
          },
          {
            id: 'creative-techniques',
            title: 'Creative Techniques',
            description: 'Learn practical techniques to boost creativity',
            type: 'interactive',
            content: 'creative-techniques-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [],
            resources: []
          },
          {
            id: 'creative-routines',
            title: 'Creative Routines',
            description: 'Build daily routines that enhance creativity',
            type: 'text',
            content: 'creative-routines-guide',
            duration: 15,
            order: 3,
            isCompleted: false,
            exercises: [],
            resources: []
          }
        ],
        prerequisites: [],
        tags: ['creativity', 'thinking', 'innovation'],
        completionRate: 78,
        rating: 4.2,
        enrolledUsers: 890,
        isPremium: false,
      },
      {
        id: 'fitness-habits',
        title: getTranslatedCourseContent('fitness-habits', language).title,
        description: getTranslatedCourseContent('fitness-habits', language).description,
        difficulty: 'intermediate',
        duration: 75,
        modules: [
          {
            id: 'fitness-psychology',
            title: 'The Psychology of Fitness',
            description: 'Understanding motivation and consistency in fitness',
            type: 'video',
            content: 'fitness-psychology-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'fitness-goals',
                title: 'Set Your Fitness Goals',
                description: 'Define clear, achievable fitness objectives',
                type: 'planning',
                instructions: 'Create SMART fitness goals that align with your lifestyle and preferences.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'fitness-goals-template',
                title: 'Fitness Goals Template',
                type: 'template',
                url: 'fitness-goals-template.pdf',
                description: 'Template for setting and tracking fitness goals',
              }
            ],
          },
          {
            id: 'workout-planning',
            title: 'Workout Planning & Scheduling',
            description: 'Create a sustainable workout routine that fits your life',
            type: 'interactive',
            content: 'workout-planning-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'create-workout-plan',
                title: 'Design Your Workout Plan',
                description: 'Build a personalized workout schedule',
                type: 'practice',
                instructions: 'Create a weekly workout plan that includes variety and progression.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'nutrition-habits',
            title: 'Nutrition Habits for Fitness',
            description: 'Building healthy eating habits that support your fitness goals',
            type: 'text',
            content: 'nutrition-habits-guide',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'meal-planning',
                title: 'Meal Planning Basics',
                description: 'Learn to plan and prepare healthy meals',
                type: 'planning',
                instructions: 'Create a weekly meal plan that supports your fitness goals.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'meal-planning-guide',
                title: 'Meal Planning Guide',
                type: 'article',
                url: 'meal-planning-guide.pdf',
                description: 'Comprehensive guide to meal planning and preparation',
              }
            ],
          },
          {
            id: 'recovery-habits',
            title: 'Recovery & Rest Habits',
            description: 'Essential recovery practices for sustainable fitness',
            type: 'quiz',
            content: 'recovery-habits-quiz',
            duration: 15,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'recovery-assessment',
                title: 'Recovery Assessment',
                description: 'Evaluate your current recovery practices',
                type: 'reflection',
                instructions: 'Assess your current recovery habits and identify areas for improvement.',
                estimatedTime: 10,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['fitness', 'health', 'exercise', 'nutrition'],
        completionRate: 72,
        rating: 4.7,
        enrolledUsers: 1560,
        isPremium: true,
      },
      {
        id: 'productivity-mastery',
        title: getTranslatedCourseContent('productivity-mastery', language).title,
        description: getTranslatedCourseContent('productivity-mastery', language).description,
        difficulty: 'advanced',
        duration: 90,
        modules: [
          {
            id: 'productivity-principles',
            title: 'Core Productivity Principles',
            description: 'Understanding the fundamental principles of productivity',
            type: 'video',
            content: 'productivity-principles-intro',
            duration: 18,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'productivity-audit',
                title: 'Productivity Audit',
                description: 'Assess your current productivity systems',
                type: 'reflection',
                instructions: 'Evaluate your current productivity practices and identify bottlenecks.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'productivity-audit-worksheet',
                title: 'Productivity Audit Worksheet',
                type: 'worksheet',
                url: 'productivity-audit-worksheet.pdf',
                description: 'Comprehensive worksheet for auditing your productivity systems',
              }
            ],
          },
          {
            id: 'time-management',
            title: 'Advanced Time Management',
            description: 'Master time blocking, prioritization, and scheduling',
            type: 'interactive',
            content: 'time-management-systems',
            duration: 30,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'time-blocking-practice',
                title: 'Time Blocking Practice',
                description: 'Practice time blocking with real scenarios',
                type: 'practice',
                instructions: 'Apply time blocking techniques to your daily schedule.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'focus-habits',
            title: 'Building Focus Habits',
            description: 'Develop deep work and concentration habits',
            type: 'text',
            content: 'focus-habits-guide',
            duration: 25,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'focus-challenge',
                title: '30-Day Focus Challenge',
                description: 'Complete a 30-day focus building challenge',
                type: 'tracking',
                instructions: 'Follow a structured 30-day program to build focus habits.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'focus-challenge-tracker',
                title: 'Focus Challenge Tracker',
                type: 'template',
                url: 'focus-challenge-tracker.pdf',
                description: 'Daily tracker for the 30-day focus challenge',
              }
            ],
          },
          {
            id: 'productivity-systems',
            title: 'Productivity Systems Integration',
            description: 'Integrate multiple productivity systems for maximum effectiveness',
            type: 'exercise',
            content: 'productivity-systems-integration',
            duration: 17,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'system-integration',
                title: 'System Integration Plan',
                description: 'Create a plan to integrate multiple productivity systems',
                type: 'planning',
                instructions: 'Design a comprehensive productivity system that combines multiple approaches.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations', 'morning-routines'],
        tags: ['productivity', 'time-management', 'focus', 'systems'],
        completionRate: 68,
        rating: 4.9,
        enrolledUsers: 2340,
        isPremium: true,
      },
      {
        id: 'mindfulness-meditation',
        title: getTranslatedCourseContent('mindfulness-meditation', language).title,
        description: getTranslatedCourseContent('mindfulness-meditation', language).description,
        difficulty: 'beginner',
        duration: 50,
        modules: [
          {
            id: 'mindfulness-basics',
            title: 'Mindfulness Fundamentals',
            description: 'Understanding mindfulness and its benefits',
            type: 'video',
            content: 'mindfulness-basics-intro',
            duration: 12,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'mindfulness-awareness',
                title: 'Mindfulness Awareness Exercise',
                description: 'Practice basic mindfulness awareness',
                type: 'practice',
                instructions: 'Complete a 5-minute mindfulness awareness exercise.',
                estimatedTime: 5,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'mindfulness-guide',
                title: 'Mindfulness Practice Guide',
                type: 'article',
                url: 'mindfulness-guide.pdf',
                description: 'Comprehensive guide to mindfulness practices',
              }
            ],
          },
          {
            id: 'meditation-techniques',
            title: 'Meditation Techniques',
            description: 'Learn various meditation techniques and practices',
            type: 'interactive',
            content: 'meditation-techniques-guide',
            duration: 20,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'meditation-practice',
                title: 'Daily Meditation Practice',
                description: 'Establish a daily meditation practice',
                type: 'tracking',
                instructions: 'Practice meditation daily for 10 minutes and track your progress.',
                estimatedTime: 10,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'stress-management',
            title: 'Stress Management Through Mindfulness',
            description: 'Use mindfulness techniques for stress management',
            type: 'text',
            content: 'stress-management-mindfulness',
            duration: 18,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'stress-response',
                title: 'Stress Response Assessment',
                description: 'Assess and improve your stress response',
                type: 'reflection',
                instructions: 'Identify your stress triggers and practice mindful responses.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'stress-management-tools',
                title: 'Stress Management Tools',
                type: 'worksheet',
                url: 'stress-management-tools.pdf',
                description: 'Collection of stress management tools and techniques',
              }
            ],
          }
        ],
        prerequisites: [],
        tags: ['mindfulness', 'meditation', 'mental-health', 'stress-management'],
        completionRate: 82,
        rating: 4.5,
        enrolledUsers: 1890,
        isPremium: false,
      },
      {
        id: 'learning-habits',
        title: getTranslatedCourseContent('learning-habits', language).title,
        description: getTranslatedCourseContent('learning-habits', language).description,
        difficulty: 'intermediate',
        duration: 65,
        modules: [
          {
            id: 'learning-science',
            title: 'The Science of Learning',
            description: 'Understanding how we learn and retain information',
            type: 'video',
            content: 'learning-science-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'learning-style-assessment',
                title: 'Learning Style Assessment',
                description: 'Identify your preferred learning style',
                type: 'reflection',
                instructions: 'Complete a learning style assessment to understand your preferences.',
                estimatedTime: 10,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'learning-style-guide',
                title: 'Learning Style Guide',
                type: 'article',
                url: 'learning-style-guide.pdf',
                description: 'Guide to understanding and leveraging your learning style',
              }
            ],
          },
          {
            id: 'study-techniques',
            title: 'Effective Study Techniques',
            description: 'Master proven study techniques and methods',
            type: 'interactive',
            content: 'study-techniques-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'study-plan-creation',
                title: 'Create Your Study Plan',
                description: 'Design an effective study plan',
                type: 'planning',
                instructions: 'Create a comprehensive study plan using the techniques learned.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'memory-techniques',
            title: 'Memory & Retention Techniques',
            description: 'Learn techniques to improve memory and retention',
            type: 'text',
            content: 'memory-techniques-guide',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'memory-practice',
                title: 'Memory Practice Exercises',
                description: 'Practice memory techniques with real examples',
                type: 'practice',
                instructions: 'Complete memory practice exercises using the techniques learned.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'memory-techniques-reference',
                title: 'Memory Techniques Reference',
                type: 'worksheet',
                url: 'memory-techniques-reference.pdf',
                description: 'Quick reference guide for memory techniques',
              }
            ],
          },
          {
            id: 'continuous-learning',
            title: 'Building Continuous Learning Habits',
            description: 'Develop habits for lifelong learning and skill development',
            type: 'exercise',
            content: 'continuous-learning-habits',
            duration: 5,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'learning-goals',
                title: 'Set Learning Goals',
                description: 'Define your learning objectives and goals',
                type: 'planning',
                instructions: 'Set specific learning goals and create a plan to achieve them.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['learning', 'study', 'education', 'memory', 'skills'],
        completionRate: 75,
        rating: 4.6,
        enrolledUsers: 1120,
        isPremium: true,
      },
      {
        id: 'financial-habits',
        title: getTranslatedCourseContent('financial-habits-money-management', language).title,
        description: getTranslatedCourseContent('financial-habits-money-management', language).description,
        difficulty: 'intermediate',
        duration: 70,
        modules: [
          {
            id: 'financial-mindset',
            title: 'Financial Mindset & Psychology',
            description: 'Understanding the psychology of money and financial behavior',
            type: 'video',
            content: 'financial-mindset-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'money-mindset-assessment',
                title: 'Money Mindset Assessment',
                description: 'Assess your current money mindset and beliefs',
                type: 'reflection',
                instructions: 'Reflect on your current money mindset and identify limiting beliefs.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'money-mindset-worksheet',
                title: 'Money Mindset Worksheet',
                type: 'worksheet',
                url: 'money-mindset-worksheet.pdf',
                description: 'Worksheet for assessing and improving your money mindset',
              }
            ],
          },
          {
            id: 'budgeting-basics',
            title: 'Budgeting & Financial Planning',
            description: 'Learn effective budgeting and financial planning techniques',
            type: 'interactive',
            content: 'budgeting-basics-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'create-budget',
                title: 'Create Your Budget',
                description: 'Design a comprehensive budget plan',
                type: 'planning',
                instructions: 'Create a detailed budget that aligns with your financial goals.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'saving-investing',
            title: 'Saving & Investing Habits',
            description: 'Develop habits for saving and investing money',
            type: 'text',
            content: 'saving-investing-guide',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'savings-plan',
                title: 'Create Savings Plan',
                description: 'Design a personalized savings and investment plan',
                type: 'planning',
                instructions: 'Create a savings and investment plan based on your goals.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'savings-investment-guide',
                title: 'Savings & Investment Guide',
                type: 'article',
                url: 'savings-investment-guide.pdf',
                description: 'Comprehensive guide to saving and investing strategies',
              }
            ],
          },
          {
            id: 'debt-management',
            title: 'Debt Management & Elimination',
            description: 'Strategies for managing and eliminating debt',
            type: 'quiz',
            content: 'debt-management-quiz',
            duration: 10,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'debt-assessment',
                title: 'Debt Assessment & Plan',
                description: 'Assess your current debt and create an elimination plan',
                type: 'tracking',
                instructions: 'Assess your current debt situation and create a plan for elimination.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['finance', 'money', 'budgeting', 'investing', 'debt'],
        completionRate: 71,
        rating: 4.4,
        enrolledUsers: 980,
        isPremium: true,
      },
      {
        id: 'sleep-habits',
        title: getTranslatedCourseContent('sleep-habits', language).title,
        description: getTranslatedCourseContent('sleep-habits', language).description,
        difficulty: 'beginner',
        duration: 55,
        modules: [
          {
            id: 'sleep-science',
            title: getTranslatedModuleContent('sleep-science', language).title,
            description: getTranslatedModuleContent('sleep-science', language).description,
            type: 'video',
            content: 'sleep-science-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'sleep-assessment',
                title: 'Sleep Quality Assessment',
                description: 'Assess your current sleep patterns and quality',
                type: 'reflection',
                instructions: 'Track your sleep patterns for one week and assess your sleep quality.',
                estimatedTime: 10,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'sleep-tracker',
                title: 'Sleep Tracking Template',
                type: 'template',
                url: 'sleep-tracker.pdf',
                description: 'Daily sleep tracking template for monitoring sleep patterns',
              }
            ],
          },
          {
            id: 'sleep-hygiene',
            title: getTranslatedModuleContent('sleep-hygiene', language).title,
            description: getTranslatedModuleContent('sleep-hygiene', language).description,
            type: 'interactive',
            content: 'sleep-hygiene-guide',
            duration: 20,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'bedtime-routine',
                title: 'Create Your Bedtime Routine',
                description: 'Design a personalized bedtime routine',
                type: 'planning',
                instructions: 'Create a relaxing bedtime routine that prepares your body for sleep.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'sleep-environment',
            title: getTranslatedModuleContent('sleep-environment', language).title,
            description: getTranslatedModuleContent('sleep-environment', language).description,
            type: 'text',
            content: 'sleep-environment-guide',
            duration: 15,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'environment-audit',
                title: 'Sleep Environment Audit',
                description: 'Evaluate and optimize your sleep environment',
                type: 'practice',
                instructions: 'Assess your current sleep environment and make necessary improvements.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'sleep-environment-checklist',
                title: 'Sleep Environment Checklist',
                type: 'worksheet',
                url: 'sleep-environment-checklist.pdf',
                description: 'Comprehensive checklist for optimizing your sleep environment',
              }
            ],
          },
          {
            id: 'sleep-disorders',
            title: getTranslatedModuleContent('sleep-disorders', language).title,
            description: getTranslatedModuleContent('sleep-disorders', language).description,
            type: 'quiz',
            content: 'sleep-disorders-quiz',
            duration: 5,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'sleep-challenge-plan',
                title: 'Sleep Challenge Action Plan',
                description: 'Create a plan to address your specific sleep challenges',
                type: 'planning',
                instructions: 'Identify your sleep challenges and create a personalized action plan.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: [],
        tags: ['sleep', 'health', 'wellness', 'recovery'],
        completionRate: 79,
        rating: 4.3,
        enrolledUsers: 1340,
        isPremium: false,
      },
      {
        id: 'communication-habits',
        title: getTranslatedCourseContent('effective-communication-habits', language).title,
        description: getTranslatedCourseContent('effective-communication-habits', language).description,
        difficulty: 'intermediate',
        duration: 80,
        modules: [
          {
            id: 'communication-fundamentals',
            title: 'Communication Fundamentals',
            description: 'Understanding the basics of effective communication',
            type: 'video',
            content: 'communication-fundamentals-intro',
            duration: 18,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'communication-style-assessment',
                title: 'Communication Style Assessment',
                description: 'Identify your communication style and preferences',
                type: 'reflection',
                instructions: 'Complete a communication style assessment to understand your strengths and areas for improvement.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'communication-style-guide',
                title: 'Communication Style Guide',
                type: 'article',
                url: 'communication-style-guide.pdf',
                description: 'Comprehensive guide to different communication styles',
              }
            ],
          },
          {
            id: 'active-listening',
            title: 'Active Listening Skills',
            description: 'Master the art of active listening for better understanding',
            type: 'interactive',
            content: 'active-listening-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'listening-practice',
                title: 'Active Listening Practice',
                description: 'Practice active listening techniques in real scenarios',
                type: 'practice',
                instructions: 'Practice active listening techniques with a partner or in group settings.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'assertive-communication',
            title: 'Assertive Communication',
            description: 'Learn to communicate assertively and confidently',
            type: 'text',
            content: 'assertive-communication-guide',
            duration: 22,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'assertiveness-practice',
                title: 'Assertiveness Practice',
                description: 'Practice assertive communication in various situations',
                type: 'practice',
                instructions: 'Practice assertive communication techniques in different scenarios.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'assertiveness-techniques',
                title: 'Assertiveness Techniques Reference',
                type: 'worksheet',
                url: 'assertiveness-techniques.pdf',
                description: 'Quick reference guide for assertive communication techniques',
              }
            ],
          },
          {
            id: 'conflict-resolution',
            title: 'Conflict Resolution Skills',
            description: 'Develop skills for resolving conflicts effectively',
            type: 'exercise',
            content: 'conflict-resolution-skills',
            duration: 15,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'conflict-scenarios',
                title: 'Conflict Resolution Scenarios',
                description: 'Practice resolving conflicts in various scenarios',
                type: 'practice',
                instructions: 'Work through different conflict scenarios using the techniques learned.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['communication', 'leadership', 'relationships', 'professional'],
        completionRate: 73,
        rating: 4.5,
        enrolledUsers: 1670,
        isPremium: true,
      },
      {
        id: 'creativity-habits',
        title: 'Creative Thinking Habits',
        description: 'Unlock your creative potential through systematic habit formation.',
        difficulty: 'intermediate',
        duration: 60,
        modules: [
          {
            id: 'creativity-basics',
            title: 'Understanding Creativity',
            description: 'The science and psychology of creative thinking',
            type: 'video',
            content: 'creativity-basics-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'creativity-assessment',
                title: 'Creativity Assessment',
                description: 'Assess your current creative thinking patterns',
                type: 'reflection',
                instructions: 'Evaluate your current creative thinking habits and identify areas for growth.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'creativity-assessment-tool',
                title: 'Creativity Assessment Tool',
                type: 'worksheet',
                url: 'creativity-assessment-tool.pdf',
                description: 'Comprehensive tool for assessing creative thinking patterns',
              }
            ],
          },
          {
            id: 'creative-techniques',
            title: 'Creative Thinking Techniques',
            description: 'Learn proven techniques for enhancing creativity',
            type: 'interactive',
            content: 'creative-techniques-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'technique-practice',
                title: 'Creative Technique Practice',
                description: 'Practice various creative thinking techniques',
                type: 'practice',
                instructions: 'Practice different creative thinking techniques with real problems.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'creative-routines',
            title: 'Building Creative Routines',
            description: 'Develop daily routines that foster creativity',
            type: 'text',
            content: 'creative-routines-guide',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'creative-routine-design',
                title: 'Design Your Creative Routine',
                description: 'Create a personalized creative routine',
                type: 'planning',
                instructions: 'Design a daily routine that supports and enhances your creativity.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'creative-routine-template',
                title: 'Creative Routine Template',
                type: 'template',
                url: 'creative-routine-template.pdf',
                description: 'Template for designing and tracking creative routines',
              }
            ],
          }
        ],
        prerequisites: ['habit-foundations'],
        tags: ['creativity', 'innovation', 'problem-solving', 'art'],
        completionRate: 68,
        rating: 4.2,
        enrolledUsers: 890,
        isPremium: true,
      },
      {
        id: 'leadership-habits',
        title: getTranslatedCourseContent('leadership-development-habits', language).title,
        description: getTranslatedCourseContent('leadership-development-habits', language).description,
        difficulty: 'advanced',
        duration: 85,
        modules: [
          {
            id: 'leadership-principles',
            title: 'Core Leadership Principles',
            description: 'Understanding the fundamental principles of effective leadership',
            type: 'video',
            content: 'leadership-principles-intro',
            duration: 20,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'leadership-assessment',
                title: 'Leadership Assessment',
                description: 'Assess your current leadership skills and style',
                type: 'reflection',
                instructions: 'Complete a comprehensive leadership assessment to understand your strengths and areas for development.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'leadership-assessment-tool',
                title: 'Leadership Assessment Tool',
                type: 'worksheet',
                url: 'leadership-assessment-tool.pdf',
                description: 'Comprehensive leadership assessment and development tool',
              }
            ],
          },
          {
            id: 'emotional-intelligence',
            title: 'Emotional Intelligence in Leadership',
            description: 'Develop emotional intelligence for better leadership',
            type: 'interactive',
            content: 'emotional-intelligence-leadership',
            duration: 30,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'ei-practice',
                title: 'Emotional Intelligence Practice',
                description: 'Practice emotional intelligence skills in leadership scenarios',
                type: 'practice',
                instructions: 'Practice emotional intelligence techniques in various leadership situations.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'team-building',
            title: 'Team Building & Management',
            description: 'Learn effective team building and management strategies',
            type: 'text',
            content: 'team-building-guide',
            duration: 25,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'team-building-plan',
                title: 'Team Building Plan',
                description: 'Create a comprehensive team building strategy',
                type: 'planning',
                instructions: 'Design a team building strategy for your current or future team.',
                estimatedTime: 30,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'team-building-activities',
                title: 'Team Building Activities Guide',
                type: 'article',
                url: 'team-building-activities.pdf',
                description: 'Collection of effective team building activities and exercises',
              }
            ],
          },
          {
            id: 'leadership-communication',
            title: 'Leadership Communication',
            description: 'Master communication skills for effective leadership',
            type: 'exercise',
            content: 'leadership-communication-skills',
            duration: 10,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'leadership-speech',
                title: 'Leadership Speech Practice',
                description: 'Practice delivering effective leadership communications',
                type: 'practice',
                instructions: 'Practice delivering leadership communications in various scenarios.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: ['habit-foundations', 'communication-habits'],
        tags: ['leadership', 'management', 'team-building', 'professional'],
        completionRate: 65,
        rating: 4.7,
        enrolledUsers: 2100,
        isPremium: true,
      },
      {
        id: 'wellness-habits',
        title: getTranslatedCourseContent('holistic-wellness-habits', language).title,
        description: getTranslatedCourseContent('holistic-wellness-habits', language).description,
        difficulty: 'beginner',
        duration: 70,
        modules: [
          {
            id: 'wellness-overview',
            title: 'Holistic Wellness Overview',
            description: 'Understanding the interconnected nature of wellness',
            type: 'video',
            content: 'wellness-overview-intro',
            duration: 15,
            order: 1,
            isCompleted: false,
            exercises: [
              {
                id: 'wellness-assessment',
                title: 'Wellness Assessment',
                description: 'Assess your current wellness across all dimensions',
                type: 'reflection',
                instructions: 'Complete a comprehensive wellness assessment across physical, mental, emotional, and spiritual dimensions.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'wellness-assessment-tool',
                title: 'Wellness Assessment Tool',
                type: 'worksheet',
                url: 'wellness-assessment-tool.pdf',
                description: 'Comprehensive wellness assessment across all dimensions',
              }
            ],
          },
          {
            id: 'physical-wellness',
            title: 'Physical Wellness Habits',
            description: 'Develop habits for optimal physical health and vitality',
            type: 'interactive',
            content: 'physical-wellness-guide',
            duration: 25,
            order: 2,
            isCompleted: false,
            exercises: [
              {
                id: 'physical-wellness-plan',
                title: 'Physical Wellness Plan',
                description: 'Create a comprehensive physical wellness plan',
                type: 'planning',
                instructions: 'Design a personalized physical wellness plan that includes exercise, nutrition, and recovery.',
                estimatedTime: 25,
                isCompleted: false,
              }
            ],
            resources: [],
          },
          {
            id: 'mental-wellness',
            title: 'Mental Wellness Habits',
            description: 'Cultivate habits for mental health and cognitive well-being',
            type: 'text',
            content: 'mental-wellness-guide',
            duration: 20,
            order: 3,
            isCompleted: false,
            exercises: [
              {
                id: 'mental-wellness-practices',
                title: 'Mental Wellness Practices',
                description: 'Practice mental wellness techniques and strategies',
                type: 'practice',
                instructions: 'Practice various mental wellness techniques including mindfulness, stress management, and cognitive exercises.',
                estimatedTime: 20,
                isCompleted: false,
              }
            ],
            resources: [
              {
                id: 'mental-wellness-toolkit',
                title: 'Mental Wellness Toolkit',
                type: 'article',
                url: 'mental-wellness-toolkit.pdf',
                description: 'Comprehensive toolkit for mental wellness practices',
              }
            ],
          },
          {
            id: 'spiritual-wellness',
            title: 'Spiritual Wellness Habits',
            description: 'Develop habits for spiritual growth and inner peace',
            type: 'quiz',
            content: 'spiritual-wellness-quiz',
            duration: 10,
            order: 4,
            isCompleted: false,
            exercises: [
              {
                id: 'spiritual-practices',
                title: 'Spiritual Practices Exploration',
                description: 'Explore and practice various spiritual wellness techniques',
                type: 'reflection',
                instructions: 'Explore different spiritual practices and identify those that resonate with you.',
                estimatedTime: 15,
                isCompleted: false,
              }
            ],
            resources: [],
          }
        ],
        prerequisites: [],
        tags: ['wellness', 'health', 'holistic', 'lifestyle'],
        completionRate: 76,
        rating: 4.4,
        enrolledUsers: 1450,
        isPremium: false,
      }
    ];
  }

  /**
   * Get default guided setups
   */
  private static getDefaultGuidedSetups(language: string = 'en'): GuidedSetup[] {
    return [
      {
        id: 'first-habit-setup',
        title: getTranslatedGuidedSetupContent('first-habit-setup', language).title,
        description: getTranslatedGuidedSetupContent('first-habit-setup', language).description,
        steps: [
          {
            id: 'goal-setting',
            title: getTranslatedGuidedSetupStepContent('goal-setting', language).title,
            description: getTranslatedGuidedSetupStepContent('goal-setting', language).description,
            type: 'input',
            isCompleted: false,
            order: 1,
          },
          {
            id: 'habit-selection',
            title: getTranslatedGuidedSetupStepContent('habit-selection', language).title,
            description: getTranslatedGuidedSetupStepContent('habit-selection', language).description,
            type: 'selection',
            options: getTranslatedGuidedSetupOptions(['Exercise', 'Reading', 'Meditation', 'Journaling', 'Learning', 'Other'], language),
            isCompleted: false,
            order: 2,
          },
          {
            id: 'specificity',
            title: getTranslatedGuidedSetupStepContent('specificity', language).title,
            description: getTranslatedGuidedSetupStepContent('specificity', language).description,
            type: 'input',
            isCompleted: false,
            order: 3,
          },
          {
            id: 'cue-identification',
            title: getTranslatedGuidedSetupStepContent('cue-identification', language).title,
            description: getTranslatedGuidedSetupStepContent('cue-identification', language).description,
            type: 'input',
            isCompleted: false,
            order: 4,
          },
          {
            id: 'reward-planning',
            title: getTranslatedGuidedSetupStepContent('reward-planning', language).title,
            description: getTranslatedGuidedSetupStepContent('reward-planning', language).description,
            type: 'input',
            isCompleted: false,
            order: 5,
          },
          {
            id: 'confirmation',
            title: getTranslatedGuidedSetupStepContent('confirmation', language).title,
            description: getTranslatedGuidedSetupStepContent('confirmation', language).description,
            type: 'confirmation',
            isCompleted: false,
            order: 6,
          }
        ],
        estimatedTime: 15,
        category: 'getting-started',
        difficulty: 'beginner',
      },
      {
        id: 'productivity-setup',
        title: getTranslatedGuidedSetupContent('productivity-setup', language).title,
        description: getTranslatedGuidedSetupContent('productivity-setup', language).description,
        steps: [
          {
            id: 'productivity-assessment',
            title: getTranslatedGuidedSetupStepContent('productivity-assessment', language).title,
            description: getTranslatedGuidedSetupStepContent('productivity-assessment', language).description,
            type: 'input',
            isCompleted: false,
            order: 1,
          },
          {
            id: 'productivity-goals',
            title: getTranslatedGuidedSetupStepContent('productivity-goals', language).title,
            description: getTranslatedGuidedSetupStepContent('productivity-goals', language).description,
            type: 'input',
            isCompleted: false,
            order: 2,
          },
          {
            id: 'habit-selection',
            title: getTranslatedGuidedSetupStepContent('habit-selection', language).title,
            description: getTranslatedGuidedSetupStepContent('habit-selection', language).description,
            type: 'selection',
            options: getTranslatedGuidedSetupOptions(['Time Blocking', 'Task Prioritization', 'Email Management', 'Deep Work', 'Break Management'], language),
            isCompleted: false,
            order: 3,
          },
          {
            id: 'implementation-plan',
            title: getTranslatedGuidedSetupStepContent('implementation-plan', language).title,
            description: getTranslatedGuidedSetupStepContent('implementation-plan', language).description,
            type: 'input',
            isCompleted: false,
            order: 4,
          }
        ],
        estimatedTime: 20,
        category: 'productivity',
        difficulty: 'intermediate',
      }
    ];
  }

  /**
   * Delete user enrollment and progress for a specific course
   */
  static async deleteCourseEnrollment(userId: string, courseId: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PROGRESS_KEY);
      if (data) {
        const allProgress = JSON.parse(data);
        // Filter out the specific course enrollment for this user
        const filteredProgress = allProgress.filter((p: UserProgress) => 
          !(p.userId === userId && p.courseId === courseId)
        );
        
        await AsyncStorage.setItem(this.USER_PROGRESS_KEY, JSON.stringify(filteredProgress));
        console.log('🎯 Course enrollment deleted:', courseId, 'for user:', userId);
      }
    } catch (error) {
      console.error('Error deleting course enrollment:', error);
      throw error;
    }
  }

  /**
   * Check if user is enrolled in a course
   */

  /**
   * Clear stored courses to force regeneration with new translations
   */
  static async clearStoredCourses(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.COURSES_KEY);
      console.log('Stored courses cleared successfully');
    } catch (error) {
      console.error('Error clearing stored courses:', error);
    }
  }
}

export default HabitEducationService;
