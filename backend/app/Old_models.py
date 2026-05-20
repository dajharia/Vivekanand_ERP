from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, Boolean, Text, DateTime, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

# ==========================================
# BASES FOR TWO DIFFERENT DATABASES
# ==========================================
StudentBase = declarative_base()  # Database 1: student_db
MgmtBase = declarative_base()     # Database 2: school_mgmt_db


# =====================================================================
# DATABASE 1: STUDENT & ACADEMICS (student_db)
# =====================================================================

# 1. Academic Year Master (इसे MgmtBase में रखना बेहतर है क्योंकि यह पूरे स्कूल के लिए है)
class AcademicYear(MgmtBase):
    __tablename__ = "academic_years"
    id = Column(Integer, primary_key=True, index=True)
    year_name = Column(String, unique=True, nullable=False) # उदा. 2026-27
    start_date = Column(Date)
    end_date = Column(Date)
    is_active = Column(Boolean, default=True)

# 2. Class Master (LKG to 12th) - यह आपकी 'Classes Overview' को कंट्रोल करता है
class SchoolClass(MgmtBase):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String, nullable=False) # LKG, UKG, 1, 2...
    section = Column(String, default="A")      # A, B, C, D
    capacity = Column(Integer, default=40)      # जैसा आपने सुझाव दिया, डिफॉल्ट 40
    teacher = Column(String, nullable=True)     
    room = Column(String, nullable=True)

# 3. Subject Master (इसे भी Mgmt में रखें ताकि हर साल इस्तेमाल हो सके)
class Subject(MgmtBase):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    subject_code = Column(String, unique=True)
    subject_name = Column(String, nullable=False)
    subject_type = Column(String) # Theory, Practical

# 4. Class-Subject Mapping (ID के बजाय String का उपयोग करना सुरक्षित है यदि DB अलग हैं)
class ClassSubject(MgmtBase):
    __tablename__ = "class_subjects"
    id = Column(Integer, primary_key=True, index=True)
    # यहाँ ForeignKey तभी काम करेगा जब classes और subjects एक ही DB (Mgmt) में हों
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
# 5. Student Profile
class Student(StudentBase):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    admission_no = Column(String, unique=True, index=True) 
    roll_no = Column(Integer)
    
    # Personal Info
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    mother_name = Column(String)
    father_name = Column(String)
    dob = Column(Date)
    gender = Column(String)
    category = Column(String) # New: General, OBC, SC, ST
    
    # IDs & Documents
    samagra_id = Column(String) # New
    aadhar_no = Column(String)  # New
    photo_path = Column(String) # New: Photo URL/Path
    
    # Contact Info
    mobile_no = Column(String, nullable=False)
    address = Column(Text)      # New: Full Address
    
    # Academic Info
    class_id = Column(Integer) # Removed ForeignKey, now just an Integer
    admission_date = Column(Date, default=datetime.date.today)
    is_active = Column(Boolean, default=True)
    fee_record = relationship("FeeRecord", back_populates="student", uselist=False)
# 6. Student Parent/Guardian Details
class StudentParent(StudentBase):
    __tablename__ = "student_parents"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), unique=True)
    father_name = Column(String, nullable=False)
    mother_name = Column(String, nullable=False) # As per your requirement
    primary_mobile = Column(String, nullable=False)
    secondary_mobile = Column(String)
    email = Column(String)
    permanent_address = Column(Text)

class FeeRecord(StudentBase):
    __tablename__ = "fee_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))    
    # मासिक फीस डेटा
    monthly_fee = Column(Float)
    total_monthly_payable = Column(Float) # monthly_fee * 10    
    # परीक्षा फीस डेटा
    exam_fee_per_term = Column(Float, default=500.0) # प्रति परीक्षा शुल्क
    total_exam_payable = Column(Float, default=1000.0) # वर्ष में 2 बार (500x2)    
    total_payable = Column(Float) # (monthly * 10) + (exam * 2)
    total_paid = Column(Float, default=0.0)
    balance = Column(Float)    
    student = relationship("Student", back_populates="fee_record")

# 7. Student Documents (TC, Marksheets, Aadhar)
class StudentDocument(StudentBase):
    __tablename__ = "student_documents"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    document_name = Column(String)
    file_path = Column(String) # Path to uploaded file

# 8. Daily Attendance
class Attendance(StudentBase):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
    date = Column(Date, default=datetime.date.today)
    status = Column(String) # Present, Absent, Half-Day, Leave

# 9. Exam Master (Quarterly, Half-Yearly, Final)
class Exam(StudentBase):
    __tablename__ = "exams"
    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String, nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"))

# 10. Exam Results/Marks
class ExamResult(StudentBase):
    __tablename__ = "exam_results"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    exam_id = Column(Integer, ForeignKey("exams.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    total_marks = Column(Float)
    obtained_marks = Column(Float)
    grade = Column(String)

# 11. Timetable / Schedule
class Timetable(StudentBase):
    __tablename__ = "timetable"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    day_of_week = Column(String) # Monday, Tuesday...
    start_time = Column(Time)
    end_time = Column(Time)
    teacher_id = Column(Integer) # Refers to Staff ID in Mgmt DB


# =====================================================================
# DATABASE 2: SCHOOL MANAGEMENT, HR & FINANCE (school_mgmt_db)
# =====================================================================

# 12. Department Master
class Department(MgmtBase):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    dept_name = Column(String, unique=True) # Academic, Administration, Transport

# 13. Staff / Teacher Profile
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

# 14. Staff Attendance
class StaffAttendance(MgmtBase):
    __tablename__ = "staff_attendance"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"))
    date = Column(Date, default=datetime.date.today)
    status = Column(String)
    in_time = Column(Time)
    out_time = Column(Time)

# 15. Fee Categories (Tuition, Library, Transport, Sports)
class FeeCategory(MgmtBase):
    __tablename__ = "fee_categories"
    id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String, unique=True)
    description = Column(String)

# 16. Fee Structure (Class-wise Fee setup)
class FeeStructure(MgmtBase):
    __tablename__ = "fee_structures"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer) # Refers to SchoolClass ID in Student DB
    fee_category_id = Column(Integer, ForeignKey("fee_categories.id"))
    amount = Column(Float, nullable=False)
    academic_year = Column(String)

# 17. Fee Collection / Receipts
class FeeReceipt(MgmtBase):
    __tablename__ = "fee_receipts"
    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String, unique=True, index=True) # Removed ForeignKey, now just an Integer
    student_id = Column(Integer)
    total_amount = Column(Float)
    discount = Column(Float, default=0.0)
    net_paid = Column(Float)
    payment_mode = Column(String) # Cash, UPI, Bank Transfer
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    collected_by = Column(Integer, ForeignKey("staff.id"))

# 18. Expenses (School outgoing money)
class Expense(MgmtBase):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    voucher_no = Column(String, unique=True)
    expense_type = Column(String) # Electricity, Maintenance, Event
    amount = Column(Float)
    date_incurred = Column(Date)
    description = Column(Text)
    approved_by = Column(Integer, ForeignKey("staff.id"))

# 19. Notice Board & Communications
class Notice(MgmtBase):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text)
    notice_date = Column(Date, default=datetime.date.today)
    target_audience = Column(String) # All, Students, Teachers
    created_by = Column(Integer, ForeignKey("staff.id"))

# 20. Library Books Master
class LibraryBook(MgmtBase):
    __tablename__ = "library_books"
    id = Column(Integer, primary_key=True, index=True)
    book_no = Column(String, unique=True)
    title = Column(String, nullable=False)
    author = Column(String)
    quantity = Column(Integer)
    available_qty = Column(Integer)

# 21. Library Book Issue Tracker
class BookIssue(MgmtBase):
    __tablename__ = "book_issues"
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("library_books.id")) # This ForeignKey is within the same DB (MgmtBase)
    student_id = Column(Integer) # Removed ForeignKey, now just an Integer
    issue_date = Column(Date, default=datetime.date.today)
    due_date = Column(Date)
    return_date = Column(Date, nullable=True)
    fine_amount = Column(Float, default=0.0)

# 22. Transport Vehicles (Buses)
class TransportVehicle(MgmtBase):
    __tablename__ = "transport_vehicles"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_no = Column(String, unique=True)
    driver_name = Column(String)
    driver_contact = Column(String)
    capacity = Column(Integer)

# 23. Transport Routes
class TransportRoute(MgmtBase):
    __tablename__ = "transport_routes"
    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String)
    vehicle_id = Column(Integer, ForeignKey("transport_vehicles.id"))
    monthly_fare = Column(Float)
class Transaction(MgmtBase):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    # ForeignKey हटा दिया गया है क्योंकि 'students' टेबल दूसरी डेटाबेस फाइल में है
    student_id = Column(Integer, nullable=False)
    amount_paid = Column(Float)
    # सुनिश्चित करें कि datetime.now सही से लिखा है
    payment_date = Column(DateTime, default=datetime.datetime.now) 
    payment_mode = Column(String) 
    receipt_no = Column(String, unique=True)