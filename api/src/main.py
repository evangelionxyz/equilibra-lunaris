import sys
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from routers import auth, github, meetings, tasks

sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.database.database import router as db_router, create_pool, close_pool
from services.database import users as _db_users
from services.database import projects as _db_projects
from services.database import buckets as _db_buckets
from services.database import tasks as _db_tasks
from services.database import project_member as _db_project_member
from services.database import alerts as _db_alerts
from services.database import activities as _db_activities
from services.database import meetings as _db_meetings

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create the DB pool on startup and close it on shutdown."""
    create_pool()
    yield
    close_pool()

app = FastAPI(title="Lunaris API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Message": "FastAPI is running!"}

app.include_router(auth.router)
app.include_router(github.router)
app.include_router(db_router)
app.include_router(meetings.router)
app.include_router(tasks.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, log_level="debug")
