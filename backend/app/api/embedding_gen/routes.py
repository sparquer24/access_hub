                                                                                                                                                                        
import threading

from flask import Blueprint, request, jsonify                                                                                                                                                             

from app.utils.face_enrollment_background import process_face_enrollment_background



face_enroll_bp = Blueprint("face_enroll_bp", __name__, url_prefix="/api/v1")



@face_enroll_bp.route("/face/enroll", methods=["POST"])

def face_enroll():

  """

  Enroll employee face for recognition

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

          - employee_id

          - img_b64

        properties:

          employee_id:

            type: string

            description: Employee ID for enrollment

            example: "emp-123"

          img_b64:

            type: string

            description: Base64 encoded image

            example: "iVBORw0KGgoAAAANS..."

  responses:

    202:

      description: Face enrollment accepted and processing in background

      schema:

        type: object

        properties:

          ok:

            type: boolean

            example: true

          message:

            type: string

            example: "Enrollment started"

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

            example: "employee_id and img_b64 are required"

    401:

      $ref: '#/responses/UnauthorizedError'

  """

  data = request.get_json(silent=True) or {}

  employee_id = data.get("employee_id")

  img_b64 = data.get("img_b64")



  if not employee_id or not img_b64:

      return jsonify({

          "ok": False,

          "error": "employee_id and img_b64 are required"

      }), 400



  # Run heavy pipeline in background thread so API responds immediately

  thread = threading.Thread(

      target=process_face_enrollment_background,

      kwargs={"employee_id": employee_id, "img_b64": img_b64},

      daemon=True,

  )

  thread.start()



  return jsonify({

      "ok": True,

      "message": "Enrollment started"

  }), 202

