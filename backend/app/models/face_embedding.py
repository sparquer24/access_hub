from ..extensions import db
from datetime import datetime
import uuid


class FaceEmbedding(db.Model):
    """
    Face embedding storage for face recognition.
    Stores embedding vectors and metadata.
    """
    __tablename__ = "face_embeddings"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Employee relationship
    employee_id = db.Column(db.String(36), db.ForeignKey("employees.id"), nullable=False, index=True)
    employee = db.relationship("Employee", back_populates="face_embeddings")
    
    # Organization relationship (for tenant isolation)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    organization = db.relationship("Organization", back_populates="face_embeddings")
    
    # Embedding data
    # Store as JSON for PostgreSQL, or use vector type if available
    embedding_vector = db.Column(db.JSON, nullable=False)  # 128 or 512 dimensional array
    
    # Model metadata
    model_version = db.Column(db.String(50), nullable=False)  # Track which model generated this
    quality_score = db.Column(db.Float)  # Face image quality (0-1)
    
    # Image reference
    image_url = db.Column(db.String(512))  # Cloud storage URL or local path
    
    # Primary face indicator
    is_primary = db.Column(db.Boolean, default=False)
    
    # Audit timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)  # Soft delete

    def to_dict(self, include_vector=False):
        """Convert face embedding to dictionary"""
        data = {
            "id": self.id,
            "employee_id": self.employee_id,
            "organization_id": self.organization_id,
            "model_version": self.model_version,
            "quality_score": self.quality_score,
            "image_url": self.image_url,
            "is_primary": self.is_primary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Only include vector if explicitly requested (it's large)
        if include_vector:
            data["embedding_vector"] = self.embedding_vector
        
        return data

    def __repr__(self):
        return f"<FaceEmbedding {self.id} for Employee {self.employee_id}>"
