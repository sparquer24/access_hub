"""
Seeds a default Admin so you can log in immediately.

Run:
  $env:FLASK_APP = "wsgi:app"
  python scripts/seed_admin.py
"""
from app import create_app
from app.extensions import db, bcrypt
from app.models import UserDetails

def main():
    app = create_app()
    with app.app_context():
        u = UserDetails.query.filter_by(login_id="AE21D018").first()
        if u:
            print("Admin already exists:", u.login_id)
            return

        admin = UserDetails(
            full_name="Admin User",
            gender="Male",
            phone_number="9999999999",
            email="admin@example.com",
            employee_id="E0001",
            tower="HQ",
            login_id="AE21D018",
            role="Admin",
            password_hash=bcrypt.generate_password_hash("123456").decode(),
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        print("Seeded admin AE21D018 / 123456")

if __name__ == "__main__":
    main()
