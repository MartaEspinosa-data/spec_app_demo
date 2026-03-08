from pydantic import BaseModel
from typing import Optional, List

class ErrorDetail(BaseModel):
    loc: Optional[List[str]] = None
    msg: str
    type: str

class HTTPError(BaseModel):
    detail: str

class ValidationError(BaseModel):
    detail: List[ErrorDetail]
