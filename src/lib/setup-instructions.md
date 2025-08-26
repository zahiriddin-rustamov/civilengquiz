# Database Setup Instructions

## 🚀 Quick Setup Guide

### 1. Environment Variables
Make sure your `.env.local` file contains:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civilengquiz?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
```

### 2. Database Seeding

Once your MongoDB connection is set up, you can seed the database with initial data:

#### Option 1: Via API (Recommended)
1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/api/seed`
3. This will check if your database needs seeding
4. If empty, make a POST request to seed it:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

#### Option 2: Via Browser
1. Go to your browser's developer console on any page of your app
2. Run this JavaScript:
   ```javascript
   fetch('/api/seed', { method: 'POST' })
     .then(res => res.json())
     .then(data => console.log(data));
   ```

### 3. Verification

After seeding, you should see:
- ✅ 3 subjects in your database
- ✅ Multiple topics for each subject
- ✅ Sample questions, flashcards, and media for "Fresh Concrete" topic

### 4. What's Been Implemented

#### ✅ Database Layer
- **MongoDB Connection**: Both raw MongoDB client and Mongoose
- **Data Models**: User, Subject, Topic, Question, Flashcard, Media, UserProgress
- **Database Operations**: Service classes for all CRUD operations

#### ✅ API Endpoints
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create subject (admin only)
- `GET /api/subjects/[id]` - Get subject by ID
- `PUT /api/subjects/[id]` - Update subject (admin only)
- `DELETE /api/subjects/[id]` - Delete subject (admin only)
- `GET /api/subjects/[id]/topics` - Get topics for subject
- `POST /api/subjects/[id]/topics` - Create topic (admin only)
- `POST /api/seed` - Seed database with initial data

#### ✅ Frontend Integration
- **Subjects Page**: Now loads real data from database instead of mock data
- **Error Handling**: Proper loading states and error messages
- **Type Safety**: Full TypeScript integration

### 5. Next Steps

Now that the foundation is set up, you can:

1. **Test the current implementation**:
   - Visit `/subjects` page to see real database data
   - Verify subjects are loading from MongoDB

2. **Expand the API**:
   - Add topic management endpoints
   - Add question/flashcard/media CRUD operations

3. **Build the Admin Panel**:
   - Create admin routes for content management
   - Build forms for creating/editing content

4. **Enhance User Experience**:
   - Add progress tracking
   - Implement the learning features

### 6. Database Schema Overview

```
Users
├── Basic auth info + role (student/admin)

Subjects
├── Name, description, difficulty
├── XP rewards, estimated time
├── Unlocked status and ordering

Topics
├── Belongs to Subject
├── Name, description, difficulty
├── XP rewards, estimated time
├── Unlocked status and ordering

Questions/Flashcards/Media
├── Belongs to Topic
├── Type-specific data structure
├── Points, difficulty, ordering

UserProgress
├── Tracks user completion status
├── Stores scores, time spent
├── Flexible data field for extra info
```

### 7. Sample Data Included

The seeder includes:
- **Concrete Technology** with "Fresh Concrete" topic (full content)
- **Environmental Engineering** with "Water Quality" topic
- **Water Resources** with "Hydrology Basics" topic
- Sample questions (multiple choice, true/false, numerical)
- Sample flashcards with categories and tags
- Sample media (videos, simulations)

### 8. Testing Your Setup

1. **Check Database Connection**:
   ```bash
   curl http://localhost:3000/api/seed
   ```

2. **Verify Data Loading**:
   - Visit `http://localhost:3000/subjects`
   - Should show 3 subjects from database
   - No more mock data!

3. **Test Admin Features** (when logged in as admin):
   - API endpoints should work for CRUD operations
   - Seeding should respect admin permissions

---

## 🎉 Success!

You now have a working database foundation with:
- ✅ Real MongoDB integration
- ✅ Complete data models
- ✅ Working API endpoints  
- ✅ Frontend consuming real data
- ✅ Sample content to work with

This is your solid foundation to build the rest of the platform! 🚀
