from datetime import date, datetime, time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Antimoshka KZ CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_status(status: str) -> None:
    if status not in schemas.STATUSES:
        raise HTTPException(status_code=400, detail="Unknown deal status")


@app.get("/api/meta")
def meta():
    return {
        "statuses": schemas.STATUSES,
        "sources": schemas.SOURCES,
        "net_types": schemas.NET_TYPES,
    }


@app.post("/api/login", response_model=schemas.UserRead)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid login or password")
    return user


@app.get("/api/users", response_model=list[schemas.UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.id).all()


@app.get("/api/clients", response_model=list[schemas.ClientRead])
def list_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).order_by(models.Client.created_at.desc()).all()


@app.post("/api/clients", response_model=schemas.ClientRead)
def create_client(payload: schemas.ClientCreate, db: Session = Depends(get_db)):
    client = models.Client(**payload.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@app.put("/api/clients/{client_id}", response_model=schemas.ClientRead)
def update_client(client_id: int, payload: schemas.ClientUpdate, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    for key, value in payload.model_dump().items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


@app.delete("/api/clients/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"ok": True}


@app.get("/api/clients/{client_id}/card", response_model=schemas.ClientCard)
def client_card(client_id: int, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    deals = (
        db.query(models.Deal)
        .options(joinedload(models.Deal.client))
        .filter(models.Deal.client_id == client_id)
        .order_by(models.Deal.created_at.desc())
        .all()
    )
    deal_ids = [deal.id for deal in deals]
    tasks = []
    history = []
    if deal_ids:
        tasks = (
            db.query(models.Task)
            .options(joinedload(models.Task.manager))
            .filter(models.Task.deal_id.in_(deal_ids))
            .all()
        )
        history = (
            db.query(models.StatusHistory)
            .filter(models.StatusHistory.deal_id.in_(deal_ids))
            .order_by(models.StatusHistory.changed_at.desc())
            .all()
        )
    return {"client": client, "deals": deals, "tasks": tasks, "history": history}


@app.get("/api/deals", response_model=list[schemas.DealRead])
def list_deals(db: Session = Depends(get_db)):
    return (
        db.query(models.Deal)
        .options(joinedload(models.Deal.client))
        .order_by(models.Deal.created_at.desc())
        .all()
    )


@app.post("/api/deals", response_model=schemas.DealRead)
def create_deal(payload: schemas.DealCreate, db: Session = Depends(get_db)):
    ensure_status(payload.status)
    if not db.get(models.Client, payload.client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    deal = models.Deal(**payload.model_dump())
    db.add(deal)
    db.flush()
    db.add(models.StatusHistory(deal_id=deal.id, old_status=None, new_status=deal.status, comment="Создана сделка"))
    db.commit()
    db.refresh(deal)
    return (
        db.query(models.Deal)
        .options(joinedload(models.Deal.client))
        .filter(models.Deal.id == deal.id)
        .one()
    )


@app.put("/api/deals/{deal_id}", response_model=schemas.DealRead)
def update_deal(deal_id: int, payload: schemas.DealUpdate, db: Session = Depends(get_db)):
    ensure_status(payload.status)
    deal = db.get(models.Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    old_status = deal.status
    for key, value in payload.model_dump().items():
        setattr(deal, key, value)
    if old_status != deal.status:
        db.add(models.StatusHistory(deal_id=deal.id, old_status=old_status, new_status=deal.status, comment="Статус изменен"))
    db.commit()
    return (
        db.query(models.Deal)
        .options(joinedload(models.Deal.client))
        .filter(models.Deal.id == deal.id)
        .one()
    )


@app.patch("/api/deals/{deal_id}/status", response_model=schemas.DealRead)
def update_deal_status(deal_id: int, payload: schemas.DealStatusUpdate, db: Session = Depends(get_db)):
    ensure_status(payload.status)
    deal = db.get(models.Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    old_status = deal.status
    deal.status = payload.status
    if old_status != payload.status:
        db.add(models.StatusHistory(deal_id=deal.id, old_status=old_status, new_status=payload.status, comment=payload.comment))
    db.commit()
    return (
        db.query(models.Deal)
        .options(joinedload(models.Deal.client))
        .filter(models.Deal.id == deal.id)
        .one()
    )


@app.delete("/api/deals/{deal_id}")
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.get(models.Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"ok": True}


@app.get("/api/tasks", response_model=list[schemas.TaskRead])
def list_tasks(db: Session = Depends(get_db)):
    return (
        db.query(models.Task)
        .options(joinedload(models.Task.manager), joinedload(models.Task.deal).joinedload(models.Deal.client))
        .order_by(models.Task.id.desc())
        .all()
    )


@app.post("/api/tasks", response_model=schemas.TaskRead)
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    if not db.get(models.Deal, payload.deal_id):
        raise HTTPException(status_code=404, detail="Deal not found")
    if not db.get(models.User, payload.manager_id):
        raise HTTPException(status_code=404, detail="Manager not found")
    task = models.Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return (
        db.query(models.Task)
        .options(joinedload(models.Task.manager), joinedload(models.Task.deal).joinedload(models.Deal.client))
        .filter(models.Task.id == task.id)
        .one()
    )


@app.put("/api/tasks/{task_id}", response_model=schemas.TaskRead)
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in payload.model_dump().items():
        setattr(task, key, value)
    db.commit()
    return (
        db.query(models.Task)
        .options(joinedload(models.Task.manager), joinedload(models.Task.deal).joinedload(models.Deal.client))
        .filter(models.Task.id == task.id)
        .one()
    )


@app.get("/api/status-history", response_model=list[schemas.StatusHistoryRead])
def list_status_history(db: Session = Depends(get_db)):
    return db.query(models.StatusHistory).order_by(models.StatusHistory.changed_at.desc()).all()


@app.get("/api/dashboard", response_model=schemas.DashboardRead)
def dashboard(db: Session = Depends(get_db)):
    today = date.today()
    month_start = datetime.combine(today.replace(day=1), time.min)
    completed_status = "Завершено"
    refused_status = "Отказ"

    total_clients = db.query(models.Client).count()
    total_deals = db.query(models.Deal).count()
    today_leads = db.query(models.Deal).filter(func.date(models.Deal.created_at) == today.isoformat()).count()
    active_deals = db.query(models.Deal).filter(~models.Deal.status.in_([completed_status, refused_status])).count()
    completed_deals = db.query(models.Deal).filter(models.Deal.status == completed_status).count()
    measurements_today = db.query(models.Task).filter(models.Task.measurement_date == today).count()
    installations_today = db.query(models.Task).filter(models.Task.installation_date == today).count()
    monthly_sales = (
        db.query(func.coalesce(func.sum(models.Deal.amount), 0))
        .filter(models.Deal.status == completed_status, models.Deal.created_at >= month_start)
        .scalar()
    )
    sales_conversion = round((completed_deals / total_deals) * 100, 1) if total_deals else 0
    return {
        "total_clients": total_clients,
        "total_deals": total_deals,
        "total_leads": total_deals,
        "today_leads": today_leads,
        "active_deals": active_deals,
        "completed_deals": completed_deals,
        "completed_orders": completed_deals,
        "measurements_today": measurements_today,
        "installations_today": installations_today,
        "monthly_sales": monthly_sales,
        "sales_amount": monthly_sales,
        "sales_conversion": sales_conversion,
        "conversion": sales_conversion,
    }
