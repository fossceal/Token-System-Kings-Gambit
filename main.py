print("MAIN FILE LOADED")

from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import engine, Base, SessionLocal
import models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Quiz Token System")


# -----------------------
# Database Dependency
# -----------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------
# Home Route
# -----------------------
@app.get("/")
def home():
    return {"message": "Quiz Token System Running"}


# -----------------------
# Team Schema
# -----------------------
class TeamCreate(BaseModel):
    name: str
    branch: str
    year: int
    initial_credits: int


# -----------------------
# Create Team API
# -----------------------
@app.post("/teams")
def create_team(team: TeamCreate, db: Session = Depends(get_db)):

    new_team = models.Team(
        name=team.name,
        branch=team.branch,
        year=team.year,
        credits=team.initial_credits
    )

    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    return {
        "id": new_team.id,
        "name": new_team.name,
        "credits": new_team.credits
    }