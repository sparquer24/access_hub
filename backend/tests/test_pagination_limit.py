import pytest
import json
from app.models import Department

class TestPaginationLimit:
    
    def test_pagination_limit_increase(self, client, setup_test_data):
        """Test that per_page can be greater than 100"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        # Create enough departments to test pagination if needed, 
        # but here we just want to check if the parameter is accepted
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?per_page=200',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        assert data['data']['pagination']['per_page'] == 200

    def test_pagination_limit_exceeded(self, client, setup_test_data):
        """Test that per_page > 1000 is still rejected"""
        org_id = setup_test_data['org1'].id
        token = setup_test_data['token']
        
        response = client.get(
            f'/api/v2/departments/by-organization/{org_id}?per_page=1001',
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data['success'] is False
        assert 'per_page' in data['errors']
