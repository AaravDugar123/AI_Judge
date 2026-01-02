# AI Judge - Automated Submission Evaluation Platform

A sophisticated web application that uses configurable AI to evaluate and grade submissions automatically. Built with React/TypeScript frontend and Flask/SQLAlchemy backend. This was built for UC Berkeley GSI's who wanted to automate their grading feedback for open-ended homework assignments/projects while maintaining a personal touch

## Features

### Core Functionality
- **Submission Upload**: Drag-and-drop JSON file uploads with validation
- **AI Judge Management**: Create and manage AI judges with configurable prompts
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
