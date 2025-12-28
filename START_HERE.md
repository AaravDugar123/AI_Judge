# Start Guide

## First Time Setup

### 1. Backend Setup (One-time)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file with your OpenAI API key
echo "DEBUG=true" > .env
echo "PORT=5002" >> .env
echo "OPENAI_API_KEY=your_actual_openai_key_here" >> .env
echo "MODEL_NAME=gpt-4o-mini" >> .env
```

### 2. Frontend Setup (One-time)

```bash
cd frontend
npm install
```

---

## Running the App (Every Time)

### Option 1: One Command (Recommended) 🎉

```bash
cd frontend
npm run dev
```

This automatically:

- Starts the backend server on port 5002
- Starts the frontend on port 5173
- Opens http://localhost:5173 in your browser

### Option 2: Separate Terminals

If you prefer to run them separately:

**Terminal 1 - Backend:**

```bash
cd backend
./start.sh
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run frontend
```

---

## Access the Application

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:5002

---

## Stopping the Servers

Press `Ctrl+C` in the terminal to stop both servers.

---