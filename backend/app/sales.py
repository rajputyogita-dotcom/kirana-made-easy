from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product, Sale, Bill, Notification, User
from app.auth import get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SaleCreate(BaseModel):
    product_id: int
    quantity: int


@router.post("/")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sale.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0",
        )

    # Only allow the logged-in user to sell their own product
    product = (
        db.query(Product)
        .filter(
            Product.id == sale.product_id,
            Product.user_id == current_user.id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    if product.stock < sale.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock. Available: {product.stock}",
        )

    # Calculate total
    total_amount = product.price * sale.quantity

    # Reduce stock
    product.stock -= sale.quantity

    # Create sale record
    new_sale = Sale(
        user_id=current_user.id,
        product_id=product.id,
        product_name=product.name,
        quantity=sale.quantity,
        total_amount=total_amount,
    )

    db.add(new_sale)
    db.flush()

    # Create bill automatically
    new_bill = Bill(
    user_id=current_user.id,
    customer_name=None,
    total_amount=total_amount,
    payment_status="paid",
)

    db.add(new_bill)

    # Check whether product is now low on stock
    low_stock = product.stock < product.minimum_stock

    # Create or update low-stock notification
    if low_stock:
        existing_notification = (
            db.query(Notification)
            .filter(
                Notification.product_id == product.id,
                Notification.type == "low_stock",
                Notification.status == "active",
            )
            .first()
        )

        if existing_notification:
            existing_notification.message = (
                f"{product.name} is down to {product.stock} units. "
                f"Minimum stock is {product.minimum_stock}. "
                f"Suggested restock: {product.reorder_quantity} units."
            )

        else:
            new_notification = Notification(
    user_id=current_user.id,
    product_id=product.id,
                type="low_stock",
                title=f"Low stock: {product.name}",
                message=(
                    f"{product.name} is down to {product.stock} units. "
                    f"Minimum stock is {product.minimum_stock}. "
                    f"Suggested restock: {product.reorder_quantity} units."
                ),
                status="active",
            )

            db.add(new_notification)

    # Save everything
    db.commit()

    db.refresh(new_sale)
    db.refresh(new_bill)

    return {
        "message": "Sale and bill created successfully",
        "sale": {
            "id": new_sale.id,
            "product": new_sale.product_name,
            "quantity": new_sale.quantity,
            "total_amount": new_sale.total_amount,
        },
        "bill": {
            "id": new_bill.id,
            "total_amount": new_bill.total_amount,
            "payment_status": new_bill.payment_status,
        },
        "remaining_stock": product.stock,
        "low_stock": low_stock,
        "minimum_stock": product.minimum_stock,
        "reorder_quantity": product.reorder_quantity,
    }


@router.get("/")
def get_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only return sales belonging to the logged-in user
    sales = (
        db.query(Sale)
        .filter(Sale.user_id == current_user.id)
        .order_by(Sale.id.desc())
        .all()
    )

    return [
        {
            "id": sale.id,
            "product_id": sale.product_id,
            "product_name": sale.product_name,
            "quantity": sale.quantity,
            "total_amount": sale.total_amount,
        }
        for sale in sales
    ]