from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class OrderItemSchema(BaseModel):
    product_id: UUID
    name: str
    quantity: int = Field(gt=0, description="Quantity must be greater than zero")
    price: float = Field(gt=0, description="Price must be greater than zero")


class OrderCreateSchema(BaseModel):
    items: List[OrderItemSchema] = Field(
        ..., min_length=1, description="List of items in the order"
    )
    total_amount: float = Field(
        ..., gt=0, description="Total amount must be greater than zero"
    )
    status: str = Field("pending", max_length=50)


class OrderUpdateSchema(BaseModel):
    items: Optional[List[OrderItemSchema]] = Field(
        None, min_length=1, description="List of items in the order"
    )
    total_amount: Optional[float] = Field(
        None, gt=0, description="Total amount must be greater than zero"
    )
    status: Optional[str] = Field(None, max_length=50)


class OrderReadSchema(BaseModel):
    id: UUID
    user_id: UUID
    items: List[OrderItemSchema]
    total_amount: float
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
