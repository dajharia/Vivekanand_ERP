from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import pandas as pd
import io
from app import models, schemas, database

router = APIRouter(
    prefix="/exams",
    tags=["Exams"]
)

# --- Helper Function: ग्रेड कैलकुलेट करने के लिए ---
def calculate_grade(obtained: float, max_marks: float) -> str:
    if max_marks <= 0: 
        return ""
    percent = (obtained / max_marks) * 100
    if percent >= 90: return "A+"
    elif percent >= 75: return "A"
    elif percent >= 60: return "B"
    elif percent >= 45: return "C"
    elif percent >= 33: return "D"
    else: return "E"

class MapSubjectRequest(BaseModel):
    class_id: int
    subject_name: str
    theory_max: float = 100.0
    practical_max: float = 0.0

# ==========================================
# 1. SUBJECTS (विषय) API
# ==========================================
@router.get("/subjects", response_model=List[schemas.SubjectDisplay])
def get_subjects(db: Session = Depends(database.get_mgmt_db)):
    """सभी विषय लाएं"""
    return db.query(models.Subject).all()

@router.post("/subjects", response_model=schemas.SubjectDisplay)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(database.get_mgmt_db)):
    """नया विषय (Subject) बनाएं"""
    db_subject = models.Subject(**subject.model_dump())
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.post("/map-subject", response_model=schemas.SubjectDisplay)
def map_subject_to_class(req: MapSubjectRequest, mgmt_db: Session = Depends(database.get_mgmt_db)):
    """कक्षा के लिए नया विषय मैप करें"""
    # विषय खोजें या नया बनाएं
    subject = mgmt_db.query(models.Subject).filter(models.Subject.subject_name == req.subject_name).first()
    if not subject:
        subject_code = (req.subject_name[:3].upper() + str(req.class_id))
        subject = models.Subject(
            subject_code=subject_code, 
            subject_name=req.subject_name,
            max_theory_marks=req.theory_max,
            max_practical_marks=req.practical_max,
            has_practical=(req.practical_max > 0)
        )
        mgmt_db.add(subject)
        mgmt_db.commit()
        mgmt_db.refresh(subject)
    
    # कक्षा के साथ मैपिंग चेक करें
    mapping = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == req.class_id, models.ClassSubject.subject_id == subject.id).first()
    if not mapping:
        mapping = models.ClassSubject(class_id=req.class_id, subject_id=subject.id)
        mgmt_db.add(mapping)
        mgmt_db.commit()
    return subject

@router.get("/class-subjects/{class_id}", response_model=List[schemas.SubjectDisplay])
def get_class_subjects(class_id: int, mgmt_db: Session = Depends(database.get_mgmt_db)):
    mappings = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == class_id).all()
    if not mappings:
        return []
    subject_ids = [m.subject_id for m in mappings]
    subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    return subjects

@router.delete("/class-subjects/{class_id}/{subject_id}")
def remove_class_subject(class_id: int, subject_id: int, mgmt_db: Session = Depends(database.get_mgmt_db)):
    mapping = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == class_id, models.ClassSubject.subject_id == subject_id).first()
    if mapping:
        mgmt_db.delete(mapping)
        mgmt_db.commit()
    return {"status": "success"}

# ==========================================
# 2. MARKS (अंक) API
# ==========================================
@router.post("/marks")
def save_student_marks(
    marks_list: List[schemas.ExamMarksBase], 
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """एक साथ कई छात्रों और विषयों के अंक (Marks) सेव करें"""
    # एक ही क्वेरी में सभी विषयों का विवरण प्राप्त करें
    subject_ids = list(set([m.subject_id for m in marks_list]))
    subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    subjects_map = {s.id: s for s in subjects}

    for marks in marks_list:
        # ग्रैंड टोटल कैलकुलेट करें
        g_total = marks.term1_marks + marks.term2_marks + marks.annual_theory + marks.annual_practical
        
        # विषय के अनुसार डायनामिक मैक्सिमम मार्क्स लाएं
        subject_details = subjects_map.get(marks.subject_id)
        if not subject_details:
            continue # यदि विषय नहीं मिलता है तो इसे छोड़ दें

        # TODO: Term 1 और Term 2 के मैक्सिमम मार्क्स को DB में एक अलग टेबल में परिभाषित करना चाहिए।
        MAX_MARKS_TERM1 = 50.0
        MAX_MARKS_TERM2 = 50.0
        
        max_total_marks = (
            MAX_MARKS_TERM1 + 
            MAX_MARKS_TERM2 + 
            subject_details.max_theory_marks + 
            subject_details.max_practical_marks
        )
        
        grade = calculate_grade(g_total, max_total_marks)
        
        # चेक करें कि क्या इस विषय के मार्क्स पहले से सेव हैं?
        existing = student_db.query(models.ExamMarks).filter(
            models.ExamMarks.student_id == marks.student_id,
            models.ExamMarks.subject_id == marks.subject_id
        ).first()
        
        if existing:
            # अपडेट (Update)
            existing.term1_marks = marks.term1_marks
            existing.term2_marks = marks.term2_marks
            existing.annual_theory = marks.annual_theory
            existing.annual_practical = marks.annual_practical
            existing.grand_total = g_total
            existing.grade = grade
        else:
            # नया रिकॉर्ड (Insert)
            marks_data = marks.model_dump()
            marks_data["grand_total"] = g_total
            marks_data["grade"] = grade
            new_marks = models.ExamMarks(**marks_data)
            student_db.add(new_marks)
            
    student_db.commit()
    return {"status": "success", "message": "अंक सफलतापूर्वक सेव कर लिए गए हैं!"}

@router.get("/marks/{student_id}")
def get_student_marks(
    student_id: int,
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """किसी छात्र के भरे हुए अंक और विषय की जानकारी प्राप्त करें"""
    marks = student_db.query(models.ExamMarks).filter(models.ExamMarks.student_id == student_id).all()
    result = []
    for m in marks:
        sub = mgmt_db.query(models.Subject).filter(models.Subject.id == m.subject_id).first()
        data = m.__dict__.copy()
        data["subject_name"] = sub.subject_name if sub else "Unknown"
        data["group_name"] = sub.group_name if sub else "A"
        result.append(data)
    return result

# ==========================================
# 3. EXCEL UPLOAD / DOWNLOAD API (SINGLE SUBJECT)
# ==========================================
@router.get("/download-template")
def download_excel_template(
    class_id: int, 
    subject_id: int, 
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """(SINGLE SUBJECT) किसी क्लास और विषय के लिए बच्चों के नामों के साथ Excel टेंप्लेट डाउनलोड करें"""
    # विषय की जाँच
    subject = mgmt_db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # कक्षा के सभी एक्टिव छात्रों को लाएं
    students = student_db.query(models.Student).filter(
        models.Student.class_id == class_id,
        models.Student.is_active == True
    ).all()

    if not students:
        raise HTTPException(status_code=404, detail="इस कक्षा में कोई सक्रिय छात्र नहीं हैं।")

    # पहले से मौजूद अंक (Marks) लाएं (अगर हों तो)
    existing_marks = student_db.query(models.ExamMarks).filter(
        models.ExamMarks.class_id == class_id,
        models.ExamMarks.subject_id == subject_id
    ).all()
    marks_dict = {m.student_id: m for m in existing_marks}

    # Excel के लिए डेटा तैयार करें
    data = []
    for s in students:
        m = marks_dict.get(s.id)
        data.append({
            "Student ID (DO NOT EDIT)": s.id,
            "Admission No": s.admission_no,
            "Roll No": s.roll_no or "",
            "Student Name": f"{s.first_name} {s.last_name}",
            "Term 1": m.term1_marks if m else 0.0,
            "Term 2": m.term2_marks if m else 0.0,
            "Annual Theory": m.annual_theory if m else 0.0,
            "Annual Practical": m.annual_practical if m else 0.0,
        })

    # Pandas DataFrame बनाकर Excel में बदलें
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Marks')
    output.seek(0)

    # Excel फाइल को सीधे ब्राउज़र पर डाउनलोड के लिए भेजें
    filename = f"Marks_Class_{class_id}_Sub_{subject_id}.xlsx"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.post("/upload-marks")
async def upload_excel_marks(
    class_id: int = Form(...),
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """(SINGLE SUBJECT) शिक्षक द्वारा भरी गई Excel फाइल को अपलोड करें और मार्क्स सेव करें"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="कृपया केवल .xlsx फॉर्मेट की फाइल ही अपलोड करें!")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = df.columns.str.strip() # कॉलम के नाम से अतिरिक्त स्पेस हटाएं
        df.fillna(0.0, inplace=True) # खाली सेल्स को 0 मान लें
        
        # आवश्यक कॉलम्स की जाँच
        required_cols = ["Student ID (DO NOT EDIT)", "Term 1", "Term 2", "Annual Theory", "Annual Practical"]
        for col in required_cols:
            if col not in df.columns:
                raise HTTPException(status_code=400, detail=f"एक्सेल शीट में '{col}' कॉलम नहीं मिला! कृपया डाउनलोड किया गया टेंप्लेट ही उपयोग करें।")

        # DataFrame से मार्क्स की लिस्ट तैयार करें
        marks_list = []
        for _, row in df.iterrows():
            marks_list.append(schemas.ExamMarksBase(
                student_id=int(row["Student ID (DO NOT EDIT)"]),
                subject_id=subject_id,
                class_id=class_id,
                term1_marks=float(row["Term 1"]),
                term2_marks=float(row["Term 2"]),
                annual_theory=float(row["Annual Theory"]),
                annual_practical=float(row["Annual Practical"])
            ))
        
        # हमारे पहले से मौजूद `save_student_marks` वाले लॉजिक को दोबारा उपयोग करें
        return save_student_marks(marks_list, student_db, mgmt_db)

    except Exception as e:
        student_db.rollback()
        raise HTTPException(status_code=500, detail=f"एक्सेल अपलोड करने में त्रुटि: {str(e)}")

# ==========================================
# 4. CONSOLIDATED MARKSHEET API (ALL SUBJECTS)
# ==========================================

@router.get("/download-consolidated-template")
def download_consolidated_template(
    class_id: int, 
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """
    पूरी क्लास के सभी विषयों और सभी परीक्षाओं के लिए एक कंसोलिडेटेड Excel टेंप्लेट डाउनलोड करें।
    """
    # 1. कक्षा के सभी एक्टिव छात्रों को लाएं
    students = student_db.query(models.Student).filter(
        models.Student.class_id == class_id,
        models.Student.is_active == True
    ).order_by(models.Student.roll_no, models.Student.first_name).all()

    if not students:
        raise HTTPException(status_code=404, detail="इस कक्षा में कोई सक्रिय छात्र नहीं हैं।")

    # 2. कक्षा के सभी विषयों को लाएं
    class_subjects = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == class_id).all()
    subject_ids = [cs.subject_id for cs in class_subjects]
    
    if not subject_ids:
        raise HTTPException(status_code=404, detail=f"कक्षा ID {class_id} के लिए कोई भी विषय मैप नहीं किया गया है।")

    subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).order_by(models.Subject.id).all()

    # 3. Excel के लिए डेटा तैयार करें
    student_data = []
    for s in students:
        student_data.append({
            "Admission No": s.admission_no,
            "Roll No": s.roll_no or "",
            "Student Name": f"{s.first_name} {s.last_name or ''}".strip(),
        })
    
    df = pd.DataFrame(student_data)

    # 4. हर विषय के लिए Term 1, Term 2, Annual Th, Annual Pr कॉलम जोड़ें
    for sub in subjects:
        df[f"{sub.subject_name} - Term 1"] = 0.0
        df[f"{sub.subject_name} - Term 2"] = 0.0
        df[f"{sub.subject_name} - Annual Theory"] = 0.0
        df[f"{sub.subject_name} - Annual Practical"] = 0.0

    # 5. उपस्थिति (Attendance) के लिए कॉलम जोड़ें
    df["Attendance - Term 1"] = ""
    df["Attendance - Term 2"] = ""
    df["Attendance - Annual"] = ""

    # 6. Pandas DataFrame बनाकर Excel में बदलें
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Consolidated Marks')
    output.seek(0)

    # 7. Excel फाइल को सीधे ब्राउज़र पर डाउनलोड के लिए भेजें
    filename = f"Consolidated_Marks_Class_{class_id}.xlsx"
    headers = {'Content-Disposition': f'attachment; filename="{filename}"'}
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


@router.post("/upload-consolidated-marks")
async def upload_consolidated_marks(
    class_id: int = Form(...),
    file: UploadFile = File(...),
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """भरी हुई कंसोलिडेटेड Excel फाइल को अपलोड करें और सभी विषयों के मार्क्स सेव करें"""
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="कृपया केवल .xlsx फॉर्मेट की फाइल ही अपलोड करें!")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = df.columns.str.strip() # कॉलम के नाम से अतिरिक्त स्पेस हटाएं
        df.fillna(0, inplace=True)

        if "Admission No" not in df.columns:
            raise HTTPException(status_code=400, detail="एक्सेल शीट में 'Admission No' कॉलम नहीं मिला! कृपया डाउनलोड किया गया टेंप्लेट ही उपयोग करें।")

        # --- कक्षा के विषय और उनके IDs DB से लाएं ---
        class_subjects = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == class_id).all()
        subject_ids = [cs.subject_id for cs in class_subjects]
        subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
        subjects_map = {sub.subject_name: sub for sub in subjects}

        marks_to_save = []

        for _, row in df.iterrows():
            adm_no = str(row["Admission No"]).strip()
            # एडमिशन नंबर से छात्र को खोजें
            student = student_db.query(models.Student).filter(models.Student.admission_no == adm_no).first()
            if not student:
                continue # अगर छात्र नहीं मिला तो उसे छोड़ दें
            
            student_id = student.id

            for sub_name, sub_details in subjects_map.items():
                t1 = float(row.get(f"{sub_name} - Term 1", 0.0))
                t2 = float(row.get(f"{sub_name} - Term 2", 0.0))
                ann_th = float(row.get(f"{sub_name} - Annual Theory", 0.0))
                ann_pr = float(row.get(f"{sub_name} - Annual Practical", 0.0))

                marks_to_save.append(schemas.ExamMarksBase(
                    student_id=student_id,
                    subject_id=sub_details.id,
                    class_id=class_id,
                    term1_marks=t1,
                    term2_marks=t2,
                    annual_theory=ann_th,
                    annual_practical=ann_pr
                ))
            
            # TODO: Attendance को StudentResult टेबल में सेव करने का लॉजिक यहाँ जुड़ेगा
        
        # हमारे पहले से मौजूद `save_student_marks` वाले लॉजिक को दोबारा उपयोग करें
        return save_student_marks(marks_to_save, student_db, mgmt_db)

    except Exception as e:
        student_db.rollback()
        raise HTTPException(status_code=500, detail=f"एक्सेल अपलोड करने में त्रुटि: {str(e)}")


@router.post("/preview-marksheet")
async def preview_marksheet(
    class_id: int = Form(...),
    file: UploadFile = File(...),
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """
    भरी हुई कंसोलिडेटेड Excel फाइल से मार्कशीट का प्रीव्यू जेनरेट करें।
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="कृपया केवल .xlsx फॉर्मेट की फाइल ही अपलोड करें!")

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df.columns = df.columns.str.strip() # कॉलम के नाम से अतिरिक्त स्पेस हटाएं
        df.fillna(0, inplace=True) # खाली सेल्स को 0 मान लें

        if "Admission No" not in df.columns:
            raise HTTPException(status_code=400, detail="एक्सेल शीट में 'Admission No' कॉलम नहीं मिला! कृपया डाउनलोड किया गया टेंप्लेट ही उपयोग करें।")

        # --- कक्षा के विषय और उनके मैक्सिमम मार्क्स DB से लाएं ---
        class_subjects = mgmt_db.query(models.ClassSubject).filter(models.ClassSubject.class_id == class_id).all()
        subject_ids = [cs.subject_id for cs in class_subjects]
        subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
        subjects_map = {sub.subject_name: sub for sub in subjects}

        all_students_marks_data = []

        for _, row in df.iterrows():
            adm_no = str(row["Admission No"]).strip()
            student_details = student_db.query(models.Student).filter(models.Student.admission_no == adm_no).first()
            if not student_details:
                continue

            subjects_data = []
            grand_total_obtained = 0
            grand_max_total = 0

            for sub_name, sub_details in subjects_map.items():
                # Excel से अंक प्राप्त करें
                t1_marks = float(row.get(f"{sub_name} - Term 1", 0.0))
                t2_marks = float(row.get(f"{sub_name} - Term 2", 0.0))
                annual_th = float(row.get(f"{sub_name} - Annual Theory", 0.0))
                annual_pr = float(row.get(f"{sub_name} - Annual Practical", 0.0))

                # विषय के कुल अंक
                subject_total = t1_marks + t2_marks + annual_th + annual_pr
                
                # TODO: Term 1 और Term 2 के मैक्सिमम मार्क्स को DB में एक अलग टेबल में परिभाषित करना चाहिए।
                MAX_MARKS_TERM1 = 50.0
                MAX_MARKS_TERM2 = 50.0
                
                subject_max_total = (
                    MAX_MARKS_TERM1 + 
                    MAX_MARKS_TERM2 + 
                    sub_details.max_theory_marks + 
                    sub_details.max_practical_marks
                )

                grand_total_obtained += subject_total
                grand_max_total += subject_max_total

                subjects_data.append({
                    "subject": sub_name,
                    "term1": t1_marks,
                    "term2": t2_marks,
                    "annual_th": annual_th,
                    "annual_pr": annual_pr,
                    "total": subject_total,
                    "max_total": subject_max_total,
                    "grade": calculate_grade(subject_total, subject_max_total)
                })

            percentage = round((grand_total_obtained / grand_max_total) * 100, 2) if grand_max_total > 0 else 0
            final_grade = calculate_grade(grand_total_obtained, grand_max_total)

            student_marksheet = {
                "student": {
                    "name": f"{student_details.first_name} {student_details.last_name or ''}".strip(), 
                    "admission_no": student_details.admission_no, 
                    "father_name": student_details.father_name, 
                    "mother_name": student_details.mother_name, 
                    "dob": student_details.dob.strftime('%d-%m-%Y') if student_details.dob else "N/A"
                },
                "subjects": subjects_data, 
                "total_obtained": grand_total_obtained, 
                "max_total": grand_max_total, 
                "percentage": percentage, 
                "grade": final_grade
            }
            all_students_marks_data.append(student_marksheet)

        return {"status": "success", "data": all_students_marks_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"एक्सेल प्रोसेस करने में त्रुटि: {str(e)}")

# ==========================================
# 5. MARKSHEET GENERATION API
# ==========================================

@router.get("/marksheet/{student_id}")
def generate_student_marksheet(
    student_id: int,
    student_db: Session = Depends(database.get_student_db),
    mgmt_db: Session = Depends(database.get_mgmt_db)
):
    """
    डेटाबेस में सेव किए गए अंकों के आधार पर छात्र की फाइनल मार्कशीट जेनरेट करें।
    """
    # 1. छात्र की जानकारी प्राप्त करें
    student = student_db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="छात्र नहीं मिला")

    # 2. छात्र के सभी विषयों के अंक प्राप्त करें
    marks_records = student_db.query(models.ExamMarks).filter(models.ExamMarks.student_id == student_id).all()
    if not marks_records:
        raise HTTPException(status_code=404, detail="इस छात्र के लिए कोई अंक दर्ज नहीं किए गए हैं।")

    # 3. कक्षा के सभी विषयों की जानकारी प्राप्त करें (ताकि मैक्सिमम मार्क्स पता चल सकें)
    subject_ids = [m.subject_id for m in marks_records]
    subjects = mgmt_db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    subjects_map = {sub.id: sub for sub in subjects}

    subjects_data = []
    grand_total_obtained = 0.0
    grand_max_total = 0.0

    # 4. हर विषय के अंकों की गणना करें
    for m in marks_records:
        sub_details = subjects_map.get(m.subject_id)
        if not sub_details:
            continue

        # TODO: Term 1 और Term 2 के मैक्सिमम मार्क्स को DB से लाना चाहिए
        MAX_MARKS_TERM1 = 50.0
        MAX_MARKS_TERM2 = 50.0
        
        subject_max_total = (
            MAX_MARKS_TERM1 + 
            MAX_MARKS_TERM2 + 
            sub_details.max_theory_marks + 
            sub_details.max_practical_marks
        )

        subject_obtained_total = m.term1_marks + m.term2_marks + m.annual_theory + m.annual_practical

        grand_total_obtained += subject_obtained_total
        grand_max_total += subject_max_total

        subjects_data.append({
            "subject_name": sub_details.subject_name,
            "term1_marks": m.term1_marks,
            "term2_marks": m.term2_marks,
            "annual_theory": m.annual_theory,
            "annual_practical": m.annual_practical,
            "total_obtained": subject_obtained_total,
            "max_marks": subject_max_total,
            "grade": calculate_grade(subject_obtained_total, subject_max_total)
        })

    # 5. फाइनल रिजल्ट तैयार करें
    percentage = round((grand_total_obtained / grand_max_total) * 100, 2) if grand_max_total > 0 else 0
    final_grade = calculate_grade(grand_total_obtained, grand_max_total)
    result_status = "Pass" if percentage >= 33 else "Fail" # डिफ़ॉल्ट पासिंग क्राइटेरिया 33%

    return {
        "student_info": {
            "name": f"{student.first_name} {student.last_name or ''}".strip(),
            "admission_no": student.admission_no,
            "roll_no": student.roll_no or "N/A",
            "father_name": student.father_name,
            "mother_name": student.mother_name,
            "dob": student.dob.strftime('%d-%m-%Y') if student.dob else "N/A",
            "class_id": student.class_id
        },
        "marks": subjects_data,
        "summary": {
            "grand_total_obtained": grand_total_obtained,
            "grand_max_total": grand_max_total,
            "percentage": percentage,
            "final_grade": final_grade,
            "result_status": result_status
        }
    }