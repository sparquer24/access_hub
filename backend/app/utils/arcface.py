import numpy as np
import cv2

class FaceEmbedder:
    def __init__(self):
        self.model_name = "ArcFace"
        self._deepface = None

    def _get_deepface(self):
        """Lazy load DeepFace on first use to avoid import issues at startup"""
        if self._deepface is None:
            try:
                from deepface import DeepFace as DF
                self._deepface = DF
            except Exception as e:
                raise ImportError(f"Failed to import DeepFace: {e}")
        return self._deepface

    def get_embedding(self, face_bgr):
        # DeepFace expects RGB images
        DeepFace = self._get_deepface()
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        face_rgb = cv2.resize(face_rgb, (112, 112))  # ArcFace expects 112x112
        face_rgb = face_rgb / 255.0  # Optional: normalize

        try:
            result = DeepFace.represent(
                img_path=face_rgb,
                model_name=self.model_name,
                enforce_detection=False,
                detector_backend='skip'
            )
            return np.array(result[0]["embedding"], dtype=np.float32)
        except Exception as e:
            print(f"[ERROR] Failed to extract embedding: {e}")
            return None



# import numpy as np
# import cv2
# import onnxruntime as ort
# import os

# class FaceEmbedder:
#     def __init__(self):
#         model_path = os.path.join(os.path.dirname(__file__), "arc.onnx")

#         # Prefer GPU, fallback to CPU
#         self.session = ort.InferenceSession(
#             model_path,
#             providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
#         )

#         self.input_name = self.session.get_inputs()[0].name
#         self.output_name = self.session.get_outputs()[0].name

#     def get_embedding(self, face_bgr):
#         face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
#         face_rgb = cv2.resize(face_rgb, (112, 112))
#         face_rgb = face_rgb / 255.0

#         input_tensor = np.transpose(face_rgb, (2, 0, 1)).astype(np.float32)
#         input_tensor = np.expand_dims(input_tensor, axis=0)

#         try:
#             outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
#             embedding = outputs[0][0]
#             return np.array(embedding, dtype=np.float32)
#         except Exception as e:
#             print(f"[ERROR] Failed to extract embedding from arc.onnx: {e}")
#             return None
