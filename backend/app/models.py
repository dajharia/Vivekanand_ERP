from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, Boolean, Text, DateTime, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

# ==========================================
# BASES FOR TWO DIFFERENT DATABASES
# ==========================================
# Database 1: students.db (छात्रों का डेटा)
StudentBase = declarative_base()  

# Database 2: management.db (स्कूल संरचना, स्टाफ और फाइनेंस)
MgmtBase = declarative_base()     

# =====================================================================
# DATABASE 2: SCHOOL STRUCTURE & MANAGEMENT (MgmtBase)
# =====================================================================

class AcademicYear(MgmtBase):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    year_name = Column(String, unique=True, nullable=False) # उदा. 2026-27
    start_date = Column(Date)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)

class SchoolClass(MgmtBase):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, nullable=False) # LKG, UKG, 1...
    section = Column(String, default="A")      # A, B, C, D
    capacity = Column(Integer, default=40)      
    teacher = Column(String, nullable=True)     
    room = Column(String, nullable=True)

class Subject(MgmtBase):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String, unique=True)
    subject_name = Column(String, nullable=False)
    group_name = Column(String, default="A") # Group 'A' (Main), Group 'B' (Extra)
    has_practical = Column(Boolean, default=False) # True if Annual Exam has Th+Pr
    max_theory_marks = Column(Float, default=100.0) # Maximum marks for theory part
    max_practical_marks = Column(Float, default=0.0) # Maximum marks for practical part (if has_practical is True)

class ClassSubject(MgmtBase):
    __tablename__ = "class_subjects"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

class Department(MgmtBase):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    dept_name = Column(String, unique=True)

class Staff(MgmtBase):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    designation = Column(String)
    mobile_no = Column(String)
    email = Column(String)
    hire_date = Column(Date)
    basic_salary = Column(Float)
    is_active = Column(Boolean, default=True)
    photo_path = Column(String, nullable=True)

class StaffAttendance(MgmtBase):
    __tablename__ = "staff_attendance"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    date = Column(Date, default=datetime.date.today)
    status = Column(String)
    in_time = Column(Time)
    out_time = Column(Time)

# =====================================================================
# DATABASE 2: USERS (Admin/Staff Login)
# =====================================================================
class User(MgmtBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="teacher")

# =====================================================================
# DATABASE 1: STUDENT DATA & ACADEMICS (StudentBase)
# =====================================================================

class Student(StudentBase):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    admission_no = Column(String, unique=True, index=True) 
    roll_no = Column(Integer)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    mother_name = Column(String)
    father_name = Column(String)
    dob = Column(Date)
    gender = Column(String)
    category = Column(String)
    samagra_id = Column(String) 
    aadhar_no = Column(String)  
    photo_path = Column(String) 
    mobile_no = Column(String, nullable=False)
    address = Column(Text)      
    class_id = Column(Integer) # Logical Link to MgmtBase
    admission_date = Column(Date, default=datetime.date.today)
    is_active = Column(Boolean, default=True)
    
    fee_record = relationship("FeeRecord", back_populates="student", uselist=False)

class StudentParent(StudentBase):
    __tablename__ = "student_parents"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True)
    father_name = Column(String, nullable=False)
    mother_name = Column(String, nullable=False)
    primary_mobile = Column(String, nullable=False)
    permanent_address = Column(Text)

class FeeRecord(StudentBase):
    __tablename__ = "fee_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))    
    monthly_fee = Column(Float)
    total_monthly_payable = Column(Float) 
    exam_fee_per_term = Column(Float, default=500.0) 
    total_exam_payable = Column(Float, default=1000.0) 
    total_payable = Column(Float) 
    total_paid = Column(Float, default=0.0)
    balance = Column(Float)    
    student = relationship("Student", back_populates="fee_record")

class Attendance(StudentBase):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer) # Logical Link
    date = Column(Date, default=datetime.date.today)
    status = Column(String) 

class Exam(StudentBase):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String, nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    academic_year_id = Column(Integer)

class ExamMarks(StudentBase):
    __tablename__ = "exam_marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer) # Logical link to MgmtBase (subjects)
    class_id = Column(Integer)   # Logical link to MgmtBase (classes)
    academic_year_id = Column(Integer)
    
    term1_marks = Column(Float, default=0.0) # First Term
    term2_marks = Column(Float, default=0.0) # Second Term
    annual_theory = Column(Float, default=0.0) # Annual Theory
    annual_practical = Column(Float, default=0.0) # Annual Practical
    
    grand_total = Column(Float, default=0.0)
    grade = Column(String)

class StudentResult(StudentBase):
    __tablename__ = "student_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer)
    academic_year_id = Column(Integer)
    
    total_obtained_marks = Column(Float, default=0.0)
    max_total_marks = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    final_grade = Column(String)
    rank = Column(Integer)
    result_status = Column(String) # Pass, Fail, Promoted
    
    term1_attendance = Column(String) # e.g., "68/210"
    term2_attendance = Column(String)
    annual_attendance = Column(String)
    remarks = Column(Text)

# =====================================================================
# DATABASE 2: FINANCE, LIBRARY & TRANSPORT (MgmtBase)
# =====================================================================

class FeeCategory(MgmtBase):
    __tablename__ = "fee_categories"
    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, unique=True)

class FeeStructure(MgmtBase):
    __tablename__ = "fee_structures"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer) 
    fee_category_id = Column(Integer, ForeignKey("fee_categories.id"))
    amount = Column(Float, nullable=False)

class FeeReceipt(MgmtBase):
    __tablename__ = "fee_receipts"
    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String, unique=True, index=True) 
    student_id = Column(Integer)
    net_paid = Column(Float)
    payment_mode = Column(String) 
    payment_date = Column(DateTime, default=datetime.datetime.now)
    collected_by = Column(Integer, ForeignKey("staff.id"))

class Expense(MgmtBase):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String, unique=True)
    amount = Column(Float)
    date_incurred = Column(Date, default=datetime.date.today)
    description = Column(Text)

class LibraryBook(MgmtBase):
    __tablename__ = "library_books"
    id = Column(Integer, primary_key=True, index=True)
    book_no = Column(String, unique=True)
    title = Column(String, nullable=False)
    quantity = Column(Integer)
    available_qty = Column(Integer)

class BookIssue(MgmtBase):
    __tablename__ = "book_issues"
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("library_books.id")) 
    student_id = Column(Integer) 
    issue_date = Column(Date, default=datetime.date.today)
    return_date = Column(Date, nullable=True)

class Transaction(MgmtBase):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False) 
    amount_paid = Column(Float)
    payment_date = Column(DateTime, default=datetime.datetime.now) 
    payment_mode = Column(String) 
    receipt_no = Column(String, unique=True)