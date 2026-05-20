from app.database import SessionLocalMgmt
from app.models import User
import sys

# --- कॉन्फ़िगरेशन ---
# अपना मनचाहा यूज़रनेम और पासवर्ड यहाँ सेट करें
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "password"
# --------------------

print("Connecting to the database...")
db = SessionLocalMgmt()

# चेक करें कि यूज़र पहले से मौजूद है या नहीं
user = db.query(User).filter(User.username == ADMIN_USERNAME).first()

if not user:
    print(f"User '{ADMIN_USERNAME}' not found. Creating a new admin user...")
    
    # चेतावनी: यह असुरक्षित है। प्रोडक्शन में हमेशा पासवर्ड हैश करके स्टोर करें।
    # अभी के लिए, हम वही तरीका अपना रहे हैं जो शायद आपके लॉगिन में है।
    new_user = User(
        username=ADMIN_USERNAME,
        password=ADMIN_PASSWORD, 
        role="admin"
    )
    
    db.add(new_user)
    db.commit()
    
    print(f"Admin user '{ADMIN_USERNAME}' created successfully.")
else:
    print(f"User '{ADMIN_USERNAME}' already exists.")

db.close()
print("Process finished.")

