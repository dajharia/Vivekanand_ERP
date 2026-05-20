import sqlite3
from .. import models, database # Relative imports

def fix_db():
    """डेटाबेस टेबल्स और कॉलम्स को सिंक करने के लिए"""
    try:
        # 1. school.db (Student & Fees) फिक्स करें
        conn = sqlite3.connect('school.db')
        cursor = conn.cursor()

        # students टेबल में photo_path चेक करें
        cursor.execute("PRAGMA table_info(students)")
        student_cols = [c[1] for c in cursor.fetchall()]
        if 'photo_path' not in student_cols:
            cursor.execute("ALTER TABLE students ADD COLUMN photo_path TEXT")

        # fee_records टेबल में नए कॉलम्स जोड़ें
        cursor.execute("PRAGMA table_info(fee_records)")
        fee_cols = [c[1] for c in cursor.fetchall()]
        new_cols = {
            "total_monthly_payable": "FLOAT DEFAULT 0.0",
            "exam_fee_per_term": "FLOAT DEFAULT 500.0",
            "total_exam_payable": "FLOAT DEFAULT 1000.0"
        }
        for col, col_type in new_cols.items():
            if col not in fee_cols:
                try: cursor.execute(f"ALTER TABLE fee_records ADD COLUMN {col} {col_type}")
                except: pass
        conn.commit()
        conn.close()

        # 2. school_mgmt.db को फोर्स क्रिएट करें (यदि मौजूद न हो)
        conn_mgmt = sqlite3.connect('school_mgmt.db')
        conn_mgmt.execute("CREATE TABLE IF NOT EXISTS init_check (id INTEGER PRIMARY KEY)")
        conn_mgmt.close()
        print("✅ Databases synchronized successfully.")