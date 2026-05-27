# LexiGrow — AI-Driven English Vocabulary & Writing Growth Tracker

LexiGrow is a web application designed to help English learners enhance their writing skills and vocabulary through AI-powered feedback. It includes a comprehensive backend REST API and a highly interactive, responsive frontend dashboard for both students and teachers.

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) and npm installed.

### 1. Installation
Clone the repository and install dependencies for both the frontend (root directory) and the backend (`server` directory).

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Configuration
Create a `.env` file inside the `server/` directory. You can copy the contents of `.env.example` as a template:

```bash
cd server
cp .env.example .env
```

Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://admin:123@36.50.54.246:27017/lexigrow?authSource=admin
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Running the Project

To run both the frontend and backend concurrently in development mode:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 (Frontend App):**
```bash
# In the root directory
npm run dev
# Frontend will run on http://localhost:5173
```
Vite is preconfigured to proxy API requests from the frontend to the backend (`/api` -> `http://localhost:5000`).

---

## 📝 Project Description & Features

LexiGrow is a Capstone Project built to help students systematically grow their active vocabulary through writing. The platform automatically extracts vocabulary, evaluates complexity, and identifies areas of growth using AI.

### Key Features

#### 🎓 For Students
*   **AI Writing Assistant**: Write and submit essays for detailed AI evaluations.
*   **Dynamic Vocabulary Library**: Auto-detects and categorizes newly used words into Academic, Scientific, Business, and Daily categories.
*   **Goal Tracking**: Set and measure weekly metrics like word count targets, essay counts, and complexity score goals.
*   **Detailed Analytics**: View progress charts, vocabulary growth charts, and earn milestone achievements.

#### 🏫 For Teachers
*   **Classroom Management**: Create classes, invite students, and view student lists.
*   **Roster Metrics & Insights**: Real-time evaluation of each student's TTR (Type-Token Ratio), growth trajectories, and submission states.
*   **Early Warning Alert System**: Automatically flags declining scores, student inactivity (e.g. no essays in 5 days), or low vocabulary diversity.
*   **Custom Prompting Templates**: Edit system prompts used by the AI engine to evaluate essays.
*   **Manual Grading & Feedback**: Override or supplement AI scores with direct manual comments.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js (Vite), Vanilla CSS, React Router, HSL Custom Variables.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB, Mongoose (indexing and aggregations).
*   **Authentication**: JWT (JSON Web Tokens), Google OAuth (integrated flow).
*   **AI Engine**: Google Gemini AI (using `@google/generative-ai` SDK).
