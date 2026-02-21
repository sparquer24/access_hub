"""
API documentation generator and endpoint discovery
"""

import os
import importlib
import inspect
from flask import Flask, Blueprint, jsonify, request
from typing import Dict, List, Any
import json
import re


class APIDocumentationGenerator:
    """Generate API documentation automatically"""
    
    def __init__(self, app: Flask = None):
        self.app = app
        self.endpoints = {}
        self.models = {}
        
    def discover_endpoints(self):
        """Discover all API endpoints in the application"""
        if not self.app:
            return {}
        
        endpoints = {}
        
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint.startswith('static'):
                continue
            
            endpoint_info = {
                'url': rule.rule,
                'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
                'endpoint': rule.endpoint,
                'parameters': {},
                'description': '',
                'request_schema': None,
                'response_schema': None,
                'authentication': 'required',  # default assumption
                'authorization': []
            }
            
            # Get view function
            view_func = self.app.view_functions.get(rule.endpoint)
            if view_func:
                # Extract documentation from docstring
                if view_func.__doc__:
                    endpoint_info['description'] = view_func.__doc__.strip()
                
                # Extract parameter information
                if rule.arguments:
                    for arg in rule.arguments:
                        endpoint_info['parameters'][arg] = {
                            'type': 'path',
                            'required': True,
                            'description': f'Path parameter: {arg}'
                        }
                
                # Analyze function decorators and annotations
                endpoint_info.update(self._analyze_function(view_func))
            
            endpoints[rule.endpoint] = endpoint_info
        
        return endpoints
    
    def _analyze_function(self, func):
        """Analyze function for authentication, authorization, and schemas"""
        info = {
            'authentication': 'none',
            'authorization': [],
            'request_schema': None,
            'response_schema': None
        }
        
        # Check for authentication decorators by examining closure variables
        if hasattr(func, '__wrapped__'):
            # Function has decorators
            info['authentication'] = 'required'
        
        # Look for common decorator patterns in the function name or module
        func_source = inspect.getsource(func) if func else ''
        
        if '@jwt_required' in func_source or 'jwt_required' in str(func):
            info['authentication'] = 'jwt_token'
        
        if '@role_required' in func_source:
            # Try to extract required roles
            role_match = re.search(r'@role_required\(\[(.+?)\]\)', func_source)
            if role_match:
                roles_str = role_match.group(1)
                roles = [role.strip().strip("'\"") for role in roles_str.split(',')]
                info['authorization'] = roles
        
        return info
    
    def discover_models(self):
        """Discover SQLAlchemy models for schema documentation"""
        models = {}
        
        try:
            # Import models
            from app.models import user, employee, department, organization, attendance, leave
            
            model_modules = [user, employee, department, organization, attendance, leave]
            
            for module in model_modules:
                for name in dir(module):
                    obj = getattr(module, name)
                    if (inspect.isclass(obj) and 
                        hasattr(obj, '__tablename__') and 
                        hasattr(obj, '__table__')):
                        
                        models[name] = self._extract_model_schema(obj)
        
        except Exception as e:
            print(f"Error discovering models: {e}")
        
        return models
    
    def _extract_model_schema(self, model_class):
        """Extract schema information from SQLAlchemy model"""
        schema = {
            'table_name': getattr(model_class, '__tablename__', ''),
            'fields': {},
            'relationships': {}
        }
        
        # Extract columns
        if hasattr(model_class, '__table__'):
            for column in model_class.__table__.columns:
                field_info = {
                    'type': str(column.type),
                    'nullable': column.nullable,
                    'primary_key': column.primary_key,
                    'foreign_key': column.foreign_keys != set(),
                    'default': str(column.default) if column.default else None
                }
                
                if hasattr(column, 'comment') and column.comment:
                    field_info['description'] = column.comment
                
                schema['fields'][column.name] = field_info
        
        # Extract relationships
        if hasattr(model_class, '__mapper__'):
            for rel_name, relationship in model_class.__mapper__.relationships.items():
                schema['relationships'][rel_name] = {
                    'target_model': relationship.mapper.class_.__name__,
                    'type': 'one-to-many' if relationship.uselist else 'many-to-one'
                }
        
        return schema
    
    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Generate OpenAPI 3.0 specification"""
        endpoints = self.discover_endpoints()
        models = self.discover_models()
        
        spec = {
            'openapi': '3.0.0',
            'info': {
                'title': 'VMS (Visitor Management System) API',
                'description': 'API documentation for VMS backend services',
                'version': '1.0.0'
            },
            'servers': [
                {
                    'url': 'http://localhost:5000',
                    'description': 'Development server'
                }
            ],
            'components': {
                'securitySchemes': {
                    'bearerAuth': {
                        'type': 'http',
                        'scheme': 'bearer',
                        'bearerFormat': 'JWT'
                    }
                },
                'schemas': self._convert_models_to_openapi_schemas(models)
            },
            'paths': self._convert_endpoints_to_openapi_paths(endpoints)
        }
        
        return spec
    
    def _convert_models_to_openapi_schemas(self, models: Dict) -> Dict[str, Any]:
        """Convert SQLAlchemy models to OpenAPI schemas"""
        schemas = {}
        
        for model_name, model_info in models.items():
            properties = {}
            required = []
            
            for field_name, field_info in model_info['fields'].items():
                prop = {}
                
                # Map SQLAlchemy types to OpenAPI types
                sql_type = field_info['type'].lower()
                if 'integer' in sql_type:
                    prop['type'] = 'integer'
                elif 'varchar' in sql_type or 'text' in sql_type or 'string' in sql_type:
                    prop['type'] = 'string'
                elif 'boolean' in sql_type:
                    prop['type'] = 'boolean'
                elif 'datetime' in sql_type:
                    prop['type'] = 'string'
                    prop['format'] = 'date-time'
                elif 'date' in sql_type:
                    prop['type'] = 'string'
                    prop['format'] = 'date'
                elif 'decimal' in sql_type or 'numeric' in sql_type:
                    prop['type'] = 'number'
                else:
                    prop['type'] = 'string'
                
                if 'description' in field_info:
                    prop['description'] = field_info['description']
                
                properties[field_name] = prop
                
                if not field_info['nullable'] and not field_info['primary_key']:
                    required.append(field_name)
            
            schemas[model_name] = {
                'type': 'object',
                'properties': properties
            }
            
            if required:
                schemas[model_name]['required'] = required
        
        return schemas
    
    def _convert_endpoints_to_openapi_paths(self, endpoints: Dict) -> Dict[str, Any]:
        """Convert endpoints to OpenAPI paths"""
        paths = {}
        
        for endpoint_name, endpoint_info in endpoints.items():
            url = endpoint_info['url']
            
            # Convert Flask route parameters to OpenAPI format
            openapi_url = re.sub(r'<(\w+:)?(\w+)>', r'{\2}', url)
            
            if openapi_url not in paths:
                paths[openapi_url] = {}
            
            for method in endpoint_info['methods']:
                method_lower = method.lower()
                
                operation = {
                    'summary': endpoint_info['description'].split('\n')[0] if endpoint_info['description'] else f'{method} {url}',
                    'description': endpoint_info['description'] or f'{method} operation for {url}',
                    'responses': {
                        '200': {
                            'description': 'Successful response',
                            'content': {
                                'application/json': {
                                    'schema': {
                                        'type': 'object',
                                        'properties': {
                                            'success': {'type': 'boolean'},
                                            'message': {'type': 'string'},
                                            'data': {'type': 'object'}
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            'description': 'Bad request'
                        },
                        '401': {
                            'description': 'Unauthorized'
                        },
                        '403': {
                            'description': 'Forbidden'
                        },
                        '404': {
                            'description': 'Not found'
                        },
                        '500': {
                            'description': 'Internal server error'
                        }
                    }
                }
                
                # Add authentication if required
                if endpoint_info['authentication'] != 'none':
                    operation['security'] = [{'bearerAuth': []}]
                
                # Add parameters
                parameters = []
                for param_name, param_info in endpoint_info['parameters'].items():
                    parameters.append({
                        'name': param_name,
                        'in': param_info['type'],
                        'required': param_info['required'],
                        'description': param_info['description'],
                        'schema': {'type': 'string'}
                    })
                
                if parameters:
                    operation['parameters'] = parameters
                
                # Add request body for POST/PUT methods
                if method_lower in ['post', 'put', 'patch']:
                    operation['requestBody'] = {
                        'required': True,
                        'content': {
                            'application/json': {
                                'schema': {'type': 'object'}
                            }
                        }
                    }
                
                paths[openapi_url][method_lower] = operation
        
        return paths
    
    def generate_postman_collection(self) -> Dict[str, Any]:
        """Generate Postman collection"""
        endpoints = self.discover_endpoints()
        
        collection = {
            'info': {
                'name': 'VMS API Collection',
                'description': 'Postman collection for VMS API endpoints',
                'version': '1.0.0'
            },
            'variable': [
                {
                    'key': 'baseUrl',
                    'value': 'http://localhost:5000',
                    'type': 'string'
                },
                {
                    'key': 'token',
                    'value': '',
                    'type': 'string'
                }
            ],
            'auth': {
                'type': 'bearer',
                'bearer': [
                    {
                        'key': 'token',
                        'value': '{{token}}',
                        'type': 'string'
                    }
                ]
            },
            'item': []
        }
        
        # Group endpoints by module
        grouped_endpoints = {}
        for endpoint_name, endpoint_info in endpoints.items():
            module = endpoint_name.split('.')[0] if '.' in endpoint_name else 'general'
            if module not in grouped_endpoints:
                grouped_endpoints[module] = []
            grouped_endpoints[module].append((endpoint_name, endpoint_info))
        
        for module, module_endpoints in grouped_endpoints.items():
            folder = {
                'name': module.title(),
                'item': []
            }
            
            for endpoint_name, endpoint_info in module_endpoints:
                for method in endpoint_info['methods']:
                    request_item = {
                        'name': f"{method} {endpoint_info['url']}",
                        'request': {
                            'method': method,
                            'header': [
                                {
                                    'key': 'Content-Type',
                                    'value': 'application/json'
                                }
                            ],
                            'url': {
                                'raw': '{{baseUrl}}' + endpoint_info['url'],
                                'host': ['{{baseUrl}}'],
                                'path': endpoint_info['url'].strip('/').split('/')
                            }
                        },
                        'response': []
                    }
                    
                    if method in ['POST', 'PUT', 'PATCH']:
                        request_item['request']['body'] = {
                            'mode': 'raw',
                            'raw': '{\n  \n}',
                            'options': {
                                'raw': {
                                    'language': 'json'
                                }
                            }
                        }
                    
                    folder['item'].append(request_item)
            
            collection['item'].append(folder)
        
        return collection


def create_documentation_routes(app: Flask):
    """Create documentation routes"""
    doc_generator = APIDocumentationGenerator(app)
    
    doc_bp = Blueprint('docs', __name__, url_prefix='/api/docs')
    
    @doc_bp.route('/openapi.json', methods=['GET'])
    def openapi_spec():
        """Get OpenAPI specification"""
        spec = doc_generator.generate_openapi_spec()
        return jsonify(spec)
    
    @doc_bp.route('/postman.json', methods=['GET'])
    def postman_collection():
        """Get Postman collection"""
        collection = doc_generator.generate_postman_collection()
        return jsonify(collection)
    
    @doc_bp.route('/endpoints', methods=['GET'])
    def list_endpoints():
        """List all API endpoints"""
        endpoints = doc_generator.discover_endpoints()
        return jsonify({
            'total': len(endpoints),
            'endpoints': endpoints
        })
    
    @doc_bp.route('/models', methods=['GET'])
    def list_models():
        """List all data models"""
        models = doc_generator.discover_models()
        return jsonify({
            'total': len(models),
            'models': models
        })
    
    app.register_blueprint(doc_bp)
    return doc_generator