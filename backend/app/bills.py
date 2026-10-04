from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Bill

router = APIRouter(prefix="/bills", tags=["Bills"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class BillCreate(BaseModel):
    customer_name: str | None = None
    total_amount: float
    payment_status: str = "paid"


@router.get("/")
def get_bills(db: Session = Depends(get_db)):
    bills = (
        db.query(Bill)
        .order_by(Bill.id.desc())
        .all()
    )

    return [
        {
            "id": bill.id,
            "customer_name": bill.customer_name,
            "total_amount": bill.total_amount,
            "payment_status": bill.payment_status,
        }
        for bill in bills
    ]


@router.post("/")
def create_bill(
    bill: BillCreate,
    db: Session = Depends(get_db)
):
    if bill.total_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Bill amount must be greater than 0"
        )

    if bill.payment_status not in ["paid", "pending"]:
        raise HTTPException(
            status_code=400,
            detail="Payment status must be paid or pending"
        )

    new_bill = Bill(
        customer_name=bill.customer_name,
        total_amount=bill.total_amount,
        payment_status=bill.payment_status
    )

    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)

    return {
        "message": "Bill created successfully",
        "bill": {
            "id": new_bill.id,
            "customer_name": new_bill.customer_name,
            "total_amount": new_bill.total_amount,
            "payment_status": new_bill.payment_status,
        }
    }