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
@app.get("/teams")
def get_all_teams(db: Session = Depends(get_db)):
    teams = db.query(models.Team).all()
    return teams


# -----------------------
# Audience Schema
# -----------------------
class AudienceCreate(BaseModel):
    name: str
    branch: str
    year: int


# -----------------------
# Create Audience API
# -----------------------
@app.post("/audience")
def create_audience(audience: AudienceCreate, db: Session = Depends(get_db)):

    new_audience = models.Audience(
        name=audience.name,
        branch=audience.branch,
        year=audience.year,
        credits=0
    )

    db.add(new_audience)
    db.commit()
    db.refresh(new_audience)

    return {
        "id": new_audience.id,
        "name": new_audience.name,
        "credits": new_audience.credits
    }
# -----------------------
# Transfer Schema
# -----------------------
class TransferRequest(BaseModel):
    team_id: int
    audience_id: int
    amount: int
# -----------------------
# Transfer Tokens API
# -----------------------
@app.post("/transfer")
def transfer_tokens(request: TransferRequest, db: Session = Depends(get_db)):

    # Find team
    team = db.query(models.Team).filter(models.Team.id == request.team_id).first()

    # Find audience
    audience = db.query(models.Audience).filter(models.Audience.id == request.audience_id).first()

    if not team:
        return {"error": "Team not found"}

    if not audience:
        return {"error": "Audience not found"}

    if request.amount <= 0:
        return {"error": "Transfer amount must be positive"}

    if team.credits < request.amount:
        return {"error": "Insufficient team credits"}

    # Deduct tokens from team
    team.credits -= request.amount

    # Add tokens to audience
    audience.credits += request.amount

    db.commit()

    return {
        "message": "Transfer successful",
        "team_balance": team.credits,
        "audience_balance": audience.credits
    }
# -----------------------
# Reward Schema
# -----------------------
class RewardRequest(BaseModel):
    team_id: int
    amount: int
# -----------------------
# Reward Team API
# -----------------------
@app.post("/reward")
def reward_team(request: RewardRequest, db: Session = Depends(get_db)):

    team = db.query(models.Team).filter(models.Team.id == request.team_id).first()

    if not team:
        return {"error": "Team not found"}

    if request.amount <= 0:
        return {"error": "Reward amount must be positive"}

    team.credits += request.amount

    db.commit()

    return {
        "message": "Reward added",
        "team": team.name,
        "new_balance": team.credits
    }
# -----------------------
# Leaderboard API
# -----------------------
@app.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    
    teams = (
        db.query(models.Team)
        .order_by(models.Team.credits.desc())
        .all()
    )

    return teams