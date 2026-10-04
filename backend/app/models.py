from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
    Integer,
    ForeignKey("users.id"),
    nullable=True,
    index=True,
)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    stock = Column(Integer, default=0)
    minimum_stock = Column(Integer, default=0)
    reorder_quantity = Column(Integer, default=0)
    price = Column(Float, default=0.0)


class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    product_id = Column(Integer, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_amount = Column(Float, nullable=False)
class Credit(Base):
    __tablename__ = "credits"
    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    amount = Column(Float, default=0.0)
    status = Column(String, default="pending")
class Bill(Base):
    __tablename__ = "bills"
    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    customer_name = Column(String, nullable=True)
    total_amount = Column(Float, default=0.0)
    payment_status = Column(String, default="paid")
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    product_id = Column(Integer, nullable=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    status = Column(String, default="active")
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)