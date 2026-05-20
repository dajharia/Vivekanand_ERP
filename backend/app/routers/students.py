import os, io
from datetime import datetime
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session, joinedload # joinedload इम्पोर्ट किया गया
from PIL import Image

from app import models, schemas, database # Absolute इम्पोर्ट का उपयोग करें
from app.config import STATIC_PATH # app.config से STATIC_PATH इम्पोर्ट करें

router = APIRouter(
    prefix="/students",
    tags=["Students"]
)

@router.post("/", response_model=schemas.StudentResponse)
async def create_student(
    first_name: str = Form(...), last_name: str = Form(...),
    mother_name: str = Form(...), father_name: str = Form(...),
    dob: str = Form(...), gender: str = Form(...),
    category: str = Form(...), mobile_no: str = Form(...),
    class_id: int = Form(...), samagra_id: str = Form(None),
    aadhar_no: str = Form(None), address: str = Form(None),
    photo: UploadFile = File(None), db: Session = Depends(database.get_student_db)
):
    # 1. यूनिक एडमिशन नंबर जेनरेशन
    pref = f"VS-{datetime.today().strftime('%y%m%d')}-"
    last = db.query(models.Student).filter(models.Student.admission_no.like(f"{pref}%")).order_by(models.Student.admission_no.desc()).first()
    serial = str(int(last.admission_no.split("-")[-1]) + 1).zfill(4) if last else "0001"
    adm_no = f"{pref}{serial}"

    # 2. फोटो प्रोसेसिंग (.webp)
    photo_path = None
    if photo and photo.filename:
        try:
            img_data = await photo.read()
            if img_data:
                up_dir = os.path.join(STATIC_PATH, "uploads", "students") # Use imported STATIC_PATH
                os.makedirs(up_dir, exist_ok=True)
                img = Image.open(io.BytesIO(img_data)).convert("RGB")
                fname = f"{adm_no}.webp"
                img.save(os.path.join(up_dir, fname), "WEBP", quality=80)
                photo_path = f"students/{fname}"
        except Exception as e: print(f"Photo Error: {e}")

    # 3. स्टूडेंट रिकॉर्ड सेविंग
    new_student = models.Student(
        admission_no=adm_no, first_name=first_name, last_name=last_name,
        mother_name=mother_name, father_name=father_name,
        dob=datetime.strptime(dob, '%Y-%m-%d').date(), gender=gender,
        category=category, mobile_no=mobile_no, class_id=class_id,
        samagra_id=samagra_id, aadhar_no=aadhar_no, address=address,
        photo_path=photo_path, is_active=True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    # 4. ऑटो फीस जेनरेशन (Logic Optimization)
    rates = { (1, 2): 300.0, (3, 7): 500.0, (8, 12): 700.0, (13, 14): 800.0 }
    rate = 0.0
    for (low, high), r in rates.items():
        if low <= class_id <= high:
            rate = r
            break

    total_monthly = rate * 10
    total_exam = 1000.0
    total_total = total_monthly + total_exam

    db_fee = models.FeeRecord(
        student_id=new_student.id, monthly_fee=rate,
        total_monthly_payable=total_monthly, total_exam_payable=total_exam,
        total_payable=total_total, balance=total_total
    )
    db.add(db_fee)
    db.commit()

    return new_student

@router.get("/", response_model=list[schemas.StudentResponse])
def get_students(skip: int = 0, limit: int = 200, db: Session = Depends(database.get_student_db)):
    return db.query(models.Student).options(joinedload(models.Student.fee_record)).offset(skip).limit(limit).all()

@router.get("/search/{adm_no}", response_model=schemas.StudentResponse)
def search_student_by_adm(adm_no: str, db: Session = Depends(database.get_student_db)): # get_student_db का उपयोग करें
    student = db.query(models.Student).options(joinedload(models.Student.fee_record)).filter(models.Student.admission_no == adm_no).first()
    if not student: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="छात्र नहीं मिला")
    return student

@router.put("/{student_id}/")
async def update_student(
    student_id: int,
    first_name: str = Form(...), last_name: str = Form(...),
    mother_name: str = Form(...), father_name: str = Form(...),
    dob: str = Form(...), gender: str = Form(...),
    category: str = Form(...), mobile_no: str = Form(...),
    class_id: int = Form(...), samagra_id: str = Form(None),
    aadhar_no: str = Form(None), address: str = Form(None),
    section: str = Form(None), # फ्रंटएंड 'section' भेज रहा है, इसलिए इसे स्वीकार करें ताकि एरर न आए
    photo: UploadFile = File(None), db: Session = Depends(database.get_student_db)
):
    # 1. डेटाबेस में छात्र को खोजें
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="छात्र नहीं मिला")

    # 2. नया डेटा अपडेट करें
    student.first_name = first_name
    student.last_name = last_name
    student.mother_name = mother_name
    student.father_name = father_name
    student.dob = datetime.strptime(dob, '%Y-%m-%d').date()
    student.gender = gender
    student.category = category
    student.mobile_no = mobile_no
    student.class_id = class_id
    student.samagra_id = samagra_id
    student.aadhar_no = aadhar_no
    student.address = address

    # 3. अगर नई फोटो अपलोड की गई है, तो उसे प्रोसेस और सेव करें
    if photo and photo.filename:
        try:
            img_data = await photo.read()
            if img_data:
                up_dir = os.path.join(STATIC_PATH, "uploads", "students")
                os.makedirs(up_dir, exist_ok=True)
                img = Image.open(io.BytesIO(img_data)).convert("RGB")
                fname = f"{student.admission_no}.webp"
                img.save(os.path.join(up_dir, fname), "WEBP", quality=80)
                student.photo_path = f"students/{fname}"
        except Exception as e:
            print(f"Photo Update Error: {e}")

    # 4. डेटाबेस में बदलाव सुरक्षित करें
    db.commit()
    db.refresh(student)
    return {"message": "छात्र का रिकॉर्ड सफलतापूर्वक अपडेट किया गया", "student_id": student.id}

@router.delete("/{student_id}/")
def delete_student(student_id: int, db: Session = Depends(database.get_student_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="छात्र नहीं मिला")
    
    db.delete(student)
    db.commit()
    return {"message": "छात्र का रिकॉर्ड सफलतापूर्वक हटा दिया गया"}