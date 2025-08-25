from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from sqlmodel import Field, SQLModel, JSON


class OrderItem(SQLModel):
    product_id: UUID
    name: str
    quantity: int
    price: float


class OrderBase(SQLModel):
    user_id: UUID = Field(index=True)
    items: List[OrderItem] = Field(
        default_factory=list, sa_column_kwargs={"type": JSON}
    )
    total_amount: float
    status: str = Field(default="pending", max_length=50)


class OrderCreate(OrderBase):
    pass


class OrderRead(OrderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class Order(OrderBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
