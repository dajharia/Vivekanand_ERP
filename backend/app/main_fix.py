import sqlite3

# डेटाबेस फिक्स करने का फंक्शन
def fix_database_schema():
    # 1. Student Database Fix (students टेबल में photo_path कॉलम जोड़ना)
    conn = sqlite3.connect('school.db') # पक्का करें कि आपकी फाइल का नाम यही है
    cursor = conn.cursor()
    try:
        # चेक करें कि photo_path कॉलम है या नहीं
        cursor.execute("PRAGMA table_info(students)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'photo_path' not in columns:
            cursor.execute("ALTER TABLE students ADD COLUMN photo_path TEXT")
            print("✅ 'photo_path' कॉलम सफलतापूर्वक जुड़ गया।")
            
        conn.commit()
    except Exception as e:
        print(f"⚠️ Student DB Fix Error: {e}")
    finally:
        conn.close()

    # 2. Mgmt Database Fix (Fee Tables सुनिश्चित करना)
    # यह हिस्सा models.create_all() पहले ही संभाल लेता है, 
    # लेकिन कॉलम मिसिंग होने पर आप यहाँ भी ALTER कमांड चला सकते हैं।

# FastAPI स्टार्ट होने से पहले इसे चलाएं
fix_database_schema()