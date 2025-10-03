from typing import Generic, Optional, Sequence, Type, TypeVar

from sqlmodel import Session, select

from ..models.base import DBModel

ModelType = TypeVar("ModelType", bound=DBModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, session: Session, obj_id: int) -> Optional[ModelType]:
        return session.get(self.model, obj_id)

    def list(self, session: Session, offset: int = 0, limit: int = 100) -> Sequence[ModelType]:
        statement = select(self.model).offset(offset).limit(limit)
        return session.exec(statement).all()

    def create(self, session: Session, obj_in: ModelType) -> ModelType:
        session.add(obj_in)
        session.flush()
        session.refresh(obj_in)
        return obj_in

    def delete(self, session: Session, obj: ModelType) -> None:
        session.delete(obj)
        session.flush()

    def update(self, session: Session, obj: ModelType, data: dict) -> ModelType:
        for field, value in data.items():
            setattr(obj, field, value)
        if hasattr(obj, "touch"):
            obj.touch()
        session.add(obj)
        session.flush()
        session.refresh(obj)
        return obj
