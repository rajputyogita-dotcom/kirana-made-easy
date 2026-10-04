from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Notification, User
from app.auth import get_current_user

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.id.desc())
        .all()
    )

    return [
        {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "status": notification.status,
        }
        for notification in notifications
    ]


@router.patch("/{notification_id}/resolve")
def resolve_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.status = "resolved"

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification resolved successfully",
        "notification": {
            "id": notification.id,
            "status": notification.status,
        },
    }