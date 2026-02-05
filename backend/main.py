import os
import logging
import json
import re
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, validator
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types
from datetime import datetime, timedelta

# 1. Load environment variables
load_dotenv()

# 2. Initialize the App
app = FastAPI(title="Pathfinder AI - Gemini 3 Flash Edition")

# 3. Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Configure Gemini AI
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("No GEMINI_API_KEY found in .env file")

client = genai.Client(api_key=api_key)

# 5. Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# 6. Enhanced In-Memory Cache with TTL
backend_cache = {}
cache_timestamps = {}
MAX_CACHE_SIZE = 100
CACHE_TTL_HOURS = 24

def clean_old_cache():
    """Remove expired cache entries"""
    current_time = datetime.now()
    expired_keys = [
        key for key, timestamp in cache_timestamps.items()
        if current_time - timestamp > timedelta(hours=CACHE_TTL_HOURS)
    ]
    for key in expired_keys:
        backend_cache.pop(key, None)
        cache_timestamps.pop(key, None)
    if expired_keys:
        logger.info(f"Cleaned {len(expired_keys)} expired cache entries")

def add_to_cache(key, value):
    """Add to cache with size limit"""
    clean_old_cache()
    if len(backend_cache) >= MAX_CACHE_SIZE:
        # Remove oldest entry
        oldest_key = min(cache_timestamps, key=cache_timestamps.get)
        backend_cache.pop(oldest_key, None)
        cache_timestamps.pop(oldest_key, None)
        logger.info(f"Cache full, removed oldest entry: {oldest_key}")
    
    backend_cache[key] = value
    cache_timestamps[key] = datetime.now()

def validate_career_goal_enhanced(goal: str) -> tuple:
    """
    Enhanced validation that detects sentences and irrelevant input
    Returns (is_valid, error_message)
    """
    
    # 1. Check if empty
    if not goal or not goal.strip():
        return False, "Goal cannot be empty"
    
    goal = goal.strip()
    
    # 2. Length checks
    if len(goal) < 3:
        return False, "Goal is too short (minimum 3 characters)"
    
    if len(goal) > 200:
        return False, "Goal is too long (maximum 200 characters)"
    
    # 3. Must contain at least some letters
    if not re.search(r'[a-zA-Z]', goal):
        return False, "Goal must contain letters"
    
    # 4. Check for gibberish (7+ consonants in a row)
    if re.search(r'[bcdfghjklmnpqrstvwxyz]{7,}', goal, re.IGNORECASE):
        return False, "Please enter a real career goal (e.g., 'Software Developer', 'Data Scientist')"
    
    # 5. Just numbers
    if goal.isdigit():
        return False, "Please enter a career name, not just numbers"
    
    # 6. Repeated characters (spam like "aaaaaaa")
    if re.search(r'(.)\1{5,}', goal):
        return False, "Please enter a valid career goal"
    
    # 7. Common nonsense patterns
    nonsense_patterns = [
        r'^test$',
        r'^asdf',
        r'^qwerty',
        r'^[xyz]+$',
        r'^lol+$',
        r'^haha+$',
        r'^ok+$',
        r'^blah',
        r'^aaa+$',
    ]
    
    for pattern in nonsense_patterns:
        if re.search(pattern, goal, re.IGNORECASE):
            return False, "Please enter a real career goal (e.g., 'Web Developer', 'Marketing Manager')"
    
    # 8. NEW: Check for sentence indicators (not a job title)
    sentence_indicators = [
        r'\bi am\b',
        r"\bi'm\b",
        r'\bi want\b',
        r'\bthis is\b',
        r'\bi think\b',
        r"\bi don't\b",
        r'\bi dont\b',
        r'\bhow to\b',
        r'\bwhat is\b',
        r'\bcan you\b',
        r'\bhelp me\b',
        r'\bplease\b',
        r'\btesting\b',
        r'\bjust testing\b',
        r'\btest test\b',
    ]
    
    for pattern in sentence_indicators:
        if re.search(pattern, goal, re.IGNORECASE):
            return False, "Please enter just the career title (e.g., 'Data Scientist' not 'I want to be a Data Scientist')"
    
    # 9. NEW: Check if it's a complete sentence (has verb patterns)
    verb_patterns = [
        r'\b(doing|trying|working|learning|studying|testing|checking)\b',
        r'\b(know|understand|figure|wonder)\b',
    ]
    
    for pattern in verb_patterns:
        if re.search(pattern, goal, re.IGNORECASE):
            return False, "Please enter a career title, not a sentence (e.g., 'Software Engineer', 'Product Manager')"
    
    # 10. Word count check
    word_count = len(goal.split())
    if word_count > 10:
        return False, "Please enter a career title, not a full sentence"
    
    # 11. NEW: More than 6 words is likely a sentence
    if word_count > 6:
        return False, "Career titles are usually 1-4 words (e.g., 'Machine Learning Engineer', 'UX Designer')"
    
    # 12. Invalid punctuation
    if re.search(r'[?!;]', goal):
        return False, "Please enter a career title without question marks or semicolons"
    
    # 13. NEW: Check for filler words (indicates sentence, not title)
    filler_patterns = [
        r'\ba\b',  # "a test"
        r'\bthe\b', # "the thing"
        r'\bmy\b',  # "my goal"
        r'\byour\b', # "your app"
        r'\bsome\b', # "some job"
        r'\bthat\b', # "that thing"
        r'\bwhat\b', # "what career"
    ]
    
    filler_count = 0
    for pattern in filler_patterns:
        if re.search(pattern, goal, re.IGNORECASE):
            filler_count += 1
    
    # If more than 2 filler words, it's probably a sentence
    if filler_count >= 2:
        return False, "Please enter just the job title (e.g., 'Data Scientist', 'Web Developer')"
    
    # All checks passed
    return True, ""

# 7. Define the Data Model with Enhanced Validation
class UserProfile(BaseModel):
    goal: str
    level: str
    
    @validator('goal')
    def goal_must_be_valid(cls, v):
        # Basic Pydantic validation
        if not v.strip():
            raise ValueError('Goal cannot be empty')
        if len(v) > 200:
            raise ValueError('Goal is too long (max 200 characters)')
        
        # Enhanced validation
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

# 8. Health Check Endpoint
@app.get("/health")
async def health_check():
    """Check if the API is running and configured correctly"""
    return {
        "status": "healthy",
        "model": "gemini-3-flash-preview",
        "cache_size": len(backend_cache),
        "api_key_configured": bool(api_key),
        "timestamp": datetime.now().isoformat()
    }

# 9. The Main API Endpoint (WITH ENHANCED VALIDATION)
@app.post("/generate-roadmap")
async def generate_roadmap(profile: UserProfile, request: Request):
    """Generate a personalized learning roadmap using Gemini 3 Flash AI"""
    
    # Get client IP for logging
    client_ip = request.client.host
    
    # Create a unique key for caching
    cache_key = f"{profile.goal.strip().lower()}-{profile.level.lower()}"

    # Check Cache First
    if cache_key in backend_cache:
        logger.info(f"⚡ CACHE HIT: {cache_key} from {client_ip}")
        return backend_cache[cache_key]

    # The Prompt
    prompt = (
        f"Create a learning roadmap for a {profile.level} wanting to become a {profile.goal}. "
        f"Return ONLY a JSON array where each object has these fields: "
        f"'step_number' (integer), 'title' (string), 'description' (string), "
        f"'estimated_time' (string), and 'resources' (array of strings with links or names). "
        f"Do not include markdown formatting like ```json. "
        f"Provide 6-8 clear, actionable steps."
    )
    
    try:
        logger.info(f"🤖 Generating roadmap: {profile.goal} ({profile.level}) from {client_ip}")
        
        # Call Gemini 3 Flash Preview
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json", 
                max_output_tokens=2000
            )
        )
        
        # Validate response
        if not response.text:
            logger.error("Empty response from Gemini API")
            raise HTTPException(
                status_code=500, 
                detail="Empty response from AI service. Please try a different career goal."
            )
        
        # Parse the response
        roadmap_data = json.loads(response.text)
        
        # Validate structure
        if not isinstance(roadmap_data, list):
            logger.error(f"Invalid response format: {type(roadmap_data)}")
            raise HTTPException(
                status_code=500, 
                detail="Invalid response format from AI. Please try again."
            )
        
        if len(roadmap_data) == 0:
            logger.warning("Empty roadmap generated")
            raise HTTPException(
                status_code=500, 
                detail="No roadmap steps generated. Please try a different career goal."
            )
        
        # Save to cache using the new function
        add_to_cache(cache_key, roadmap_data)
        logger.info(f"✅ Successfully generated roadmap with {len(roadmap_data)} steps")
        
        return roadmap_data
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error: {str(e)}")
        logger.error(f"Response text: {response.text[:200] if response.text else 'No text'}")
        raise HTTPException(
            status_code=500, 
            detail="Failed to parse AI response. Please try again."
        )
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"Gemini API Error: {str(e)}")
        
        # Check if it's a safety/policy violation
        if any(word in error_msg for word in ['safety', 'policy', 'blocked', 'harmful', 'inappropriate']):
            raise HTTPException(
                status_code=400,
                detail="This career goal violates our content policy. Please enter a legal and ethical career path."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"AI service error: {str(e)}"
            )

# 10. Test Connection Endpoint
@app.get("/test-connection")
async def test_connection():
    """Test the connection to Gemini API"""
    try:
        # Test the connection by listing available models
        models = client.models.list_models()
        model_names = [m.name for m in models]
        return {
            "status": "success",
            "message": "Successfully connected to Gemini API",
            "available_models": model_names[:10],
            "using_model": "gemini-3-flash-preview"
        }
    except Exception as e:
        logger.error(f"Connection Test Failed: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to connect to Gemini API: {str(e)}"
        )

# 11. Cache Management Endpoints
@app.get("/cache/stats")
async def cache_stats():
    """Get cache statistics"""
    return {
        "total_entries": len(backend_cache),
        "max_size": MAX_CACHE_SIZE,
        "ttl_hours": CACHE_TTL_HOURS,
        "oldest_entry": min(cache_timestamps.values()).isoformat() if cache_timestamps else None,
        "newest_entry": max(cache_timestamps.values()).isoformat() if cache_timestamps else None
    }

@app.delete("/cache/clear")
async def clear_cache():
    """Clear all cache entries"""
    global backend_cache, cache_timestamps
    count = len(backend_cache)
    backend_cache.clear()
    cache_timestamps.clear()
    logger.info(f"🗑️ Cache cleared: {count} entries removed")
    return {"message": "Cache cleared successfully", "entries_removed": count}

# 12. The Start Button
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
