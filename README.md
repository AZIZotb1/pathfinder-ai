# Pathfinder AI

An AI-powered career roadmap generator. Enter a job title and experience level, and get a personalized step-by-step learning roadmap powered by Google Gemini.

## Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Python, FastAPI, Google Gemini API

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # then fill in your GEMINI_API_KEY
python main.py              # runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env        # keep defaults for local dev
npm start                   # runs on http://localhost:3000
```

Both must be running at the same time.

## Deployment

- **Frontend** → Vercel (set `REACT_APP_API_URL` to your backend URL)
- **Backend** → Render / Railway (set `GEMINI_API_KEY` and `ALLOWED_ORIGINS` to your Vercel URL)
