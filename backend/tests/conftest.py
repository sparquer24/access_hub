import os
import sys
import pytest
import json
from sqlalchemy.types import TypeDecorator, String
import sqlalchemy.dialects.postgresql

# Mock ARRAY for SQLite
class MockARRAY(TypeDecorator):
    impl = String
    def __init__(self, item_type, as_tuple=False, dimensions=None, zero_indexes=False):
        super().__init__()
        self.item_type = item_type

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value

# Patch ARRAY before importing app
sqlalchemy.dialects.postgresql.ARRAY = MockARRAY

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import User, Role, Organization, Department
from app.services.auth_service import AuthService


@pytest.fixture(scope='function')
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope='function')
def client(app):
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def setup_test_data(app):
    with app.app_context():
        role = Role(id='1', name='admin', description='Admin role')
        db.session.add(role)
        db.session.commit()
        
        user = User(
            username='testuser',
            email='test@example.com',
            password_hash='hashed_password',
            role_id='1',
            is_active=True
        )
        db.session.add(user)
        db.session.commit()
        
        org1 = Organization(
            name='Test Organization 1',
            code='ORG001',
            organization_type='office',
            subscription_tier='basic',
            is_active=True
        )
        org2 = Organization(
            name='Test Organization 2',
            code='ORG002',
            organization_type='school',
            subscription_tier='premium',
            is_active=True
        )
        db.session.add(org1)
        db.session.add(org2)
        db.session.commit()
        
        dept1 = Department(
            organization_id=org1.id,
            name='Engineering',
            code='ENG',
            description='Engineering Department',
            is_active=True
        )
        dept2 = Department(
            organization_id=org1.id,
            name='Sales',
            code='SALES',
            description='Sales Department',
            is_active=True
        )
        dept3 = Department(
            organization_id=org1.id,
            name='HR',
            code='HR',
            description='Human Resources',
            is_active=False
        )
        dept4 = Department(
            organization_id=org2.id,
            name='Administration',
            code='ADM',
            description='Administration',
            is_active=True
        )
        db.session.add_all([dept1, dept2, dept3, dept4])
        db.session.commit()
        
        token = AuthService.generate_token(user)
        
        return {
            'user': user,
            'token': token,
            'org1': org1,
            'org2': org2,
            'departments': {
                'dept1': dept1,
                'dept2': dept2,
                'dept3': dept3,
                'dept4': dept4
            }
        }
