from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.sales import router as sales_router
from app.credits import router as credits_router
from app.bills import router as bills_router
from app.products import router as products_router
from app.assistant import router as assistant_router
from app.notifications import router as notifications_router
from app.auth import router as auth_router
from app.database import Base, engine
from app import models
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Kirana Made Easy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(sales_router)
app.include_router(credits_router)
app.include_router(bills_router)
app.include_router(notifications_router)
app.include_router(auth_router)
app.include_router(assistant_router)
@app.get("/")
def root():
    return {
        "message": "Kirana Made Easy backend is running 🚀",
        "status": "success"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}