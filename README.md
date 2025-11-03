# AI Judge - Automated Submission Evaluation Platform

A sophisticated web application that uses AI to automatically evaluate and grade submissions. Built with React/TypeScript frontend and Flask/SQLAlchemy backend.

## Features

### Core Functionality
- **Submission Upload**: Drag-and-drop JSON file uploads with validation
- **AI Judge Management**: Create and manage AI judges with configurabel prompts
- **Queue & Assignments**: Assign judges to specific questions for evaluation
- **Results & Analytics**: View results with charts, filters, and export capabilities


## Tech Stack

### Backend
- **Framework**: Flask 3.1.2
- **Database**: SQLAlchemy with SQLite
- **AI Integration**: OpenAI API
- **API**: RESTful endpoints with CORS support
- **Validation**: Pydantic for data validation

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components
- **State Management**: React hooks and Tanstack Query
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

##  Quick Start

### 1. Backend Setup (One-time)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# Create .env file
echo "DEBUG=true" > .env
echo "PORT=5002" >> .env
echo "OPENAI_API_KEY=your_api_key_here" >> .env
```

### 2. Install Frontend Dependencies (One-time)

```bash
cd frontend
npm install
```

### 3. Run Everything with One Command! 🎉

```bash
cd frontend
npm run dev
```

This will automatically:

- Start the backend server on port 5002
- Start the frontend on port 5173
- Open http://localhost:5173 in your browser

### 4. Access Application

- **Frontend**: http://localhost:5173 ← Your app opens here!
- **Backend API**: http://localhost:5002

## Environment Configuration

### Backend (.env)

```bash
# Server Configuration
DEBUG=true
PORT=5002
DATABASE_URL=sqlite:///ai_judge.db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
MODEL_NAME=gpt-4o-mini
```

### Frontend

The frontend automatically connects to `localhost:5002`. Update `src/services/api.ts` to change the backend URL.


### Submission JSON Structure

```json
[
  {
    "id": "sub_1",
    "queueId": "queue_1",
    "labelingTaskId": "task_1",
    "createdAt": 1690000000000,
    "questions": [
      {
        "rev": 1,
        "data": {
          "id": "q_template_1",
          "questionType": "single_choice_with_reasoning",
          "questionText": "What is 2 + 2?"
        }
      }
    ],
    "answers": {
      "q_template_1": {
        "choice": "4",
        "reasoning": "Basic arithmetic: 2 + 2 equals 4"
      }
    }
  }
]
```
