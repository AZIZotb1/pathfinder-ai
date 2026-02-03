import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI(title="Pathfinder AI - Optimized Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# --- LAYER 1: BACKEND MEMORY CACHE ---
# This dictionary stores generated roadmaps in the server's RAM.
# It resets if you restart the python script.
backend_cache = {}

class UserProfile(BaseModel):
    goal: str
    level: str

@app.post("/generate-roadmap")
async def generate_roadmap(profile: UserProfile):
    # 1. Create a unique ID for this request (e.g., "doctor-beginner")
    cache_key = f"{profile.goal.strip().lower()}-{profile.level.lower()}"

    # 2. Check if we already have this roadmap in memory
    if cache_key in backend_cache:
        logger.info(f"⚡ CACHE HIT: Serving {cache_key} from memory.")
        return {"roadmap": backend_cache[cache_key], "from_cache": True}

    prompt = (
        f"Act as an expert career coach. Create a highly detailed, 5-step learning roadmap "
        f"for a student who wants to become a {profile.goal}. "
        f"Their current level is {profile.level}. "
        f"Provide specific resources, projects, and skills for each step."
    )
    
    try:
        # 3. Call Gemini if not in cache
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_level="high"),
                max_output_tokens=2000 # SAFETY LIMIT: Prevents massive unexpected costs
            )
        )
        
        # 4. Save the result to cache before returning
        backend_cache[cache_key] = response.text
        return {"roadmap": response.text, "from_cache": False}
        
    except Exception as e:
        logger.error(f"Gemini 3 API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Gemini 3 is currently unavailable.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)