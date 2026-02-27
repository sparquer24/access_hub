"""
Report generation and download endpoints
Handles creation and delivery of various report types
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from ...utils.decorators import role_required
from ...utils.helpers import success_response, error_response
import os
import csv
import tempfile
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('reports', __name__, url_prefix='/api/v2/reports')


@bp.route('/download', methods=['POST'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def download_report():
    """
    Download report based on type and filters
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tab
          properties:
            tab:
              type: string
              enum: [attendance, leaves, performance, projects, summary]
              example: "attendance"
              description: Report type to generate
            filters:
              type: object
              description: Report filters (varies by tab)
              properties:
                start_date:
                  type: string
                  format: date
                  description: Start date (YYYY-MM-DD)
                end_date:
                  type: string
                  format: date
                  description: End date (YYYY-MM-DD)
                employee_id:
                  type: string
                  description: Filter by employee ID
                department_id:
                  type: string
                  description: Filter by department
                organization_id:
                  type: string
                  description: Filter by organization
            format:
              type: string
              enum: [csv, pdf, xlsx]
              default: csv
              description: Output file format
    responses:
      200:
        description: Report file generated successfully
        schema:
          type: file
      400:
        description: Invalid report parameters
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Report generation failed
        schema:
          type: object
          properties:
            error:
              type: string
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        data = request.get_json() or {}
        tab = data.get('tab')
        filters = data.get('filters', {})
        file_format = data.get('format', 'csv').lower()

        # Validate inputs
        if not tab:
            return error_response(
                message="'tab' parameter is required",
                status_code=400
            )

        valid_tabs = ['attendance', 'leaves', 'performance', 'projects', 'summary']
        if tab not in valid_tabs:
            return error_response(
                message=f"Invalid tab. Must be one of: {', '.join(valid_tabs)}",
                status_code=400
            )

        valid_formats = ['csv', 'pdf', 'xlsx']
        if file_format not in valid_formats:
            return error_response(
                message=f"Invalid format. Must be one of: {', '.join(valid_formats)}",
                status_code=400
            )

        # Generate report
        report_path = _generate_report(tab, filters, file_format)

        if not report_path or not os.path.exists(report_path):
            return error_response(
                message="Report generation failed",
                status_code=500
            )

        # Determine MIME type
        mime_types = {
            'csv': 'text/csv',
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }

        # Send file
        filename = f"{tab}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_format}"
        return send_file(
            report_path,
            mimetype=mime_types.get(file_format, 'application/octet-stream'),
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}")
        return error_response(
            message="Error generating report",
            status_code=500
        )


@bp.route('/preview', methods=['POST'])
@jwt_required()
@role_required('employee', 'manager', 'org_admin', 'super_admin')
def preview_report():
    """
    Preview report data without downloading
    ---
    tags:
      - Reports
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tab
          properties:
            tab:
              type: string
              enum: [attendance, leaves, performance, projects, summary]
            filters:
              type: object
            limit:
              type: integer
              default: 10
              description: Number of rows to preview
    responses:
      200:
        description: Report preview data
        schema:
          type: object
          properties:
            success:
              type: boolean
            data:
              type: object
              properties:
                headers:
                  type: array
                  items:
                    type: string
                rows:
                  type: array
                  items:
                    type: array
                total_rows:
                  type: integer
      400:
        $ref: '#/responses/BadRequestError'
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    try:
        data = request.get_json() or {}
        tab = data.get('tab')
        filters = data.get('filters', {})
        limit = min(int(data.get('limit', 10)), 100)  # Max 100 rows preview

        if not tab:
            return error_response(
                message="'tab' parameter is required",
                status_code=400
            )

        valid_tabs = ['attendance', 'leaves', 'performance', 'projects', 'summary']
        if tab not in valid_tabs:
            return error_response(
                message=f"Invalid tab. Must be one of: {', '.join(valid_tabs)}",
                status_code=400
            )

        # Get preview data
        preview_data = _get_report_preview(tab, filters, limit)

        if not preview_data:
            return error_response(
                message="No data available for report",
                status_code=404
            )

        return success_response(
            data={
                'headers': preview_data['headers'],
                'rows': preview_data['rows'],
                'total_rows': preview_data['total_rows'],
                'preview_count': len(preview_data['rows'])
            },
            message='Report preview generated successfully'
        )

    except Exception as e:
        logger.error(f"Error previewing report: {str(e)}")
        return error_response(
            message="Error generating report preview",
            status_code=500
        )


def _generate_report(tab, filters, file_format='csv'):
    """
    Generate report file based on tab and filters
    
    Args:
        tab: Report type (attendance, leaves, performance, projects, summary)
        filters: Dictionary of filters to apply
        file_format: Output format (csv, pdf, xlsx)
    
    Returns:
        Path to generated file or None if generation failed
    """
    try:
        # Get report data
        data = _get_report_data(tab, filters)
        
        if not data or not data.get('rows'):
            return None

        # Generate file based on format
        if file_format == 'csv':
            return _generate_csv(tab, data)
        elif file_format == 'pdf':
            return _generate_pdf(tab, data)
        elif file_format == 'xlsx':
            return _generate_xlsx(tab, data)
        
        return None

    except Exception as e:
        logger.error(f"Error generating {file_format} report: {str(e)}")
        return None


def _get_report_data(tab, filters):
    """
    Retrieve report data from database based on tab type
    
    Args:
        tab: Report type
        filters: Filter criteria
    
    Returns:
        Dictionary with headers and rows
    """
    try:
        # Placeholder implementation - replace with actual data retrieval
        if tab == 'attendance':
            return _get_attendance_report_data(filters)
        elif tab == 'leaves':
            return _get_leaves_report_data(filters)
        elif tab == 'performance':
            return _get_performance_report_data(filters)
        elif tab == 'projects':
            return _get_projects_report_data(filters)
        elif tab == 'summary':
            return _get_summary_report_data(filters)
        
        return None

    except Exception as e:
        logger.error(f"Error fetching report data for tab '{tab}': {str(e)}")
        return None


def _get_report_preview(tab, filters, limit=10):
    """
    Get limited preview of report data
    
    Args:
        tab: Report type
        filters: Filter criteria
        limit: Maximum rows to preview
    
    Returns:
        Dictionary with headers, limited rows, and total count
    """
    try:
        data = _get_report_data(tab, filters)
        
        if not data:
            return None
        
        return {
            'headers': data.get('headers', []),
            'rows': data.get('rows', [])[:limit],
            'total_rows': len(data.get('rows', []))
        }

    except Exception as e:
        logger.error(f"Error generating report preview: {str(e)}")
        return None


def _get_attendance_report_data(filters):
    """Generate attendance report data"""
    # TODO: Implement actual attendance report generation
    return {
        'headers': ['Date', 'Employee', 'Check In', 'Check Out', 'Hours', 'Status'],
        'rows': []
    }


def _get_leaves_report_data(filters):
    """Generate leave requests report data"""
    # TODO: Implement actual leaves report generation
    return {
        'headers': ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status'],
        'rows': []
    }


def _get_performance_report_data(filters):
    """Generate performance report data"""
    # TODO: Implement actual performance report generation
    return {
        'headers': ['Employee', 'Department', 'Rating', 'Attendance %', 'Projects', 'Notes'],
        'rows': []
    }


def _get_projects_report_data(filters):
    """Generate projects report data"""
    # TODO: Implement actual projects report generation
    return {
        'headers': ['Project', 'Employees', 'Status', 'Completion %', 'Start Date', 'End Date'],
        'rows': []
    }


def _get_summary_report_data(filters):
    """Generate summary report data"""
    # TODO: Implement actual summary report generation
    return {
        'headers': ['Metric', 'Value', 'Change', 'Status'],
        'rows': []
    }


def _generate_csv(tab, data):
    """Generate CSV file from report data"""
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.csv',
            delete=False,
            newline='',
            encoding='utf-8'
        ) as f:
            writer = csv.writer(f)
            
            # Write headers
            if data.get('headers'):
                writer.writerow(data['headers'])
            
            # Write rows
            if data.get('rows'):
                writer.writerows(data['rows'])
            
            return f.name

    except Exception as e:
        logger.error(f"Error generating CSV report: {str(e)}")
        return None


def _generate_pdf(tab, data):
    """Generate PDF file from report data"""
    try:
        # TODO: Implement PDF generation using reportlab or similar
        # Placeholder implementation
        with tempfile.NamedTemporaryFile(
            suffix='.pdf',
            delete=False
        ) as f:
            # Placeholder: would use reportlab or similar library
            f.write(b'PDF content placeholder')
            return f.name

    except Exception as e:
        logger.error(f"Error generating PDF report: {str(e)}")
        return None


def _generate_xlsx(tab, data):
    """Generate Excel file from report data"""
    try:
        # TODO: Implement Excel generation using openpyxl or xlsxwriter
        # Placeholder implementation
        with tempfile.NamedTemporaryFile(
            suffix='.xlsx',
            delete=False
        ) as f:
            # Placeholder: would use openpyxl or xlsxwriter
            f.write(b'XLSX content placeholder')
            return f.name

    except Exception as e:
        logger.error(f"Error generating XLSX report: {str(e)}")
        return None
