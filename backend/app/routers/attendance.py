from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from pydantic import BaseModel
from typing import List

from app import models, database

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

# --- Pydantic Schemas for validation ---
class StudentAttUpdate(BaseModel):
    student_id: int
    class_id: int
    status: str

class StaffAttUpdate(BaseModel):
    staff_id: int
    status: str

# ==========================================
# 1. STUDENT ATTENDANCE ENDPOINTS
# ==========================================
@router.get("/students/{class_id}")
def get_student_attendance(class_id: int, date_val: date, db: Session = Depends(database.get_student_db)):
    students = db.query(models.Student).filter(models.Student.class_id == class_id, models.Student.is_active == True).all()
    attendance = db.query(models.Attendance).filter(models.Attendance.class_id == class_id, models.Attendance.date == date_val).all()
    
    att_map = {a.student_id: a.status for a in attendance}

    result = []
    for s in students:
        result.append({
            "student_id": s.id,
            "name": f"{s.first_name} {s.last_name}",
            "roll_no": s.roll_no or "-",
            "status": att_map.get(s.id, "Present"), # डिफ़ॉल्ट रूप से Present दिखाएं
            "is_marked": s.id in att_map
        })
    return result

@router.post("/students/")
def save_student_attendance(date_val: date, records: List[StudentAttUpdate], db: Session = Depends(database.get_student_db)):
    for rec in records:
        att = db.query(models.Attendance).filter(models.Attendance.student_id == rec.student_id, models.Attendance.date == date_val).first()
        if att:
            att.status = rec.status
        else:
            new_att = models.Attendance(student_id=rec.student_id, class_id=rec.class_id, date=date_val, status=rec.status)
            db.add(new_att)
    db.commit()
    return {"message": "छात्रों की उपस्थिति सफलतापूर्वक सहेजी गई"}

# ==========================================
# 2. STAFF ATTENDANCE ENDPOINTS
# ==========================================
@router.get("/staff/")
def get_staff_attendance(date_val: date, db: Session = Depends(database.get_mgmt_db)):
    staff = db.query(models.Staff).filter(models.Staff.is_active == True).all()
    attendance = db.query(models.StaffAttendance).filter(models.StaffAttendance.date == date_val).all()
    
    att_map = {a.staff_id: a.status for a in attendance}

    result = [{"staff_id": s.id, "name": f"{s.first_name} {s.last_name}", "designation": s.designation or "Staff", "status": att_map.get(s.id, "Present"), "is_marked": s.id in att_map} for s in staff]
    return result

@router.post("/staff/")
def save_staff_attendance(date_val: date, records: List[StaffAttUpdate], db: Session = Depends(database.get_mgmt_db)):
    for rec in records:
        att = db.query(models.StaffAttendance).filter(models.StaffAttendance.staff_id == rec.staff_id, models.StaffAttendance.date == date_val).first()
        if att:
            att.status = rec.status
        else:
            new_att = models.StaffAttendance(staff_id=rec.staff_id, date=date_val, status=rec.status)
            db.add(new_att)
    db.commit()
    return {"message": "स्टाफ की उपस्थिति सफलतापूर्वक सहेजी गई"}