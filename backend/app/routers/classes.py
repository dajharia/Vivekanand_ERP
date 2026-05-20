from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, database

router = APIRouter(
    prefix="/classes",
    tags=["Classes"]
)

@router.get("/", response_model=list[schemas.ClassDisplay])
def get_classes(
    db: Session = Depends(database.get_mgmt_db), 
    student_db: Session = Depends(database.get_student_db)
):
    try:
        # 1. सभी कक्षाएं लाएं
        classes = db.query(models.SchoolClass).all()
        result = []
        
        for c in classes:
            # 2. मिलान को एकदम सटीक करें
            # यहाँ हम सुनिश्चित कर रहे हैं कि Student की class_id 
            # बिल्कुल वही हो जो वर्तमान Class की ID है
            registered_count = student_db.query(models.Student).filter(
                models.Student.class_id == int(c.id), # स्पष्ट रूप से Integer में बदलें
                models.Student.is_active == True
            ).count()

            # 3. डेटा वापस भेजें
            result.append({
                "id": c.id,
                "name": c.class_name,
                "section": c.section,
                "teacher": c.teacher or "Not Assigned",
                "room": c.room or "N/A",
                "students": registered_count,
                "present_today": 0  # अभी के लिए 0
            })
            
        return result
    except Exception as e:
        print(f"❌ Backend Count Error: {e}")
        raise HTTPException(status_code=500, detail="गणना में त्रुटि")

@router.post("/", response_model=schemas.ClassDisplay)
def create_class(
    class_data: schemas.ClassCreate, 
    db: Session = Depends(database.get_mgmt_db)
):
    # 1. यूनिक चेक: क्या यह क्लास और सेक्शन का कॉम्बिनेशन पहले से है?
    existing = db.query(models.SchoolClass).filter(
        models.SchoolClass.class_name == class_data.name,
        models.SchoolClass.section == class_data.section
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"कक्षा {class_data.name}-{class_data.section} पहले से मौजूद है")
        
    try:
        # 2. नया रिकॉर्ड बनाना
        new_class = models.SchoolClass(
            class_name=class_data.name,
            section=class_data.section,
            capacity=class_data.capacity,
            teacher=class_data.teacher,
            room=class_data.room
        )
        db.add(new_class)
        db.commit()
        db.refresh(new_class)
        
        # 3. Response वापस करें
        return {
            "id": new_class.id,
            "name": new_class.class_name,
            "section": new_class.section,
            "capacity": new_class.capacity,
            "teacher": new_class.teacher or "Not Assigned",
            "room": new_class.room or "N/A",
            "students": 0
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating class: {e}")
        raise HTTPException(status_code=500, detail=f"बनाने में विफल: {str(e)}")