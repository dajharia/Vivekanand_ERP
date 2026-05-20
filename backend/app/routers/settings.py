import os, zipfile, shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app import models, schemas, database
from app.config import STATIC_PATH

router = APIRouter(tags=["Settings"])

# ==========================================
# 1. USER MANAGEMENT (Login Credentials)
# ==========================================

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/users/login")
def login_user(req: LoginRequest, db: Session = Depends(database.get_mgmt_db)):
    user = db.query(models.User).filter(models.User.username == req.username, models.User.password == req.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"id": user.id, "username": user.username, "role": user.role}

@router.get("/users/", response_model=List[schemas.UserDisplay])
def get_users(db: Session = Depends(database.get_mgmt_db)):
    users = db.query(models.User).all()
    if not users:
        # अगर कोई यूजर नहीं है, तो एक डिफ़ॉल्ट सुपर एडमिन बना दें
        default_admin = models.User(username="admin", password="password", role="super_admin")
        db.add(default_admin)
        db.commit()
        db.refresh(default_admin)
        return [default_admin]
    return users

@router.post("/users/", response_model=schemas.UserDisplay)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_mgmt_db)):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/{user_id}", response_model=schemas.UserDisplay)
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(database.get_mgmt_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user.model_dump().items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_mgmt_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.username == 'admin':
        raise HTTPException(status_code=400, detail="Cannot delete default admin user")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

# ==========================================
# 1.5 USER PROFILE PHOTO
# ==========================================
@router.post("/users/{username}/photo")
async def upload_user_photo(username: str, photo: UploadFile = File(...)):
    try:
        upload_dir = os.path.join(STATIC_PATH, "uploads", "profiles")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{username}.jpg")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        return {"message": "User photo updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 2. ADMIN PROFILE PHOTO
# ==========================================
@router.post("/admin/photo")
async def upload_admin_photo(photo: UploadFile = File(...)):
    try:
        upload_dir = os.path.join(STATIC_PATH, "uploads", "admins")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, "admin.jpg")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        return {"message": "Admin photo updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 3. DATABASE BACKUP & RESTORE
# ==========================================
@router.get("/backup/status")
def get_backup_status():
    db_path = "school.db"
    last_backup = datetime.fromtimestamp(os.path.getmtime(db_path)).isoformat() if os.path.exists(db_path) else None
    return {"last_backup_date": last_backup, "is_restored": os.path.exists("school.db.bak")}

@router.post("/backup/create")
def create_backup():
    try:
        zip_filename = "school_backup.zip"
        with zipfile.ZipFile(zip_filename, 'w') as zipf:
            if os.path.exists("school.db"): zipf.write("school.db")
            if os.path.exists("school_mgmt.db"): zipf.write("school_mgmt.db")
        return FileResponse(zip_filename, media_type="application/zip", filename=zip_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# (नोट: Restore और Revert के राउट्स को आप भविष्य में सुरक्षा कारणों से और मजबूत बना सकते हैं)
