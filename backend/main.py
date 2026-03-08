import os
import logging
import json
import re
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel, validator
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime, timedelta
from collections import defaultdict

load_dotenv()

app = FastAPI(title="Pathfinder AI - Career Roadmap Generator")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type"],
)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No GEMINI_API_KEY found in environment variables")

client = genai.Client(api_key=api_key)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("pathfinder-ai")

# Cache
backend_cache = {}
cache_timestamps = {}
MAX_CACHE_SIZE = 100
CACHE_TTL_HOURS = 24

# Rate limiting
request_counts = defaultdict(list)
MAX_REQUESTS_PER_HOUR = 20


def check_rate_limit(client_ip: str) -> bool:
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    request_counts[client_ip] = [t for t in request_counts[client_ip] if t > hour_ago]
    if len(request_counts[client_ip]) >= MAX_REQUESTS_PER_HOUR:
        return False
    request_counts[client_ip].append(now)
    return True


def clean_old_cache():
    current_time = datetime.now()
    expired_keys = [k for k, t in cache_timestamps.items() if current_time - t > timedelta(hours=CACHE_TTL_HOURS)]
    for key in expired_keys:
        backend_cache.pop(key, None)
        cache_timestamps.pop(key, None)
    if expired_keys:
        logger.info(f"Cleaned {len(expired_keys)} expired cache entries")


def add_to_cache(key, value):
    clean_old_cache()
    if len(backend_cache) >= MAX_CACHE_SIZE:
        oldest_key = min(cache_timestamps, key=cache_timestamps.get)
        backend_cache.pop(oldest_key, None)
        cache_timestamps.pop(oldest_key, None)
    backend_cache[key] = value
    cache_timestamps[key] = datetime.now()


def validate_career_goal_enhanced(goal: str) -> tuple:
    if not goal or not goal.strip():
        return False, "Goal cannot be empty"
    goal = goal.strip()
    if len(goal) < 3:
        return False, "Goal is too short"
    if len(goal) > 200:
        return False, "Goal is too long"
    if not re.search(r'[a-zA-Z]', goal):
        return False, "Goal must contain letters"
    for pattern in [r'\bi am\b', r"\bi'm\b", r'\bi want\b', r'\bhow to\b', r'\bhelp me\b']:
        if re.search(pattern, goal, re.IGNORECASE):
            return False, "Please enter just the career title (e.g., 'Data Scientist')"
    if len(goal.split()) > 8:
        return False, "Please enter a career title, not a full sentence"
    return True, ""


# --- Dependency ---

async def require_rate_limit(request: Request) -> str:
    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded: {client_ip}")
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Maximum 20 requests per hour.")
    return client_ip


# --- Models ---

class UserProfile(BaseModel):
    goal: str
    level: str

    @validator('goal')
    def goal_must_be_valid(cls, v):
        is_valid, error_msg = validate_career_goal_enhanced(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v.strip()

    @validator('level')
    def level_must_be_valid(cls, v):
        valid_levels = ['Beginner', 'Intermediate', 'Advanced']
        if v not in valid_levels:
            raise ValueError(f'Level must be one of: {", ".join(valid_levels)}')
        return v


class StepDetailRequest(BaseModel):
    step_title: str
    goal: str

    @validator('step_title')
    def step_title_must_be_valid(cls, v):
        if not v or not v.strip():
            raise ValueError('step_title cannot be empty')
        if len(v) > 200:
            raise ValueError('step_title is too long')
        return v.strip()

    @validator('goal')
    def goal_must_be_valid(cls, v):
        is_valid, error_msg = validate_career_goal_enhanced(v)
        if not is_valid:
            raise ValueError(error_msg)
        return v.strip()


class ChatRequest(BaseModel):
    message: str
    context: str
    history: list = []

    @validator('message')
    def message_must_be_valid(cls, v):
        if not v or not v.strip():
            raise ValueError('message cannot be empty')
        if len(v) > 1000:
            raise ValueError('message is too long (max 1000 characters)')
        return v.strip()

    @validator('history')
    def history_must_be_valid(cls, v):
        if len(v) > 20:
            raise ValueError('history too large')
        return v


# --- Middleware ---

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# --- Endpoints ---

@app.get("/")
async def root():
    return {"name": "Pathfinder AI", "version": "1.0.0", "status": "healthy"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model": "gemini-3-flash-preview",
        "cache_size": len(backend_cache),
        "api_key_configured": bool(api_key),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/generate-roadmap")
async def generate_roadmap(profile: UserProfile, _: str = Depends(require_rate_limit)):
    logger.info(f"Roadmap requested: '{profile.goal}' - {profile.level}")
    cache_key = f"{profile.goal.lower()}-{profile.level.lower()}"
    if cache_key in backend_cache:
        return backend_cache[cache_key]

    prompt = (
        f"Create a learning roadmap for a {profile.level} wanting to become a {profile.goal}. "
        f"Return ONLY a JSON array where each object has these fields: "
        f"'step_number' (integer), 'title' (string), 'description' (string - keep under 100 words), "
        f"'estimated_time' (string), and 'resources' (array of 2-3 strings with links or names). "
        f"Do not include markdown formatting like ```json. "
        f"Provide 6-8 clear, actionable steps."
    )

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=3000,
                temperature=0.7
            )
        )
        if not response.text:
            raise HTTPException(status_code=500, detail="Empty response from AI")
        roadmap_data = json.loads(response.text)
        if not isinstance(roadmap_data, list) or len(roadmap_data) == 0:
            raise HTTPException(status_code=500, detail="Invalid roadmap generated")
        add_to_cache(cache_key, roadmap_data)
        return roadmap_data
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")


@app.post("/get-step-details")
async def get_step_details(request_data: StepDetailRequest, client_ip: str = Depends(require_rate_limit)):
    cache_key = f"details_{request_data.goal}_{request_data.step_title}".lower().replace(" ", "_")
    if cache_key in backend_cache:
        logger.info(f"⚡ Cache hit: {cache_key}")
        return backend_cache[cache_key]

    prompt = f"""For learning "{request_data.step_title}" as part of becoming a {request_data.goal}, provide:

1. Three specific sub-tasks (each under 10 words)
2. Two common mistakes (each under 10 words)
3. YouTube search query (under 10 words)
4. Article search query (under 10 words)

Return JSON only:
{{
  "breakdown": ["task 1", "task 2", "task 3"],
  "mistakes": ["mistake 1", "mistake 2"],
  "resources": {{"youtube": "query", "article": "query"}}
}}"""

    try:
        logger.info(f"🔍 Getting details: {request_data.step_title}")
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=600,
                temperature=0.4
            )
        )
        if not response.text:
            raise Exception("Empty response")
        data = json.loads(response.text)
        if not isinstance(data.get('breakdown'), list) or not data['breakdown']:
            data['breakdown'] = [f"Study {request_data.step_title} basics", f"Practice {request_data.step_title}", f"Build projects with {request_data.step_title}"]
        if not isinstance(data.get('mistakes'), list) or not data['mistakes']:
            data['mistakes'] = ["Skipping fundamentals", "Not practicing enough"]
        if not isinstance(data.get('resources'), dict):
            data['resources'] = {"youtube": f"{request_data.step_title} tutorial", "article": f"learn {request_data.step_title}"}
        add_to_cache(cache_key, data)
        logger.info(f"✅ Got details for: {request_data.step_title}")
        return data
    except Exception as e:
        logger.error(f"Error getting details: {e}")
        return {
            "breakdown": [f"Learn {request_data.step_title} fundamentals", f"Practice with {request_data.step_title} exercises", f"Build projects using {request_data.step_title}"],
            "mistakes": ["Skipping the basics", "Not practicing regularly"],
            "resources": {"youtube": f"{request_data.step_title} tutorial for beginners", "article": f"complete {request_data.step_title} guide"}
        }


@app.post("/chat")
async def chat_tutor(chat_request: ChatRequest, client_ip: str = Depends(require_rate_limit)):
    try:
        logger.info(f"💬 Chat request from {client_ip}")
        chat = client.chats.create(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(
                system_instruction=f"You are a helpful tutor for {chat_request.context}. Give concise, practical answers.",
                temperature=0.7,
                max_output_tokens=500
            ),
            history=chat_request.history[-6:]
        )
        response = chat.send_message(chat_request.message)
        return {"reply": response.text}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service error")


@app.get("/cache/stats")
async def cache_stats():
    return {"total_entries": len(backend_cache), "max_size": MAX_CACHE_SIZE, "ttl_hours": CACHE_TTL_HOURS}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
