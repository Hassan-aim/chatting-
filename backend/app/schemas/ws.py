from pydantic import BaseModel


class WsEvent(BaseModel):
    event: str
    payload: dict
