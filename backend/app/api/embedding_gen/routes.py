                                                                                                                                                                        
import threading

from flask import Blueprint, request, jsonify                                                                                                                                                             

from app.utils.face_enrollment_background import process_face_enrollment_background



face_enroll_bp = Blueprint("face_enroll_bp", __name__, url_prefix="/api/v1")



@face_enroll_bp.route("/face/enroll", methods=["POST"])

def face_enroll():
    """
    Enroll face for recognition (Employee or Visitor)
    ---
    tags:
      - Face Recognition
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - entity_id
            - img_b64
          properties:
            entity_id:
              type: string
              description: Entity ID (Employee ID or Visitor ID)
              example: "emp-123"
            img_b64:
              type: string
              description: Base64 encoded image
              example: "iVBORw0KGgoAAAANS..."
    responses:
      200:
        description: Face enrollment processed successfully
        schema:
          type: object
          properties:
            ok:
              type: boolean
              example: true
            message:
              type: string
              example: "Enrollment processed"
      400:
        description: Missing required fields
        schema:
          type: object
          properties:
            ok:
              type: boolean
              example: false
            error:
              type: string
              example: "entity_id and img_b64 are required"
      401:
        $ref: '#/responses/UnauthorizedError'
    """
    data = request.get_json(silent=True) or {}
    entity_id = data.get("entity_id")
    img_b64 = data.get("img_b64")

    if not entity_id or not img_b64:
        return jsonify({
            "ok": False,
            "error": "entity_id and img_b64 are required"
        }), 400

    # Runs the heavy pipeline in-request (will block)
    process_face_enrollment_background(employee_id=entity_id, img_b64=img_b64)

