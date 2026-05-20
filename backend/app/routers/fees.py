from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app import models, schemas, database # Absolute imports

router = APIRouter(
    prefix="/fees",
    tags=["Fees"]
)

@router.post("/collect")
def collect_fee(
    payment: schemas.FeePaymentRequest,
    db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    fee = db.query(models.FeeRecord).filter(models.FeeRecord.student_id == payment.student_id).first()
    if not fee: raise HTTPException(status_code=404, detail="रिकॉर्ड नहीं मिला")

    fee.total_paid += payment.amount
    fee.balance -= payment.amount

    rec_no = f"REC-{datetime.now().strftime('%y%m%d%H%M%S')}" # Added seconds for more uniqueness
    mgmt_db.add(models.Transaction(
        student_id=payment.student_id, amount_paid=payment.amount,
        payment_mode=payment.payment_mode, receipt_no=rec_no
    ))
    db.commit()
    mgmt_db.commit()
    return {"status": "success", "receipt": rec_no, "balance": fee.balance}