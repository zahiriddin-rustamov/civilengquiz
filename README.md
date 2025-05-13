# CivilEngQuiz - Civil Engineering Quiz Platform

An interactive quiz platform for undergraduate civil engineering students, featuring quizzes, flashcards, and multimedia content to enhance learning.

## Features

- **Interactive Quizzes**: Multiple question types including multiple choice, true/false, fill-in-the-blank, and more
- **Flashcards**: Study key concepts with customizable flashcards to improve retention and recall
- **Multi-Media Learning**: Access videos, audio, and interactive diagrams to enhance understanding
- **Progress Tracking**: Monitor learning progress with detailed statistics and performance analytics
- **Admin Backend**: Content management system for creating and organizing educational content

## Tech Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3
- **UI Components**: ShadCN UI
- **State Management**: TanStack Query, React Context
- **Media Playback**: React Player
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn
- MongoDB instance (local or Atlas)
- AWS S3 bucket (for file storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/civilengquiz.git
   cd civilengquiz
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables (see `.env.local.example`):
   ```
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key

   # AWS S3
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   AWS_BUCKET_NAME=your_bucket_name
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
/
├── components/        # Reusable React components
│   ├── layout/        # Layout components
│   ├── ui/            # Basic UI components
│   ├── quiz/          # Quiz specific components
│   ├── flashcards/    # Flashcard components
│   ├── media/         # Media display components
│   └── admin/         # Admin interface components
├── app/               # Next.js 13+ App Router pages
│   ├── api/           # Backend API endpoints
│   ├── subjects/      # Subject pages
│   ├── login/         # Authentication pages
│   ├── register/      # User registration
│   └── admin/         # Admin portal
├── hooks/             # Custom React hooks
├── lib/               # Core utilities
├── context/           # React Context providers
├── models/            # TypeScript interfaces
├── utils/             # Helper functions
└── public/            # Static assets
```

## Development Workflow

1. Create new features in feature branches
2. Follow the TypeScript and code style guidelines
3. Write tests for critical functionality
4. Submit pull requests for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- All contributors and maintainers
- Civil engineering faculty and students who provided feedback
