from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List

# --- Fee & Transaction Schemas ---
class FeePaymentRequest(BaseModel):
    student_id: int
    amount: float
    payment_mode: str  # Cash, Online, UPI
    transaction_id: Optional[str] = None
    receipt_no: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class FeeRecordDisplay(BaseModel):
    id: int
    monthly_fee: float = 0.0
    total_payable: float = 0.0
    total_paid: float = 0.0
    balance: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)

# --- Student Schemas ---
class StudentBase(BaseModel):
    # अनिवार्य फील्ड्स (Required)
    first_name: str
    last_name: str
    mobile_no: str
    class_id: int 
    
    # वैकल्पिक फील्ड्स (Optional - इन्हें None करने से 422 एरर कम होगी)
    mother_name: Optional[str] = "N/A"
    father_name: Optional[str] = "N/A"
    dob: Optional[date] = None
    gender: Optional[str] = "Male"
    category: Optional[str] = "General"
    samagra_id: Optional[str] = None
    aadhar_no: Optional[str] = None
    address: Optional[str] = None
    photo_path: Optional[str] = None
    is_active: Optional[bool] = True

    model_config = ConfigDict(from_attributes=True)

class StudentCreate(StudentBase):
    admission_no: str # इसे Frontend से 'VS-timestamp' बनाकर भेजें

class StudentResponse(StudentBase):
    id: int
    admission_no: str
    # स्टूडेंट के साथ उसकी फीस का सारांश दिखाने के लिए
    fee_record: Optional[FeeRecordDisplay] = None

# --- Class Schemas ---
class ClassBase(BaseModel):
    name: str 
    section: str = "A"
    capacity: int = 40
    teacher: Optional[str] = "Not Assigned"
    room: Optional[str] = "N/A"

    model_config = ConfigDict(from_attributes=True)

class ClassCreate(ClassBase):
    pass

class ClassDisplay(ClassBase):
    id: int
    students: int = 0
    present_today: int = 0

# --- Exam & Subject Schemas ---
class SubjectBase(BaseModel):
    subject_code: str
    subject_name: str
    group_name: Optional[str] = "A" # Group 'A' or 'B'
    has_practical: Optional[bool] = False
    max_theory_marks: Optional[float] = 100.0
    max_practical_marks: Optional[float] = 0.0

class SubjectCreate(SubjectBase):
    pass

class SubjectDisplay(SubjectBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExamBase(BaseModel):
    exam_name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    academic_year_id: Optional[int] = None

class ExamCreate(ExamBase):
    pass

class ExamDisplay(ExamBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ExamMarksBase(BaseModel):
    student_id: int
    subject_id: int
    class_id: int
    academic_year_id: Optional[int] = None
    term1_marks: float = 0.0
    term2_marks: float = 0.0
    annual_theory: float = 0.0
    annual_practical: float = 0.0
    grand_total: float = 0.0
    grade: Optional[str] = None

class ExamMarksDisplay(ExamMarksBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class StudentResultBase(BaseModel):
    student_id: int
    class_id: int
    academic_year_id: Optional[int] = None
    total_obtained_marks: float = 0.0
    max_total_marks: float = 0.0
    percentage: float = 0.0
    final_grade: Optional[str] = None
    rank: Optional[int] = None
    result_status: Optional[str] = None # Pass, Fail, Promoted
    term1_attendance: Optional[str] = None
    term2_attendance: Optional[str] = None
    annual_attendance: Optional[str] = None
    remarks: Optional[str] = None

class StudentResultDisplay(StudentResultBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Staff Schemas ---
class StaffBase(BaseModel):
    first_name: str
    last_name: str
    designation: Optional[str] = None
    mobile_no: Optional[str] = None

class StaffResponse(StaffBase):
    id: int
    employee_id: str
    photo_path: Optional[str] = None
    photo_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    password: str
    role: str = "teacher"

class UserCreate(UserBase):
    pass

class UserDisplay(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Pydantic 2.0 Forward Reference Resolution
StudentResponse.model_rebuild()