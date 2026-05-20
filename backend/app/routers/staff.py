import os, io
from datetime import datetime
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from PIL import Image

from app import models, schemas, database
from app.config import STATIC_PATH

router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)

@router.get("/", response_model=list[schemas.StaffResponse])
def get_all_staff(db: Session = Depends(database.get_mgmt_db)):
    staff_list = db.query(models.Staff).all()
    for staff in staff_list:
        if staff.photo_path:
            staff.photo_url = f"http://127.0.0.1:8000/uploads/{staff.photo_path}"
        else:
            staff.photo_url = None
    return staff_list

@router.post("/", response_model=schemas.StaffResponse)
async def create_staff(
    first_name: str = Form(...),
    last_name: str = Form(...),
    designation: str = Form(...),
    mobile_no: str = Form(...),
    photo: UploadFile = File(None),
    db: Session = Depends(database.get_mgmt_db)
):
    # 1. Employee ID बनाना
    pref = f"EMP-{datetime.today().strftime('%y%m')}-"
    last = db.query(models.Staff).filter(models.Staff.employee_id.like(f"{pref}%")).order_by(models.Staff.employee_id.desc()).first()
    serial = str(int(last.employee_id.split("-")[-1]) + 1).zfill(3) if last else "001"
    emp_id = f"{pref}{serial}"

    # 2. फोटो को .webp में बदलना और सेव करना
    photo_path = None
    if photo and photo.filename:
        try:
            img_data = await photo.read()
            if img_data:
                up_dir = os.path.join(STATIC_PATH, "uploads", "staff")
                os.makedirs(up_dir, exist_ok=True)
                img = Image.open(io.BytesIO(img_data)).convert("RGB")
                fname = f"{emp_id}.webp"
                img.save(os.path.join(up_dir, fname), "WEBP", quality=80)
                photo_path = f"staff/{fname}"
        except Exception as e:
            print(f"Staff Photo Upload Error: {e}")

    # 3. डेटाबेस में सेव करना
    new_staff = models.Staff(
        employee_id=emp_id, first_name=first_name, last_name=last_name,
        designation=designation, mobile_no=mobile_no, photo_path=photo_path
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.put("/{staff_id}/", response_model=schemas.StaffResponse)
async def update_staff(
    staff_id: int,
    first_name: str = Form(...), last_name: str = Form(...),
    designation: str = Form(...), mobile_no: str = Form(...),
    photo: UploadFile = File(None), db: Session = Depends(database.get_mgmt_db)
):
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    staff.first_name, staff.last_name, staff.designation, staff.mobile_no = first_name, last_name, designation, mobile_no

    if photo and photo.filename:
        try:
            img_data = await photo.read()
            if img_data:
                up_dir = os.path.join(STATIC_PATH, "uploads", "staff")
                os.makedirs(up_dir, exist_ok=True)
                img = Image.open(io.BytesIO(img_data)).convert("RGB")
                fname = f"{staff.employee_id}.webp"
                img.save(os.path.join(up_dir, fname), "WEBP", quality=80)
                staff.photo_path = f"staff/{fname}"
        except Exception as e:
            print(f"Staff Photo Update Error: {e}")

    db.commit()
    db.refresh(staff)
    return staff

@router.delete("/{staff_id}/")
def delete_staff(staff_id: int, db: Session = Depends(database.get_mgmt_db)):
    staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    if staff.photo_path:
        try:
            os.remove(os.path.join(STATIC_PATH, "uploads", staff.photo_path))
        except OSError as e:
            print(f"Error deleting photo file: {e}")

    db.delete(staff)
    db.commit()
    return {"message": "Staff member deleted successfully"}