import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Subject, Topic, QuestionSection, Question, Flashcard } from '../src/models/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sample data for subjects
const subjectsData = [
  {
    name: 'Concrete Technology',
    description: 'Master the fundamentals of concrete materials, mix design, properties, and testing methods used in modern construction.',
    imageUrl: 'https://picsum.photos/id/1/5000/3333',
    isUnlocked: true,
    order: 1,
    difficulty: 'Beginner' as const,
  },
  {
    name: 'Environmental Engineering',
    description: 'Explore water treatment, wastewater management, air quality control, and sustainable environmental solutions.',
    imageUrl: 'https://picsum.photos/id/2/5000/3333',
    isUnlocked: true,
    order: 2,
    difficulty: 'Intermediate' as const,
  },
  {
    name: 'Water Resources Engineering',
    description: 'Study hydrology, hydraulics, water distribution systems, and sustainable water resource management strategies.',
    imageUrl: 'https://picsum.photos/id/3/5000/3333',
    isUnlocked: true,
    order: 3,
    difficulty: 'Advanced' as const,
  },
];

// Sample topics for each subject
const topicsData = {
  'Concrete Technology': [
    {
      name: 'Introduction to Concrete',
      description: 'Basic properties and components of concrete',
      longDescription: 'Learn about the fundamental properties of concrete, its components including cement, aggregates, water, and admixtures. Understand the basic chemistry and behavior of concrete materials.',
      imageUrl: 'https://picsum.photos/id/10/5000/3333',
      order: 1,
      difficulty: 'Beginner' as const,
    },
    {
      name: 'Mix Design Methods',
      description: 'Various methods for designing concrete mixes',
      longDescription: 'Explore different concrete mix design methods including ACI, British, and DOE methods. Learn how to calculate proportions and optimize concrete mixtures for specific applications.',
      imageUrl: 'https://picsum.photos/id/11/5000/3333',
      order: 2,
      difficulty: 'Intermediate' as const,
    },
    {
      name: 'Concrete Testing',
      description: 'Testing methods for fresh and hardened concrete',
      longDescription: 'Master various testing procedures for both fresh and hardened concrete, including slump tests, compressive strength tests, and durability assessments.',
      imageUrl: 'https://picsum.photos/id/12/5000/3333',
      order: 3,
      difficulty: 'Advanced' as const,
    },
  ],
  'Environmental Engineering': [
    {
      name: 'Water Treatment Processes',
      description: 'Physical, chemical, and biological water treatment',
      longDescription: 'Understand the complete water treatment process from source to tap, including coagulation, flocculation, sedimentation, filtration, and disinfection methods.',
      imageUrl: 'https://picsum.photos/id/20/5000/3333',
      order: 1,
      difficulty: 'Intermediate' as const,
    },
    {
      name: 'Air Pollution Control',
      description: 'Methods for controlling air pollutants',
      longDescription: 'Study air quality standards, sources of air pollution, and various control technologies including particulate control devices and gaseous pollutant treatment systems.',
      imageUrl: 'https://picsum.photos/id/21/5000/3333',
      order: 2,
      difficulty: 'Advanced' as const,
    },
  ],
  'Water Resources Engineering': [
    {
      name: 'Hydrology Fundamentals',
      description: 'Basic principles of the hydrologic cycle',
      longDescription: 'Learn about the hydrologic cycle, precipitation, evapotranspiration, infiltration, and runoff. Understand how water moves through natural systems.',
      imageUrl: 'https://picsum.photos/id/30/5000/3333',
      order: 1,
      difficulty: 'Beginner' as const,
    },
    {
      name: 'Open Channel Flow',
      description: 'Hydraulics of open channel systems',
      longDescription: 'Master the principles of open channel hydraulics including flow classification, energy principles, and channel design for rivers, canals, and drainage systems.',
      imageUrl: 'https://picsum.photos/id/31/5000/3333',
      order: 2,
      difficulty: 'Intermediate' as const,
    },
    {
      name: 'Groundwater Engineering',
      description: 'Groundwater flow and well hydraulics',
      longDescription: 'Explore groundwater occurrence, aquifer properties, well design, pumping tests, and groundwater contamination issues.',
      imageUrl: 'https://picsum.photos/id/32/5000/3333',
      order: 3,
      difficulty: 'Advanced' as const,
    },
    {
      name: 'Dam Engineering',
      description: 'Design and analysis of dams',
      longDescription: 'Study different types of dams, design considerations, stability analysis, and reservoir operation for water storage and flood control.',
      imageUrl: 'https://picsum.photos/id/33/5000/3333',
      order: 4,
      difficulty: 'Advanced' as const,
    },
  ],
};

// Sample sections for each topic type
const getSectionsForTopic = (topicName: string) => {
  const sectionTemplates = {
    basic: [
      { name: 'Introduction', description: 'Fundamental concepts and definitions' },
      { name: 'Key Principles', description: 'Core principles and theories' },
      { name: 'Applications', description: 'Real-world applications and examples' },
    ],
    advanced: [
      { name: 'Fundamentals', description: 'Basic theory and background' },
      { name: 'Analysis Methods', description: 'Analytical approaches and techniques' },
      { name: 'Design Procedures', description: 'Step-by-step design methodologies' },
      { name: 'Case Studies', description: 'Practical examples and problem solving' },
    ],
  };

  // Use basic for first topic, advanced for others
  return topicName.includes('Introduction') || topicName.includes('Fundamentals')
    ? sectionTemplates.basic
    : sectionTemplates.advanced;
};

// Generate questions for a section
const getQuestionsForSection = (sectionName: string, difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
  const xpRewards = { Beginner: 10, Intermediate: 15, Advanced: 20 };
  const estimatedMinutes = { Beginner: 2, Intermediate: 3, Advanced: 5 };

  return [
    // Multiple Choice
    {
      type: 'multiple-choice' as const,
      text: `Which of the following is the most important consideration for ${sectionName}?`,
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: estimatedMinutes[difficulty],
      data: {
        options: [
          'Material properties and behavior',
          'Cost considerations only',
          'Aesthetic appearance',
          'Construction speed',
        ],
        correctAnswer: 0,
      },
      explanation: 'Material properties and behavior are fundamental to understanding structural performance and ensuring safety in engineering applications.',
    },
    // True/False
    {
      type: 'true-false' as const,
      text: `The principles covered in ${sectionName} are applicable to all types of civil engineering projects.`,
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: 1,
      data: {
        correctAnswer: true,
      },
      explanation: 'These fundamental principles form the basis of civil engineering practice and apply across various project types with appropriate modifications.',
    },
    // Numerical
    {
      type: 'numerical' as const,
      text: 'Calculate the design parameter for a standard application (assume unit conditions).',
      difficulty,
      xpReward: xpRewards[difficulty] + 5,
      estimatedMinutes: estimatedMinutes[difficulty] + 2,
      data: {
        correctAnswer: 100,
        tolerance: 5,
        unit: 'units',
      },
      explanation: 'Using standard engineering formulas and unit conditions, the calculated value should be approximately 100 units.',
    },
    // Fill in the blank
    {
      type: 'fill-in-blank' as const,
      text: `The key factor affecting performance in ${sectionName} is _______.`,
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: estimatedMinutes[difficulty],
      data: {
        text: `The key factor affecting performance in ${sectionName} is _______.`,
        blanks: [
          {
            id: 'blank-1',
            correctAnswers: ['strength', 'load capacity', 'structural integrity', 'material quality'],
            caseSensitive: false,
          }
        ],
        difficulty,
        points: xpRewards[difficulty],
      },
      explanation: 'Multiple factors can affect performance, but strength, load capacity, structural integrity, and material quality are the most critical considerations.',
    },
    // Matching
    {
      type: 'matching' as const,
      text: 'Match the following engineering terms with their definitions:',
      difficulty,
      xpReward: xpRewards[difficulty] + 5,
      estimatedMinutes: estimatedMinutes[difficulty] + 1,
      data: {
        text: 'Match the following engineering terms with their definitions:',
        pairs: [
          { id: 'pair-1', left: 'Load', right: 'External force applied to a structure' },
          { id: 'pair-2', left: 'Stress', right: 'Internal resistance per unit area' },
          { id: 'pair-3', left: 'Strain', right: 'Deformation per unit length' },
          { id: 'pair-4', left: 'Modulus', right: 'Material stiffness property' },
        ],
        difficulty,
        points: xpRewards[difficulty] + 5,
      },
      explanation: 'Understanding these fundamental engineering terms is essential for structural analysis and design.',
    },
  ];
};

// Generate flashcards for a topic
const getFlashcardsForTopic = (topicName: string, difficulty: 'Beginner' | 'Intermediate' | 'Advanced') => {
  const xpRewards = { Beginner: 5, Intermediate: 8, Advanced: 10 };

  return [
    {
      front: `What is the primary purpose of studying ${topicName}?`,
      back: `To understand the fundamental principles, design methods, and practical applications related to ${topicName} in civil engineering practice.`,
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: 1,
      tags: ['fundamentals', 'theory'],
      category: 'Concepts',
    },
    {
      front: `Name three key factors to consider in ${topicName}.`,
      back: 'Safety and structural integrity, economic feasibility and cost-effectiveness, and environmental impact and sustainability.',
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: 1,
      tags: ['design', 'considerations'],
      category: 'Design',
    },
    {
      front: `What are common challenges faced in ${topicName}?`,
      back: 'Complex material behavior, variable environmental conditions, budget and time constraints, and meeting regulatory standards and codes.',
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: 1,
      tags: ['challenges', 'practice'],
      category: 'Practical',
    },
    {
      front: 'What tools and methods are commonly used in engineering analysis?',
      back: 'Computational software and modeling tools, standardized design codes and specifications, experimental testing and validation, and empirical formulas and charts.',
      difficulty,
      xpReward: xpRewards[difficulty],
      estimatedMinutes: 1,
      tags: ['tools', 'methods'],
      category: 'Methods',
    },
    {
      front: 'How do safety factors influence engineering design?',
      back: 'Safety factors account for uncertainties in loads, material properties, and analysis methods. They ensure structures can withstand unexpected conditions and provide a margin of safety beyond design requirements.',
      difficulty,
      xpReward: xpRewards[difficulty] + 2,
      estimatedMinutes: 2,
      tags: ['safety', 'design'],
      category: 'Safety',
    },
  ];
};

async function populateDatabase() {
  console.log('🚀 Starting database population...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Question.deleteMany({});
    await Flashcard.deleteMany({});
    await QuestionSection.deleteMany({});
    await Topic.deleteMany({});
    await Subject.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create subjects
    console.log('📚 Creating subjects...');
    const subjects = await Subject.insertMany(subjectsData);
    console.log(`✅ Created ${subjects.length} subjects\n`);

    // Create topics, sections, questions, and flashcards
    for (const subject of subjects) {
      console.log(`📖 Processing subject: ${subject.name}`);
      const subjectTopics = topicsData[subject.name as keyof typeof topicsData];

      for (const topicData of subjectTopics) {
        // Create topic
        const topic = await Topic.create({
          ...topicData,
          subjectId: subject._id,
          isUnlocked: true,
          sectionSettings: {
            unlockConditions: 'always',
            requiredScore: 70,
            requireCompletion: false,
          },
        });
        console.log(`  ✓ Created topic: ${topic.name}`);

        // Create sections for this topic
        const sections = getSectionsForTopic(topic.name);
        let sectionOrder = 1;

        for (const sectionData of sections) {
          // Create section
          const section = await QuestionSection.create({
            ...sectionData,
            topicId: topic._id,
            order: sectionOrder++,
          });
          console.log(`    ✓ Created section: ${section.name}`);

          // Create questions for this section
          const questions = getQuestionsForSection(section.name, topic.difficulty);
          let questionOrder = 1;

          for (const questionData of questions) {
            await Question.create({
              ...questionData,
              topicId: topic._id,
              sectionId: section._id,
              order: questionOrder++,
            });
          }
          console.log(`      ✓ Created ${questions.length} questions`);
        }

        // Create flashcards for this topic
        const flashcards = getFlashcardsForTopic(topic.name, topic.difficulty);
        let flashcardOrder = 1;

        for (const flashcardData of flashcards) {
          await Flashcard.create({
            ...flashcardData,
            topicId: topic._id,
            order: flashcardOrder++,
          });
        }
        console.log(`    ✓ Created ${flashcards.length} flashcards`);
      }
      console.log();
    }

    // Print summary
    console.log('📊 Population Summary:');
    console.log('─────────────────────────────');
    const subjectCount = await Subject.countDocuments();
    const topicCount = await Topic.countDocuments();
    const sectionCount = await QuestionSection.countDocuments();
    const questionCount = await Question.countDocuments();
    const flashcardCount = await Flashcard.countDocuments();

    console.log(`Subjects:        ${subjectCount}`);
    console.log(`Topics:          ${topicCount}`);
    console.log(`Sections:        ${sectionCount}`);
    console.log(`Questions:       ${questionCount}`);
    console.log(`Flashcards:      ${flashcardCount}`);
    console.log('─────────────────────────────');
    console.log('\n✅ Database population completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during population:', error);
    throw error;
  }
}

// Run the script
async function main() {
  try {
    await connectToDatabase();
    await populateDatabase();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

main();
