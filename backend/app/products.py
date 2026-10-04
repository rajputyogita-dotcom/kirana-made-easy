from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product, Notification
router = APIRouter(prefix="/products", tags=["Inventory"])


# Database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class StockUpdate(BaseModel):
    quantity: int


def is_low_stock(product):
    return product.stock < product.minimum_stock


# Get all products
@router.get("/")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "stock": product.stock,
            "minimum_stock": product.minimum_stock,
            "reorder_quantity": product.reorder_quantity,
            "price": product.price,
            "low_stock": is_low_stock(product)
        }
        for product in products
    ]


# Get low-stock products
@router.get("/alerts/low-stock")
def get_low_stock_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()

    low_stock = [
        {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "stock": product.stock,
            "minimum_stock": product.minimum_stock,
            "reorder_quantity": product.reorder_quantity,
            "price": product.price
        }
        for product in products
        if is_low_stock(product)
    ]

    return {
        "count": len(low_stock),
        "products": low_stock
    }


# Update stock
@router.patch("/{product_id}/stock")
def update_stock(
    product_id: int,
    update: StockUpdate,
    db: Session = Depends(get_db)
):
    if update.quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Stock quantity cannot be negative"
        )

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    old_stock = product.stock

    # Update stock
    product.stock = update.quantity

    low_stock = product.stock < product.minimum_stock

    # Find existing active low-stock notification
    notification = (
        db.query(Notification)
        .filter(
            Notification.product_id == product.id,
            Notification.type == "low_stock",
            Notification.status == "active"
        )
        .first()
    )

    # If stock is healthy, resolve the alert
    if not low_stock and notification:
        notification.status = "resolved"

    # If stock is still low but no alert exists, create one
    elif low_stock and not notification:
        new_notification = Notification(
            product_id=product.id,
            type="low_stock",
            title=f"Low stock: {product.name}",
            message=(
                f"{product.name} is down to {product.stock} units. "
                f"Minimum stock is {product.minimum_stock}. "
                f"Suggested restock: {product.reorder_quantity} units."
            ),
            status="active"
        )

        db.add(new_notification)

    # Save changes
    db.commit()
    db.refresh(product)

    return {
        "message": "Stock updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "stock": product.stock,
            "minimum_stock": product.minimum_stock,
            "low_stock": low_stock
        },
        "old_stock": old_stock,
        "new_stock": product.stock,
        "low_stock": low_stock,
        "notification_resolved": (
            notification is not None and not low_stock
        )
    }

# Get one product
@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "stock": product.stock,
        "minimum_stock": product.minimum_stock,
        "reorder_quantity": product.reorder_quantity,
        "price": product.price,
        "low_stock": is_low_stock(product)
    }