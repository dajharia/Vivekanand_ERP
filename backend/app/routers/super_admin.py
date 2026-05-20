from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, database

router = APIRouter(
    prefix="/super-admin",
    tags=["Super Admin"]
)

@router.get("/stats")
def get_stats(student_db: Session = Depends(database.get_student_db)):
    # डेटाबेस से छात्रों की कुल संख्या गिनें
    total_students = student_db.query(models.Student).filter(models.Student.is_active == True).count()
    return {
        "total_schools": 1,
        "total_students": total_students,
        "active_staff": 45  # वर्तमान में स्टाफ का डमी डेटा है (जब तक इसका अलग टेबल न हो)
    }