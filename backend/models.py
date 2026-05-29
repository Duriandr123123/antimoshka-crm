from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), default="manager")
    full_name: Mapped[str] = mapped_column(String(100))

    tasks: Mapped[list["Task"]] = relationship(back_populates="manager")


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    phone: Mapped[str] = mapped_column(String(40), index=True)
    address: Mapped[str] = mapped_column(String(255))
    source: Mapped[str] = mapped_column(String(40))
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    deals: Mapped[list["Deal"]] = relationship(back_populates="client", cascade="all, delete-orphan")


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    net_type: Mapped[str] = mapped_column(String(40))
    windows_count: Mapped[int] = mapped_column(Integer)
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(40), index=True, default="Новая заявка")
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped[Client] = relationship(back_populates="deals")
    tasks: Mapped[list["Task"]] = relationship(back_populates="deal", cascade="all, delete-orphan")
    history: Mapped[list["StatusHistory"]] = relationship(back_populates="deal", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"))
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    measurement_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    installation_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    deal: Mapped[Deal] = relationship(back_populates="tasks")
    manager: Mapped[User] = relationship(back_populates="tasks")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    deal_id: Mapped[int] = mapped_column(ForeignKey("deals.id"))
    old_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    new_status: Mapped[str] = mapped_column(String(40))
    comment: Mapped[str] = mapped_column(Text, default="")
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    deal: Mapped[Deal] = relationship(back_populates="history")
