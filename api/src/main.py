import sys
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
from fastapi import FastAPI
from routers import auth, github
from database import router as db_router, create_pool, close_pool

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create the DB pool on startup and close it on shutdown."""
    # create_pool is synchronous (psycopg2); call it on startup
    create_pool()
    yield
    close_pool()


app = FastAPI(title="Lunaris API", version="0.1.0", lifespan=lifespan)
@app.get("/")
def read_root():
    return {"Message": "FastAPI is running!"}

app.include_router(auth.router)
app.include_router(github.router)
app.include_router(db_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, log_level="debug")
