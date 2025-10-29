# AI Judge - Automated Submission Evaluation Platform

A sophisticated web application that uses AI to automatically evaluate and grade submissions. Built with React/TypeScript frontend and Flask/SQLAlchemy backend.

## 🚀 Features

### Core Functionality

- **📁 Submission Upload**: Drag-and-drop JSON file uploads with validation
- **🤖 AI Judge Management**: Create and manage AI judges with custom prompts
- **📋 Queue & Assignments**: Assign judges to specific questions for evaluation
- **📊 Results & Analytics**: View results with charts, filters, and export capabilities

### Advanced Features

- **🎨 Modern UI**: Beautiful, responsive design with Tailwind CSS
- **📈 Data Visualization**: Interactive charts showing pass rates and verdict distributions
- **🔍 Advanced Filtering**: Filter results by judge, verdict, submission, and question
- **💾 Data Export**: Export evaluation results to CSV
- **⚡ Real-time Updates**: Live status updates and error handling
- **🌐 API Integration**: Robust error handling and loading states

## 🛠️ Tech Stack

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
- **Notifications**: React Hot Toast

## 🏁 Quick Start

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

- ✅ Start the backend server on port 5002
- ✅ Start the frontend on port 5173
- ✅ Open http://localhost:5173 in your browser

### 4. Access Application

- **Frontend**: http://localhost:5173 ← Your app opens here!
- **Backend API**: http://localhost:5002

## 📋 Environment Configuration

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

## 🔄 Complete Workflow

### 1. Upload Submissions

- Navigate to Upload page
- Download sample JSON or upload your own
- Supports drag-and-drop and click-to-upload
- Validates JSON structure and provides feedback

### 2. Create AI Judges

- Go to Judges page
- Create judges with custom evaluation prompts
- Choose from available OpenAI models (GPT-4o-mini, GPT-4o, GPT-4-Turbo, etc.)
- Activate/deactivate judges as needed

### 3. Assign Judges

- Visit Queue page
- Assign judges to specific question IDs
- View existing assignments
- Run evaluations individually or in batches

### 4. View Results

- Check Results page for detailed analytics
- Filter by judge, verdict, submission, or question
- View interactive charts and statistics
- Export data to CSV for further analysis

## 📊 Data Format

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

## 🏗️ Architecture

### Backend Structure

```
backend/
├── app.py              # Flask application and configuration
├── database.py         # SQLAlchemy setup
├── models.py          # Database models
├── llm.py             # OpenAI integration
├── routes/            # API endpoints
│   ├── submissions.py
│   ├── judges.py
│   ├── assignments.py
│   └── evaluations.py
└── requirements.txt   # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Main application pages
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API client and utilities
│   ├── types.ts       # TypeScript definitions
│   └── App.tsx        # Main application component
└── package.json       # Node.js dependencies
```

### Database Schema

- **Submissions**: Store uploaded submission data
- **Questions**: Question templates with metadata
- **Answers**: Student responses to questions
- **Judges**: AI judge configurations and prompts
- **Assignments**: Links judges to specific questions
- **Evaluations**: AI evaluation results and reasoning

## ⚡ Performance & Scalability

### Current Implementation

- SQLite database for development
- Sequential AI evaluations
- Local file storage
- Memory-based session management

### Production Recommendations

- **Database**: PostgreSQL for better concurrency
- **AI Processing**: Batch evaluations with rate limiting
- **File Storage**: Cloud storage (AWS S3, etc.)
- **Caching**: Redis for session and API response caching
- **Load Balancing**: Multiple backend instances
- **Monitoring**: Application performance monitoring

## 🔒 Security Considerations

### Current Security

- Input validation and sanitization
- SQL injection protection via SQLAlchemy
- CORS configuration
- Basic error handling

### Production Security

- Authentication and authorization
- API rate limiting
- Input validation middleware
- Secure headers and HTTPS
- Environment variable protection
- Audit logging

## 🚦 API Endpoints

### Submissions

- `GET /submissions` - List all submissions
- `POST /submissions/import` - Upload new submissions

### Judges

- `GET /judges` - List all judges
- `POST /judges` - Create new judge
- `PUT /judges/:id` - Update judge
- `DELETE /judges/:id` - Delete judge

### Assignments

- `GET /assignments` - List assignments
- `POST /assignments` - Create assignment

### Evaluations

- `GET /evaluations` - List evaluations with filters
- `POST /evaluations/run` - Run AI evaluations

### System

- `GET /` - Health check and status

## 🐛 Known Limitations

1. **AI Provider**: Only OpenAI models are currently supported (requires OPENAI_API_KEY)
2. **AI Costs**: OpenAI API calls can accumulate costs with large datasets
3. **Concurrency**: Sequential processing may be slow for large batches
4. **File Size**: Large JSON uploads may timeout without chunking
5. **Real-time**: No WebSocket support for live evaluation progress

## 🔧 Troubleshooting

### Backend Issues

```bash
# Check if backend is running
curl http://localhost:5002/

# View logs
tail -f backend/logs/app.log

# Reset database
rm -f backend/instance/ai_judge.db
```

### Frontend Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Vite config
npm run build
```

### Common Errors

- **Port conflicts**: Use `PORT=5003 python app.py`
- **CORS errors**: Ensure backend CORS is configured
- **OpenAI errors**: Check API key and model availability

## 🚀 Future Enhancements

### Planned Features

- [ ] **Real-time Evaluation Progress**: WebSocket integration
- [ ] **Batch Processing**: Queue management for large datasets
- [ ] **Multi-provider Support**: Integration with Anthropic Claude, Google Gemini, etc.
- [ ] **Advanced Analytics**: ML-based insights and trends
- [ ] **User Management**: Authentication and role-based access
- [ ] **API Documentation**: Interactive Swagger/OpenAPI docs

### Technical Improvements

- [ ] **Database Migration**: PostgreSQL support
- [ ] **Container Deployment**: Docker and Kubernetes
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **Performance Monitoring**: APM integration
- [ ] **Caching Layer**: Redis for improved performance

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI evaluation capabilities
- React and Flask communities for excellent documentation
- Tailwind CSS for the design system
- Contributors and beta testers

---

**Built with ❤️ for automated evaluation and AI-powered assessment**
