# models.py

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    branch = Column(String)
    year = Column(Integer)
    credits = Column(Integer, default=0)


class Audience(Base):
    __tablename__ = "audience"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    branch = Column(String)
    year = Column(Integer)
    credits = Column(Integer, default=0)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    audience_id = Column(Integer, ForeignKey("audience.id"), nullable=True)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
