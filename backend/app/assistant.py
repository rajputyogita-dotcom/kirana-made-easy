from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import (
    Product,
    Sale,
    Bill,
    Notification,
    Credit,
)

router = APIRouter(
    prefix="/assistant",
    tags=["DukaanAI"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AssistantCommand(BaseModel):
    command: str


# ==================================================
# HINDI / HINGLISH NUMBER CONVERSION
# ==================================================

NUMBER_WORDS = {
    # English
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,

    # Hinglish
    "shunya": 0,
    "ek": 1,
    "do": 2,
    "teen": 3,
    "char": 4,
    "chaar": 4,
    "paanch": 5,
    "panch": 5,
    "cheh": 6,
    "chhe": 6,
    "saat": 7,
    "aath": 8,
    "nau": 9,
    "das": 10,
    "gyarah": 11,
    "barah": 12,
    "terah": 13,
    "chaudah": 14,
    "pandrah": 15,
    "solah": 16,
    "satrah": 17,
    "atharah": 18,
    "unnis": 19,
    "bees": 20,

    # Hindi
    "शून्य": 0,
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पाँच": 5,
    "पांच": 5,
    "छह": 6,
    "छः": 6,
    "सात": 7,
    "आठ": 8,
    "नौ": 9,
    "दस": 10,
    "ग्यारह": 11,
    "बारह": 12,
    "तेरह": 13,
    "चौदह": 14,
    "पंद्रह": 15,
    "सोलह": 16,
    "सत्रह": 17,
    "अठारह": 18,
    "उन्नीस": 19,
    "बीस": 20,
}


def convert_number_words(text: str):
    """
    Converts spoken number words into numeric values.

    Example:
    'paanch Maggi aayi'
    -> '5 Maggi aayi'
    """

    words = text.split()
    converted = []

    for word in words:
        clean_word = word.strip(".,!?;:")

        if clean_word.lower() in NUMBER_WORDS:
            converted.append(
                str(NUMBER_WORDS[clean_word.lower()])
            )
        elif clean_word in NUMBER_WORDS:
            converted.append(
                str(NUMBER_WORDS[clean_word])
            )
        else:
            converted.append(word)

    return " ".join(converted)


def find_product(command: str, products):
    command_lower = command.lower()

    for product in products:
        if product.name.lower() in command_lower:
            return product

    return None


# ==================================================
# DUKAANAI COMMAND PARSER
# ==================================================

@router.post("/parse")
def parse_command(
    data: AssistantCommand,
    db: Session = Depends(get_db)
):
    command = data.command.strip()

    if not command:
        raise HTTPException(
            status_code=400,
            detail="Please enter a command"
        )

    normalized_command = convert_number_words(command)
    command_lower = normalized_command.lower()

    products = db.query(Product).all()

    matched_product = find_product(
        normalized_command,
        products
    )

    if not matched_product:
        return {
            "success": False,
            "message": (
                "I couldn't find a product in your command."
            ),
            "understood_command": normalized_command
        }

    import re

    numbers = [
        int(number)
        for number in re.findall(
            r"\d+",
            normalized_command
        )
    ]

    # --------------------------------------------------
    # ACTION KEYWORDS
    # --------------------------------------------------

    restock_words = [
        "aayi",
        "aaya",
        "aaye",
        "aai",
        "ai",
        "received",
        "purchase",
        "purchased",
        "added",
        "add",
        "stock",
        "मिला",
        "मिली",
        "मिले",
        "आयी",
        "आई",
        "आया",
        "आए",
    ]

    sale_words = [
        "bik gaya",
        "bik gayi",
        "bik gaye",
        "bika",
        "biki",
        "bik",
        "sold",
        "sale",
        "sell",
        "बेचा",
        "बेची",
        "बेचे",
        "बिक गया",
        "बिक गई",
        "बिक गए",
    ]

    has_restock = any(
        word in command_lower
        for word in restock_words
    )

    has_sale = any(
        word in command_lower
        for word in sale_words
    )

    # ==================================================
    # MULTI ACTION
    # ==================================================

    if has_restock and has_sale and len(numbers) >= 2:

        restock_quantity = numbers[0]
        sale_quantity = numbers[1]

        stock_after_restock = (
            matched_product.stock
            + restock_quantity
        )

        if sale_quantity > stock_after_restock:
            return {
                "success": False,
                "message": (
                    f"Not enough {matched_product.name} "
                    f"for this sale."
                ),
                "understood_command": normalized_command
            }

        final_stock = (
            stock_after_restock
            - sale_quantity
        )

        sale_amount = (
            matched_product.price
            * sale_quantity
        )

        return {
            "success": True,
            "intent": "multi_action",

            "understood_command": normalized_command,

            "product": {
                "id": matched_product.id,
                "name": matched_product.name
            },

            "actions": [
                {
                    "type": "restock",
                    "quantity": restock_quantity,
                    "stock_before": matched_product.stock,
                    "stock_after": stock_after_restock
                },
                {
                    "type": "sale",
                    "quantity": sale_quantity,
                    "stock_before": stock_after_restock,
                    "stock_after": final_stock,
                    "total_amount": sale_amount
                }
            ],

            "current_stock": matched_product.stock,
            "new_stock": final_stock,

            "message": (
                f"I understood: "
                f"+{restock_quantity} "
                f"{matched_product.name}, "
                f"then {sale_quantity} sold. "
                f"Final stock: {final_stock}. "
                f"Confirm?"
            )
        }

    # ==================================================
    # SALE ONLY
    # ==================================================

    if has_sale:

        if not numbers:
            return {
                "success": False,
                "message": (
                    f"How many {matched_product.name} "
                    f"were sold?"
                ),
                "understood_command": normalized_command
            }

        quantity = numbers[0]

        if quantity > matched_product.stock:
            return {
                "success": False,
                "message": (
                    f"Not enough "
                    f"{matched_product.name} in stock. "
                    f"Available stock: "
                    f"{matched_product.stock}"
                ),
                "understood_command": normalized_command
            }

        new_stock = (
            matched_product.stock - quantity
        )

        total_amount = (
            matched_product.price * quantity
        )

        return {
            "success": True,
            "intent": "sale",

            "understood_command": normalized_command,

            "product": {
                "id": matched_product.id,
                "name": matched_product.name
            },

            "quantity": quantity,

            "current_stock": matched_product.stock,
            "new_stock": new_stock,

            "price": matched_product.price,
            "total_amount": total_amount,

            "message": (
                f"Record sale of "
                f"{quantity} "
                f"{matched_product.name}?"
            )
        }

    # ==================================================
    # RESTOCK ONLY
    # ==================================================

    if has_restock:

        if not numbers:
            return {
                "success": False,
                "message": (
                    f"How many "
                    f"{matched_product.name} arrived?"
                ),
                "understood_command": normalized_command
            }

        quantity = numbers[0]

        new_stock = (
            matched_product.stock + quantity
        )

        return {
            "success": True,
            "intent": "restock",

            "understood_command": normalized_command,

            "product": {
                "id": matched_product.id,
                "name": matched_product.name
            },

            "quantity": quantity,

            "current_stock": matched_product.stock,
            "new_stock": new_stock,

            "message": (
                f"Add {quantity} "
                f"{matched_product.name} "
                f"to stock?"
            )
        }

    # ==================================================
    # UNKNOWN COMMAND
    # ==================================================

    return {
        "success": False,
        "message": (
            f"I understood "
            f"{matched_product.name}, "
            "but I'm not sure what action "
            "you want."
        ),
        "understood_command": normalized_command
    }


# ==================================================
# DUKAANAI MULTI-ACTION EXECUTION
# ==================================================

class MultiActionExecute(BaseModel):
    product_id: int
    restock_quantity: int
    sale_quantity: int


@router.post("/execute")
def execute_multi_action(
    data: MultiActionExecute,
    db: Session = Depends(get_db)
):
    if data.restock_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Restock quantity cannot be negative"
        )

    if data.sale_quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Sale quantity must be greater than 0"
        )

    product = (
        db.query(Product)
        .filter(Product.id == data.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    old_stock = product.stock

    stock_after_restock = (
        old_stock + data.restock_quantity
    )

    if data.sale_quantity > stock_after_restock:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough {product.name} in stock. "
                f"Available after restock: "
                f"{stock_after_restock}"
            )
        )

    final_stock = (
        stock_after_restock - data.sale_quantity
    )

    product.stock = final_stock

    total_amount = (
        product.price * data.sale_quantity
    )

    new_sale = Sale(
        product_id=product.id,
        product_name=product.name,
        quantity=data.sale_quantity,
        total_amount=total_amount
    )

    db.add(new_sale)

    new_bill = Bill(
        customer_name=None,
        total_amount=total_amount,
        payment_status="paid"
    )

    db.add(new_bill)

    low_stock = (
        product.stock < product.minimum_stock
    )

    notification = (
        db.query(Notification)
        .filter(
            Notification.product_id == product.id,
            Notification.type == "low_stock",
            Notification.status == "active"
        )
        .first()
    )

    if low_stock:

        if notification:
            notification.message = (
                f"{product.name} is down to "
                f"{product.stock} units. "
                f"Minimum stock is "
                f"{product.minimum_stock}. "
                f"Suggested restock: "
                f"{product.reorder_quantity} units."
            )

        else:
            new_notification = Notification(
                product_id=product.id,
                type="low_stock",
                title=f"Low stock: {product.name}",
                message=(
                    f"{product.name} is down to "
                    f"{product.stock} units. "
                    f"Minimum stock is "
                    f"{product.minimum_stock}. "
                    f"Suggested restock: "
                    f"{product.reorder_quantity} units."
                ),
                status="active"
            )

            db.add(new_notification)

    else:

        if notification:
            notification.status = "resolved"

    db.commit()

    db.refresh(new_sale)
    db.refresh(new_bill)
    db.refresh(product)

    return {
        "success": True,
        "message": "DukaanAI action completed successfully",

        "product": {
            "id": product.id,
            "name": product.name
        },

        "restock": {
            "quantity": data.restock_quantity
        },

        "sale": {
            "quantity": data.sale_quantity,
            "total_amount": total_amount
        },

        "bill": {
            "id": new_bill.id,
            "total_amount": new_bill.total_amount,
            "payment_status": new_bill.payment_status
        },

        "stock": {
            "old_stock": old_stock,
            "after_restock": stock_after_restock,
            "final_stock": final_stock
        },

        "low_stock": low_stock,

        "reorder_quantity": product.reorder_quantity
    }


# ==================================================
# 🧠 DUKAANAI INSIGHTS
# ==================================================

@router.get("/insights")
def get_dukaanai_insights(
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()
    sales = db.query(Sale).all()
    credits = db.query(Credit).all()

    # --------------------------------------------------
    # TOTAL SALES
    # --------------------------------------------------

    total_sales = sum(
        sale.total_amount
        for sale in sales
    )

    items_sold = sum(
        sale.quantity
        for sale in sales
    )

    transaction_count = len(sales)

    # --------------------------------------------------
    # BEST-SELLING PRODUCT
    # --------------------------------------------------

    product_sales = {}

    for sale in sales:
        if sale.product_name not in product_sales:
            product_sales[sale.product_name] = 0

        product_sales[sale.product_name] += sale.quantity

    best_product = None
    best_product_quantity = 0

    if product_sales:
        best_product = max(
            product_sales,
            key=product_sales.get
        )

        best_product_quantity = (
            product_sales[best_product]
        )

    # --------------------------------------------------
    # LOW STOCK PRODUCTS
    # --------------------------------------------------

    low_stock_products = [
        {
            "id": product.id,
            "name": product.name,
            "stock": product.stock,
            "minimum_stock": product.minimum_stock,
            "reorder_quantity": product.reorder_quantity
        }
        for product in products
        if product.stock < product.minimum_stock
    ]

    # --------------------------------------------------
    # CREDIT / UDHAAR
    # --------------------------------------------------

    credit_due = sum(
        credit.amount
        for credit in credits
        if credit.status != "paid"
    )

    pending_credit_count = sum(
        1
        for credit in credits
        if credit.status != "paid"
    )

    # --------------------------------------------------
    # RECOMMENDATIONS
    # --------------------------------------------------

    recommendations = []

    if low_stock_products:
        for product in low_stock_products:
            recommendations.append(
                f"Restock {product['name']} "
                f"by {product['reorder_quantity']} units."
            )
    else:
        recommendations.append(
            "Stock levels are healthy across "
            "your current inventory."
        )

    if best_product:
        recommendations.append(
            f"{best_product} is your "
            f"fastest-moving product with "
            f"{best_product_quantity} units sold."
        )

    if credit_due > 0:
        recommendations.append(
            f"You have ₹{credit_due:.0f} "
            f"in pending udhaar to collect."
        )

    if not sales:
        recommendations.append(
            "No sales have been recorded yet. "
            "Use DukaanAI to start recording sales."
        )

    # --------------------------------------------------
    # STOCK HEALTH
    # --------------------------------------------------

    healthy_stock_count = sum(
        1
        for product in products
        if product.stock >= product.minimum_stock
    )

    stock_health = {
        "total_products": len(products),
        "healthy_products": healthy_stock_count,
        "low_stock_products": len(low_stock_products)
    }

    # --------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------

    return {
        "success": True,

        "summary": {
            "total_sales": round(total_sales, 2),
            "items_sold": items_sold,
            "transaction_count": transaction_count,
            "credit_due": round(credit_due, 2),
            "pending_credit_count": pending_credit_count
        },

        "best_product": {
            "name": best_product,
            "quantity_sold": best_product_quantity
        } if best_product else None,

        "low_stock_products": low_stock_products,

        "stock_health": stock_health,

        "recommendations": recommendations
    }