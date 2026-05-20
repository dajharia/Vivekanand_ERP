from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. SQLite डेटाबेस फाइलों के नाम (ये आपके app फोल्डर में खुद-ब-खुद बन जाएंगी)
# database.py में इन लाइनों को अपडेट करें
SQLALCHEMY_DATABASE_URL_STUDENTS = "sqlite:///./school.db"
SQLALCHEMY_DATABASE_URL_MGMT = "sqlite:///./school_mgmt.db"

# 2. Engines बनाना (SQLite के लिए check_same_thread=False लिखना ज़रूरी होता है)
student_engine = create_engine(
    SQLALCHEMY_DATABASE_URL_STUDENTS, connect_args={"check_same_thread": False}
)
mgmt_engine = create_engine(
    SQLALCHEMY_DATABASE_URL_MGMT, connect_args={"check_same_thread": False}
)

# 3. Sessions बनाना
SessionLocalStudent = sessionmaker(autocommit=False, autoflush=False, bind=student_engine)
SessionLocalMgmt = sessionmaker(autocommit=False, autoflush=False, bind=mgmt_engine)

# 4. Dependency Functions
def get_student_db():
    db = SessionLocalStudent()
    try:
        yield db
    finally:
        db.close()

def get_mgmt_db():
    db = SessionLocalMgmt()
    try:
        yield db
    finally:
        db.close()