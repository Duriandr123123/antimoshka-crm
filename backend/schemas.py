from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


STATUSES = [
    "Новая заявка",
    "Связались",
    "Назначен замер",
    "Замер выполнен",
    "Ожидает оплаты",
    "В работе",
    "Монтаж",
    "Завершено",
    "Отказ",
]

SOURCES = ["Instagram", "WhatsApp", "Рекомендация", "Другое"]
NET_TYPES = ["Обычная", "2 в 1", "Антимошка", "Другое"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    full_name: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ClientBase(BaseModel):
    name: str
    phone: str
    address: str
    source: str
    comment: str = ""


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class DealBase(BaseModel):
    client_id: int
    net_type: str
    windows_count: int
    amount: float
    comment: str = ""


class DealCreate(DealBase):
    status: str = "Новая заявка"


class DealUpdate(DealBase):
    status: str


class DealStatusUpdate(BaseModel):
    status: str
    comment: str = ""


class DealRead(DealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    client: ClientRead


class TaskBase(BaseModel):
    deal_id: int
    manager_id: int
    measurement_date: date | None = None
    installation_date: date | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskRead(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manager: UserRead
    deal: DealRead


class StatusHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    deal_id: int
    old_status: str | None
    new_status: str
    comment: str
    changed_at: datetime


class ClientCard(BaseModel):
    client: ClientRead
    deals: list[DealRead]
    tasks: list[TaskRead]
    history: list[StatusHistoryRead]


class DashboardRead(BaseModel):
    total_clients: int
    total_deals: int
    total_leads: int
    today_leads: int
    active_deals: int
    completed_deals: int
    completed_orders: int
    measurements_today: int
    installations_today: int
    monthly_sales: float
    sales_amount: float
    sales_conversion: float
    conversion: float
