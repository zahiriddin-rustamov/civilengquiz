import connectToDatabase from './mongoose';
import { Subject, Topic, Question, Flashcard, Media } from '@/models/database';

// Initial seed data based on your existing mock data
const seedData = {
  subjects: [
    {
      name: 'Concrete Technology',
      description: 'Master the art of concrete design, mixing, and testing. Unlock the secrets of modern construction materials.',
      isUnlocked: true,
      order: 1,
      difficulty: 'Beginner' as const,
      estimatedHours: 8,
      xpReward: 1200,
    },
    {
      name: 'Environmental Engineering',
      description: 'Explore sustainable solutions for environmental challenges. Become a guardian of our planet\'s future.',
      isUnlocked: true,
      order: 2,
      difficulty: 'Intermediate' as const,
      estimatedHours: 12,
      xpReward: 1500,
    },
    {
      name: 'Water Resources',
      description: 'Command the flow of water systems and hydraulic engineering. Master the element that shapes civilizations.',
      isUnlocked: false,
      order: 3,
      difficulty: 'Advanced' as const,
      estimatedHours: 15,
      xpReward: 1800,
    }
  ],
  
  topics: {
    'Concrete Technology': [
      {
        name: 'Fresh Concrete',
        description: 'Learn about the properties and behavior of concrete in its plastic state.',
        longDescription: 'Dive deep into the fascinating world of fresh concrete! Master the fundamental properties that determine workability, understand the science behind slump tests, and discover how different additives affect concrete behavior.',
        order: 1,
        isUnlocked: true,
        difficulty: 'Beginner' as const,
        estimatedMinutes: 45,
        xpReward: 150,
      },
      {
        name: 'Hardened Concrete',
        description: 'Understand the properties of concrete after it has set and hardened.',
        longDescription: 'Explore the transformation of concrete from plastic to hardened state. Learn about compressive strength, durability factors, and testing methods that ensure structural integrity.',
        order: 2,
        isUnlocked: true,
        difficulty: 'Intermediate' as const,
        estimatedMinutes: 60,
        xpReward: 200,
      },
      {
        name: 'Concrete Mix Design',
        description: 'Master the art of designing concrete mixes for specific applications.',
        longDescription: 'Learn the systematic approach to concrete mix design, understanding how to balance strength, workability, and durability requirements for different construction applications.',
        order: 3,
        isUnlocked: false,
        difficulty: 'Advanced' as const,
        estimatedMinutes: 90,
        xpReward: 300,
      }
    ],
    'Environmental Engineering': [
      {
        name: 'Water Quality',
        description: 'Study water quality parameters and assessment methods.',
        longDescription: 'Master the essential parameters that define water quality and learn the scientific methods used to assess and monitor water systems for environmental protection.',
        order: 1,
        isUnlocked: true,
        difficulty: 'Beginner' as const,
        estimatedMinutes: 50,
        xpReward: 180,
      },
      {
        name: 'Air Pollution Control',
        description: 'Learn about air pollution sources and control technologies.',
        longDescription: 'Understand the sources of air pollution and explore various technologies and strategies used to control and mitigate air quality issues in urban and industrial environments.',
        order: 2,
        isUnlocked: true,
        difficulty: 'Intermediate' as const,
        estimatedMinutes: 70,
        xpReward: 250,
      }
    ],
    'Water Resources': [
      {
        name: 'Hydrology Basics',
        description: 'Understand the water cycle and hydrological processes.',
        longDescription: 'Explore the fundamental principles of hydrology, including the water cycle, precipitation patterns, and water balance concepts essential for water resource management.',
        order: 1,
        isUnlocked: false,
        difficulty: 'Advanced' as const,
        estimatedMinutes: 80,
        xpReward: 280,
      }
    ]
  }
};

// Sample questions for Fresh Concrete topic
const freshConcreteQuestions = [
  {
    type: 'multiple-choice' as const,
    text: 'What is the primary factor that affects the workability of fresh concrete?',
    difficulty: 'Beginner' as const,
    points: 50,
    order: 1,
    data: {
      options: [
        'Water-cement ratio',
        'Aggregate size',
        'Cement type',
        'Temperature'
      ],
      correctAnswer: 0
    },
    explanation: 'The water-cement ratio is the most critical factor affecting workability. Higher water content increases workability but reduces strength.'
  },
  {
    type: 'true-false' as const,
    text: 'Adding more water to concrete mix always improves its workability without any negative effects.',
    difficulty: 'Beginner' as const,
    points: 40,
    order: 2,
    data: {
      correctAnswer: false
    },
    explanation: 'While adding water improves workability, it significantly reduces the concrete strength and durability due to increased porosity.'
  },
  {
    type: 'numerical' as const,
    text: 'Calculate the water-cement ratio for a concrete mix containing 350 kg/m³ of cement and 175 kg/m³ of water.',
    difficulty: 'Intermediate' as const,
    points: 100,
    order: 3,
    data: {
      correctAnswer: 0.5,
      tolerance: 0.02,
      unit: '',
      formula: 'W/C ratio = Water content / Cement content'
    },
    explanation: 'W/C ratio = 175/350 = 0.5. This is a typical ratio for normal strength concrete.'
  }
];

// Sample flashcards for Fresh Concrete topic
const freshConcreteFlashcards = [
  {
    front: 'What is workability in concrete?',
    back: 'Workability is the ease with which concrete can be mixed, transported, placed, and compacted without segregation or bleeding. It depends on water content, aggregate properties, and admixtures.',
    difficulty: 'Beginner' as const,
    points: 20,
    order: 1,
    tags: ['workability', 'fresh-concrete', 'properties'],
    category: 'Properties'
  },
  {
    front: 'What is the slump test used for?',
    back: 'The slump test measures the consistency and workability of fresh concrete. A higher slump indicates more fluid concrete, while lower slump indicates stiffer concrete.',
    difficulty: 'Beginner' as const,
    points: 20,
    order: 2,
    tags: ['slump-test', 'testing', 'workability'],
    category: 'Testing'
  },
  {
    front: 'What is bleeding in concrete?',
    back: 'Bleeding is the tendency of water to rise to the surface of freshly placed concrete. It occurs when cement particles settle and water moves upward, potentially weakening the surface.',
    difficulty: 'Intermediate' as const,
    points: 30,
    order: 3,
    tags: ['bleeding', 'defects', 'water'],
    category: 'Defects'
  }
];

// Sample media content for Fresh Concrete topic
const freshConcreteMedia = [
  {
    title: 'Concrete Mixing Process',
    description: 'Learn the step-by-step process of mixing concrete for optimal workability and strength.',
    difficulty: 'Beginner' as const,
    xpReward: 100,
    estimatedMinutes: 8,
    order: 1,
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    videoType: 'video' as const,
    thumbnail: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
    duration: 480,
    preVideoContent: {
      learningObjectives: [
        'Understand the proper sequence of concrete mixing',
        'Learn about different mixing methods and equipment',
        'Identify factors affecting concrete workability'
      ],
      prerequisites: [
        'Basic knowledge of concrete components',
        'Understanding of water-cement ratio'
      ],
      keyTerms: [
        { term: 'Workability', definition: 'The ease with which concrete can be mixed, transported, and placed' },
        { term: 'Slump', definition: 'A measure of concrete consistency and workability' }
      ]
    },
    postVideoContent: {
      keyConcepts: [
        'Proper mixing sequence ensures uniform distribution of materials',
        'Over-mixing can reduce workability and cause segregation',
        'Different projects require different mixing methods'
      ],
      reflectionQuestions: [
        'What would happen if you added water first before cement?',
        'How does mixing time affect concrete quality?',
        'When would you choose machine mixing over hand mixing?'
      ],
      practicalApplications: [
        'Small residential projects: portable mixer',
        'Large construction: ready-mix concrete trucks',
        'Specialized applications: high-performance mixing equipment'
      ],
      additionalResources: [
        { title: 'ACI Concrete Mixing Guidelines', url: 'https://www.concrete.org' },
        { title: 'Concrete Construction Magazine', url: 'https://www.concreteconstruction.net' }
      ]
    }
  },
  {
    type: 'simulation' as const,
    title: 'Concrete Slump Calculator',
    description: 'Interactive simulation to understand how different factors affect concrete workability.',
    difficulty: 'Intermediate' as const,
    points: 150,
    order: 2,
    data: {
      simulationType: 'concrete-slump',
      parameters: [
        {
          name: 'Water-Cement Ratio',
          min: 0.3,
          max: 0.8,
          default: 0.5,
          unit: '',
          description: 'Ratio of water to cement by weight'
        },
        {
          name: 'Aggregate Size',
          min: 10,
          max: 40,
          default: 20,
          unit: 'mm',
          description: 'Maximum size of coarse aggregate'
        }
      ],
      learningObjectives: [
        'Understand the relationship between W/C ratio and workability',
        'Learn how aggregate size affects concrete flow'
      ]
    }
  }
];

export async function seedDatabase() {
  try {
    await connectToDatabase();
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data (optional - remove in production)
    await Promise.all([
      Subject.deleteMany({}),
      Topic.deleteMany({}),
      Question.deleteMany({}),
      Flashcard.deleteMany({}),
      Media.deleteMany({})
    ]);
    
    console.log('🗑️  Cleared existing data');
    
    // Create subjects
    const createdSubjects = await Subject.insertMany(seedData.subjects);
    console.log(`✅ Created ${createdSubjects.length} subjects`);
    
    // Create topics for each subject
    let totalTopics = 0;
    for (const subject of createdSubjects) {
      const topicsForSubject = seedData.topics[subject.name as keyof typeof seedData.topics];
      if (topicsForSubject) {
        const topicsWithSubjectId = topicsForSubject.map(topic => ({
          ...topic,
          subjectId: subject._id
        }));
        
        const createdTopics = await Topic.insertMany(topicsWithSubjectId);
        totalTopics += createdTopics.length;
        
        // Add sample content for Fresh Concrete topic
        if (subject.name === 'Concrete Technology') {
          const freshConcreteTopic = createdTopics.find(t => t.name === 'Fresh Concrete');
          if (freshConcreteTopic) {
            // Add questions
            const questionsWithTopicId = freshConcreteQuestions.map(q => ({
              ...q,
              topicId: freshConcreteTopic._id
            }));
            await Question.insertMany(questionsWithTopicId);
            
            // Add flashcards
            const flashcardsWithTopicId = freshConcreteFlashcards.map(f => ({
              ...f,
              topicId: freshConcreteTopic._id
            }));
            await Flashcard.insertMany(flashcardsWithTopicId);
            
            // Add media
            const mediaWithTopicId = freshConcreteMedia.map(m => ({
              ...m,
              topicId: freshConcreteTopic._id
            }));
            await Media.insertMany(mediaWithTopicId);
            
            console.log(`✅ Added sample content for Fresh Concrete topic`);
          }
        }
      }
    }
    
    console.log(`✅ Created ${totalTopics} topics`);
    console.log('🎉 Database seeding completed successfully!');
    
    return {
      success: true,
      message: `Seeded ${createdSubjects.length} subjects and ${totalTopics} topics with sample content`
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to check if database needs seeding
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    await connectToDatabase();
    const subjectCount = await Subject.countDocuments();
    return subjectCount === 0;
  } catch (error) {
    console.error('Error checking database:', error);
    return true;
  }
}
