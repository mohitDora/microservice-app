from typing import List, Optional
from uuid import UUID
from sqlmodel import Session, select
from models.order_model import Order, OrderCreate, OrderUpdate
from schemas.order_schema import OrderReadSchema
import logging

logger = logging.getLogger(__name__)

def create_order(session: Session, order_data: OrderCreate, user_id: UUID) -> Order:
    """
    Creates a new order in the database.
    Args:
        session: The database session.
        order_data: The order data from the request body.
        user_id: The ID of the user creating the order (from JWT).
    Returns:
        The newly created Order object.
    """
    db_order = Order.model_validate(order_data, update={"user_id": user_id})
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    logger.info(f"Order created with ID: {db_order.id} for User: {user_id}")
    return db_order

def get_order_by_id(session: Session, order_id: UUID, user_id: UUID) -> Optional[Order]:
    """
    Retrieves a single order by its ID, ensuring it belongs to the authenticated user.
    Args:
        session: The database session.
        order_id: The UUID of the order to retrieve.
        user_id: The ID of the authenticated user.
    Returns:
        The Order object if found and belongs to the user, otherwise None.
    """
    statement = select(Order).where(Order.id == order_id, Order.user_id == user_id)
    order = session.exec(statement).first()
    return order

def get_all_orders_for_user(session: Session, user_id: UUID) -> List[Order]:
    """
    Retrieves all orders for a specific user.
    Args:
        session: The database session.
        user_id: The ID of the user.
    Returns:
        A list of Order objects belonging to the user.
    """
    statement = select(Order).where(Order.user_id == user_id)
    orders = session.exec(statement).all()
    return orders

def update_order(session: Session, order: Order, order_update_data: OrderUpdate) -> Order:
    """
    Updates an existing order in the database.
    Args:
        session: The database session.
        order: The existing Order object to update.
        order_update_data: The updated order data from the request body.
    Returns:
        The updated Order object.
    """
    updated_order = order_update_data.model_dump(exclude_unset=True)
    for key, value in updated_order.items():
        setattr(order, key, value)
    session.add(order)
    session.commit()
    session.refresh(order)
    logger.info(f"Order with ID: {order.id} updated.")
    return order

def delete_order(session: Session, order: Order):
    """
    Deletes an order from the database.
    Args:
        session: The database session.
        order: The Order object to delete.
    """
    session.delete(order)
    session.commit()
    logger.info(f"Order with ID: {order.id} deleted.")