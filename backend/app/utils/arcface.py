import numpy as np
import cv2
import onnxruntime as ort
import os

class FaceEmbedder:
    def __init__(self):
        model_path = os.path.join(os.path.dirname(__file__), "arc.onnx")

        self.session = ort.InferenceSession(
            model_path,
            providers=["CPUExecutionProvider"]
        )

        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def get_embedding(self, face_bgr):
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        face_rgb = cv2.resize(face_rgb, (112, 112))
        face_rgb = face_rgb / 255.0

        input_tensor = face_rgb.astype(np.float32)
        input_tensor = np.expand_dims(input_tensor, axis=0)

        try:
            outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
            embedding = outputs[0][0]
            return np.array(embedding, dtype=np.float32)
        except Exception as e:
            print(f"[ERROR] Failed to extract embedding from arc.onnx: {e}")
            return None
