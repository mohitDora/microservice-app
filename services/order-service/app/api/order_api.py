from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session

from database import get_session
from schemas.order_schema import OrderCreateSchema, OrderReadSchema, OrderUpdateSchema
from crud import order_crud
import logging

# Get a logger instance for this module
logger = logging.getLogger(__name__)

router = APIRouter()

# New dependency to get the user ID from the header
def get_user_id_from_header(x_user_id: UUID = Header(..., description="User ID provided by the API Gateway")):
    """
    FastAPI dependency to get the user ID from the 'x-user-id' header,
    which is set by the API Gateway after JWT validation.
    """
    return x_user_id

@router.post("/", response_model=OrderReadSchema, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_data: OrderCreateSchema,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_user_id_from_header) # Get user ID from header
):
    """
    Create a new order for the authenticated user.
    Assumes authentication is handled by a gateway.
    """
    logger.info(f"User {current_user_id} attempting to create a new order.")
    return order_crud.create_order(session, order_data, current_user_id)

@router.get("/", response_model=List[OrderReadSchema])
def read_all_orders_for_user(
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_user_id_from_header) # Get user ID from header
):
    """
    Retrieve all orders placed by the user identified in the request header.
    """
    logger.info(f"User {current_user_id} requesting all their orders.")
    orders = order_crud.get_all_orders_for_user(session, current_user_id)
    if not orders:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No orders found for this user."
        )
    return orders

@router.get("/{order_id}", response_model=OrderReadSchema)
def read_order_by_id(
    order_id: UUID,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_user_id_from_header) # Get user ID from header
):
    """
    Retrieve a specific order by its ID.
    """
    logger.info(f"User {current_user_id} requesting order with ID: {order_id}")
    order = order_crud.get_order_by_id(session, order_id, current_user_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you do not have permission to view this order."
        )
    return order

@router.put("/{order_id}", response_model=OrderReadSchema)
def update_existing_order(
    order_id: UUID,
    order_update_data: OrderUpdateSchema,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_user_id_from_header) # Get user ID from header
):
    """
    Update an existing order for the user.
    """
    logger.info(f"User {current_user_id} attempting to update order with ID: {order_id}")
    existing_order = order_crud.get_order_by_id(session, order_id, current_user_id)
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you do not have permission to update this order."
        )
    return order_crud.update_order(session, existing_order, order_update_data)

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_order(
    order_id: UUID,
    session: Session = Depends(get_session),
    current_user_id: UUID = Depends(get_user_id_from_header) # Get user ID from header
):
    """
    Delete an order for the user.
    """
    logger.info(f"User {current_user_id} attempting to delete order with ID: {order_id}")
    existing_order = order_crud.get_order_by_id(session, order_id, current_user_id)
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you do not have permission to delete this order."
        )
    order_crud.delete_order(session, existing_order)
    return {"message": "Order deleted successfully."}