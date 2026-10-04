from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Credit

router = APIRouter(prefix="/credits", tags=["Udhaar"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class CreditCreate(BaseModel):
    customer_name: str
    phone: str | None = None
    amount: float


@router.get("/")
def get_credits(db: Session = Depends(get_db)):
    credits = (
        db.query(Credit)
        .order_by(Credit.id.desc())
        .all()
    )

    return [
        {
            "id": credit.id,
            "customer_name": credit.customer_name,
            "phone": credit.phone,
            "amount": credit.amount,
            "status": credit.status,
        }
        for credit in credits
    ]


@router.post("/")
def create_credit(
    credit: CreditCreate,
    db: Session = Depends(get_db)
):
    if credit.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than 0"
        )

    new_credit = Credit(
        customer_name=credit.customer_name,
        phone=credit.phone,
        amount=credit.amount,
        status="pending"
    )

    db.add(new_credit)
    db.commit()
    db.refresh(new_credit)

    return {
        "message": "Udhaar added successfully",
        "credit": {
            "id": new_credit.id,
            "customer_name": new_credit.customer_name,
            "phone": new_credit.phone,
            "amount": new_credit.amount,
            "status": new_credit.status,
        }
    }


@router.patch("/{credit_id}/paid")
def mark_credit_paid(
    credit_id: int,
    db: Session = Depends(get_db)
):
    credit = (
        db.query(Credit)
        .filter(Credit.id == credit_id)
        .first()
    )

    if not credit:
        raise HTTPException(
            status_code=404,
            detail="Credit record not found"
        )

    credit.status = "paid"
    db.commit()
    db.refresh(credit)

    return {
        "message": "Udhaar marked as paid",
        "credit": {
            "id": credit.id,
            "customer_name": credit.customer_name,
            "amount": credit.amount,
            "status": credit.status,
        }
    }