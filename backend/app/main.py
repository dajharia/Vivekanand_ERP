import os, io, sqlite3
from datetime import datetime
from fastapi import FastAPI, Depends, Form, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from PIL import Image
from app import models, database, schemas
from app.config import STATIC_PATH
from app.routers import classes, students, fees, attendance, staff, exams, settings

app = FastAPI(title="Vivekanand H.S.S ERP API", version="1.0")

# --- Database Fixer & Initializer ---
def fix_db():
    """डेटाबेस टेबल्स और कॉलम्स को सिंक करने के लिए"""
    try:
        # 1. school.db (Student & Fees) फिक्स करें
        conn = sqlite3.connect('school.db')
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(students)")
        student_cols = [c[1] for c in cursor.fetchall()]
        student_new_cols = {
            "photo_path": "TEXT",
            "samagra_id": "TEXT",
            "aadhar_no": "TEXT",
            "address": "TEXT",
            "section": "TEXT DEFAULT 'A'"
        }
        for col, col_type in student_new_cols.items():
            if col not in student_cols:
                try: cursor.execute(f"ALTER TABLE students ADD COLUMN {col} {col_type}")
                except: pass

        # fee_records टेबल में नए कॉलम्स जोड़ें
        cursor.execute("PRAGMA table_info(fee_records)")
        fee_cols = [c[1] for c in cursor.fetchall()]
        new_cols = {
            "total_monthly_payable": "FLOAT DEFAULT 0.0",
            "exam_fee_per_term": "FLOAT DEFAULT 500.0",
            "total_exam_payable": "FLOAT DEFAULT 1000.0"
            ,"total_paid": "FLOAT DEFAULT 0.0", # सुनिश्चित करें कि यह मौजूद है
            "balance": "FLOAT DEFAULT 0.0" # सुनिश्चित करें कि यह मौजूद है
        }
        for col, col_type in new_cols.items():
            if col not in fee_cols:
                try: cursor.execute(f"ALTER TABLE fee_records ADD COLUMN {col} {col_type}")
                except: pass
        conn.commit()
        conn.close()

        # 2. school_mgmt.db को फिक्स करें
        conn_mgmt = sqlite3.connect('school_mgmt.db')
        cursor_mgmt = conn_mgmt.cursor()
        
        # subjects टेबल में नए कॉलम्स जोड़ें
        cursor_mgmt.execute("PRAGMA table_info(subjects)")
        subject_cols = [c[1] for c in cursor_mgmt.fetchall()]
        if 'group_name' not in subject_cols:
            cursor_mgmt.execute("ALTER TABLE subjects ADD COLUMN group_name TEXT DEFAULT 'A'")
        if 'has_practical' not in subject_cols:
            cursor_mgmt.execute("ALTER TABLE subjects ADD COLUMN has_practical BOOLEAN DEFAULT 0")
        if 'max_theory_marks' not in subject_cols:
            cursor_mgmt.execute("ALTER TABLE subjects ADD COLUMN max_theory_marks FLOAT DEFAULT 100.0")
        if 'max_practical_marks' not in subject_cols:
            cursor_mgmt.execute("ALTER TABLE subjects ADD COLUMN max_practical_marks FLOAT DEFAULT 0.0")
            
        # staff टेबल में photo_path चेक करें
        cursor_mgmt.execute("PRAGMA table_info(staff)")
        staff_cols = [c[1] for c in cursor_mgmt.fetchall()]
        if 'photo_path' not in staff_cols:
            cursor_mgmt.execute("ALTER TABLE staff ADD COLUMN photo_path TEXT")
            
        conn_mgmt.commit()
        conn_mgmt.close()
        print("✅ Databases synchronized successfully.")
    except Exception as e:
        print(f"⚠️ Fix DB Error: {e}")

# --- Middleware & Static Files ---
os.makedirs(STATIC_PATH, exist_ok=True)

# सही और पक्का पाथ: हमेशा config.py से STATIC_PATH का इस्तेमाल करें
upload_dir = os.path.join(STATIC_PATH, "uploads")

# आपके सभी ज़रूरी फोल्डर्स को सुनिश्चित करें (ताकि भविष्य में क्रैश न हो)
for folder in ["admins", "profiles", "students", "staff", "system"]:
    os.makedirs(os.path.join(upload_dir, folder), exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # सभी पोर्ट को अनुमति दें
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Tables (Order is crucial) ---
models.StudentBase.metadata.create_all(bind=database.student_engine)
models.MgmtBase.metadata.create_all(bind=database.mgmt_engine)
fix_db()

# --- Include Routers ---
app.include_router(classes.router) # <-- राउटर को ऐप में जोड़ें
app.include_router(students.router)
app.include_router(fees.router)
app.include_router(attendance.router) # <-- Attendance राउटर जोड़ें
app.include_router(staff.router) # <-- Staff राउटर जोड़ें
app.include_router(exams.router) # <-- Exams राउटर जोड़ें
app.include_router(settings.router) # <-- Settings राउटर जोड़ें

@app.get("/")
def read_root(): return {"status": "Online", "school": "Vivekanand H.S.S Nainpur"}
