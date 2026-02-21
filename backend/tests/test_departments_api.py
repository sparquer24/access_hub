import json
import pytest
from app.models import Department


class TestDepartmentsByOrganization:
    
    def test_get_departments_by_organization_success(self, client, setup_test_data):
        """Test fetching departments for a specific organization"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert 'data' in data
        assert 'items' in data['data']
        assert 'pagination' in data['data']
        assert len(data['data']['items']) == 3
    
    def test_get_departments_by_organization_pagination(self, client, setup_test_data):
        """Test pagination in departments listing"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?page=1&per_page=2',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 2
        assert data['data']['pagination']['page'] == 1
        assert data['data']['pagination']['per_page'] == 2
        assert data['data']['pagination']['total_items'] == 3
    
    def test_get_departments_by_organization_filter_active(self, client, setup_test_data):
        """Test filtering departments by active status"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?is_active=true',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        active_depts = data['data']['items']
        assert len(active_depts) == 2
        assert all(dept['is_active'] for dept in active_depts)
    
    def test_get_departments_by_organization_filter_inactive(self, client, setup_test_data):
        """Test filtering inactive departments"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?is_active=false',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        inactive_depts = data['data']['items']
        assert len(inactive_depts) == 1
        assert not inactive_depts[0]['is_active']
    
    def test_get_departments_by_organization_search(self, client, setup_test_data):
        """Test searching departments by name"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?search=Engineer',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 1
        assert data['data']['items'][0]['name'] == 'Engineering'
    
    def test_get_departments_by_organization_search_code(self, client, setup_test_data):
        """Test searching departments by code"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?search=SALES',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 1
        assert data['data']['items'][0]['code'] == 'SALES'
    
    def test_get_departments_different_organizations(self, client, setup_test_data):
        """Test that departments are isolated by organization"""
        org1_id = setup_test_data['org1'].id
        org2_id = setup_test_data['org2'].id
        token = setup_test_data['token']
        
        response1 = client.get(
            f'/api/v2/departments/by-organization/{org1_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        response2 = client.get(
            f'/api/v2/departments/by-organization/{org2_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        
        assert len(data1['data']['items']) == 3
        assert len(data2['data']['items']) == 1
        assert data2['data']['items'][0]['name'] == 'Administration'
    
    def test_get_departments_without_token(self, client, setup_test_data):
        """Test that request without token is rejected"""
        org_id = setup_test_data['org1'].id
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}'
        )
        
        assert response.status_code == 401
    
    def test_get_departments_with_invalid_token(self, client, setup_test_data):
        """Test that request with invalid token is rejected"""
        org_id = setup_test_data['org1'].id
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}',
            headers={'Authorization': 'Bearer invalid_token_123'}
        )
        
        assert response.status_code == 422
    
    def test_get_departments_empty_organization(self, client, setup_test_data, app):
        """Test fetching departments for organization with no departments"""
        from app.models import Organization
        
        with app.app_context():
            empty_org = Organization(
                name='Empty Organization',
                code='EMPTY',
                organization_type='office',
                subscription_tier='basic',
                is_active=True
            )
            from app import db
            db.session.add(empty_org)
            db.session.commit()
            empty_org_id = empty_org.id
        
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{empty_org_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 0
        assert data['data']['pagination']['total_items'] == 0
    
    def test_get_departments_response_structure(self, client, setup_test_data):
        """Test response structure matches expected schema"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'success' in data
        assert 'message' in data
        assert 'data' in data
        
        assert 'items' in data['data']
        assert 'pagination' in data['data']
        
        pagination = data['data']['pagination']
        assert 'page' in pagination
        assert 'per_page' in pagination
        assert 'total_items' in pagination
        assert 'total_pages' in pagination
        assert 'has_next' in pagination
        assert 'has_prev' in pagination
        
        dept = data['data']['items'][0]
        assert 'id' in dept
        assert 'name' in dept
        assert 'code' in dept
        assert 'description' in dept
        assert 'organization_id' in dept
        assert 'is_active' in dept
        assert 'created_at' in dept
        assert 'updated_at' in dept
    
    def test_get_departments_combined_filters(self, client, setup_test_data):
        """Test combining multiple filters"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?is_active=true&search=Sales',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 1
        assert data['data']['items'][0]['name'] == 'Sales'
        assert data['data']['items'][0]['is_active'] is True


class TestListDepartmentsEndpoint:
    
    def test_list_departments_without_org_filter(self, client, setup_test_data):
        """Test listing all departments without organization filter"""
        token = setup_test_data['token']
        
        response = client.get(
            '/api/v2/departments',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) >= 3
    
    def test_list_departments_with_org_filter(self, client, setup_test_data):
        """Test listing departments with organization_id query parameter"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments?organization_id={org_id}',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']['items']) == 3
