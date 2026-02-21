from pydantic import BaseModel
from typing import List

class Data(BaseModel):
    visitor_id: str
    embedding: List[float]

class DataAMS(BaseModel):
    employee_id: str
    embedding: List[float]


class SearchRequest(BaseModel):
    embedding: List[float]
