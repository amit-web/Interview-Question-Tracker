from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import json
import io
import csv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Later replace * with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('user_id')
    user = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    streak_count: int = 0
    last_revision_date: Optional[str] = None

class Question(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    question: str
    ideal_answer: str
    status: str = "Not Started"  # Not Started, In Progress, Revised, Strong
    notes: str = ""
    mistakes_count: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_revised_at: Optional[str] = None

class QuestionCreate(BaseModel):
    category: str
    question: str
    ideal_answer: str
    status: str = "Not Started"
    notes: str = ""
    mistakes_count: int = 0

class QuestionUpdate(BaseModel):
    category: Optional[str] = None
    question: Optional[str] = None
    ideal_answer: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    mistakes_count: Optional[int] = None
    last_revised_at: Optional[str] = None

class RevisionScore(BaseModel):
    question: Question
    score: float

class CategoryProgress(BaseModel):
    category: str
    total: int
    not_started: int
    in_progress: int
    revised: int
    strong: int

# Health Check Route
@api_router.get("/")
async def root():
    return {"message": "Interview Prep Tracker API", "status": "running"}

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing_user:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token(user.id)
    
    return {
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'streak_count': user.streak_count
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    
    token = create_access_token(user['id'])
    
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'streak_count': user.get('streak_count', 0)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        'id': current_user['id'],
        'email': current_user['email'],
        'name': current_user['name'],
        'streak_count': current_user.get('streak_count', 0),
        'last_revision_date': current_user.get('last_revision_date')
    }

# Question Routes
@api_router.post("/questions", response_model=Question)
async def create_question(question_data: QuestionCreate, current_user: dict = Depends(get_current_user)):
    question = Question(
        user_id=current_user['id'],
        **question_data.model_dump()
    )
    
    question_dict = question.model_dump()
    await db.questions.insert_one(question_dict)
    
    return question

@api_router.get("/questions", response_model=List[Question])
async def get_questions(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {'user_id': current_user['id']}
    
    if category:
        query['category'] = category
    
    if status:
        query['status'] = status
    
    if search:
        query['$or'] = [
            {'question': {'$regex': search, '$options': 'i'}},
            {'ideal_answer': {'$regex': search, '$options': 'i'}},
            {'notes': {'$regex': search, '$options': 'i'}}
        ]
    
    questions = await db.questions.find(query, {'_id': 0}).to_list(1000)
    return questions

@api_router.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: str, current_user: dict = Depends(get_current_user)):
    question = await db.questions.find_one({'id': question_id, 'user_id': current_user['id']}, {'_id': 0})
    if not question:
        raise HTTPException(status_code=404, detail='Question not found')
    return question

@api_router.put("/questions/{question_id}", response_model=Question)
async def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Check if question exists
    existing_question = await db.questions.find_one({'id': question_id, 'user_id': current_user['id']}, {'_id': 0})
    if not existing_question:
        raise HTTPException(status_code=404, detail='Question not found')
    
    # Update only provided fields
    update_data = {k: v for k, v in question_update.model_dump().items() if v is not None}
    
    if update_data:
        await db.questions.update_one(
            {'id': question_id, 'user_id': current_user['id']},
            {'$set': update_data}
        )
    
    updated_question = await db.questions.find_one({'id': question_id}, {'_id': 0})
    return updated_question

@api_router.delete("/questions/{question_id}")
async def delete_question(question_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.questions.delete_one({'id': question_id, 'user_id': current_user['id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Question not found')
    return {'message': 'Question deleted successfully'}

# Smart Revision Routes
@api_router.get("/questions/smart-revision/list", response_model=List[Question])
async def get_smart_revision_list(current_user: dict = Depends(get_current_user)):
    questions = await db.questions.find({'user_id': current_user['id']}, {'_id': 0}).to_list(1000)
    
    # Calculate score for each question
    scored_questions = []
    for q in questions:
        score = calculate_revision_score(q)
        scored_questions.append({'question': q, 'score': score})
    
    # Sort by score (descending) - higher score = needs more revision
    scored_questions.sort(key=lambda x: x['score'], reverse=True)
    
    # Return just the questions
    return [item['question'] for item in scored_questions]

def calculate_revision_score(question: dict) -> float:
    """Calculate revision priority score based on mistakes, status, and time."""
    
    # Mistake weight
    mistakes_score = question.get('mistakes_count', 0) * 10
    
    # Status weight
    status_weights = {
        'Not Started': 30,
        'In Progress': 20,
        'Revised': 10,
        'Strong': 0
    }
    status_score = status_weights.get(question.get('status', 'Not Started'), 30)
    
    # Time since last revision
    time_score = 0
    last_revised = question.get('last_revised_at')
    if last_revised:
        try:
            last_revised_date = datetime.fromisoformat(last_revised)
            days_since = (datetime.now(timezone.utc) - last_revised_date).days
            time_score = days_since * 5
        except:
            time_score = 0
    else:
        # Never revised
        time_score = 100
    
    return mistakes_score + status_score + time_score

# Category Progress Routes
@api_router.get("/progress/categories", response_model=List[CategoryProgress])
async def get_category_progress(current_user: dict = Depends(get_current_user)):
    questions = await db.questions.find({'user_id': current_user['id']}, {'_id': 0}).to_list(1000)
    
    # Hardcoded categories
    categories = ['JavaScript', 'React', 'Redux', 'DSA', 'Debugging', 'Production Issues']
    
    progress = []
    for category in categories:
        category_questions = [q for q in questions if q['category'] == category]
        
        progress.append(CategoryProgress(
            category=category,
            total=len(category_questions),
            not_started=len([q for q in category_questions if q['status'] == 'Not Started']),
            in_progress=len([q for q in category_questions if q['status'] == 'In Progress']),
            revised=len([q for q in category_questions if q['status'] == 'Revised']),
            strong=len([q for q in category_questions if q['status'] == 'Strong'])
        ))
    
    return progress

# Streak Routes
@api_router.post("/streak/update")
async def update_streak(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    last_revision_date = current_user.get('last_revision_date')
    
    streak_count = current_user.get('streak_count', 0)
    
    if last_revision_date:
        last_date = datetime.fromisoformat(last_revision_date).date()
        today_date = datetime.now(timezone.utc).date()
        
        days_diff = (today_date - last_date).days
        
        if days_diff == 0:
            # Same day, no change
            pass
        elif days_diff == 1:
            # Consecutive day, increment
            streak_count += 1
        else:
            # Streak broken, reset
            streak_count = 1
    else:
        # First revision
        streak_count = 1
    
    await db.users.update_one(
        {'id': current_user['id']},
        {'$set': {'streak_count': streak_count, 'last_revision_date': today}}
    )
    
    return {'streak_count': streak_count, 'last_revision_date': today}

# Export/Import Routes
@api_router.get("/export/json")
async def export_json(current_user: dict = Depends(get_current_user)):
    questions = await db.questions.find({'user_id': current_user['id']}, {'_id': 0}).to_list(1000)
    return {'questions': questions}

@api_router.post("/import/json")
async def import_json(data: dict, current_user: dict = Depends(get_current_user)):
    questions = data.get('questions', [])
    
    imported_count = 0
    for q in questions:
        # Create new question with new ID and current user
        question = Question(
            user_id=current_user['id'],
            category=q.get('category', 'JavaScript'),
            question=q.get('question', ''),
            ideal_answer=q.get('ideal_answer', ''),
            status=q.get('status', 'Not Started'),
            notes=q.get('notes', ''),
            mistakes_count=q.get('mistakes_count', 0)
        )
        
        await db.questions.insert_one(question.model_dump())
        imported_count += 1
    
    return {'message': f'{imported_count} questions imported successfully'}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
