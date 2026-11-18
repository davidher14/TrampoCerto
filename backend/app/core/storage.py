from pathlib import Path
from typing import Protocol
from uuid import uuid4

from app.core.config import settings


class FileStorage(Protocol):
    def save(self, category: str, extension: str, content: bytes) -> str: ...

    def resolve(self, key: str) -> Path: ...


class LocalFileStorage:
    """Armazenamento local; a interface permite trocar a implementação por S3."""

    def __init__(self, base_directory: str) -> None:
        self.base_directory = Path(base_directory).resolve()

    def save(self, category: str, extension: str, content: bytes) -> str:
        key = f"{category}/{uuid4().hex}{extension}"
        destination = self.resolve(key)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)
        return key

    def resolve(self, key: str) -> Path:
        destination = (self.base_directory / key).resolve()
        if not destination.is_relative_to(self.base_directory):
            raise ValueError("Caminho de arquivo inválido.")
        return destination


file_storage: FileStorage = LocalFileStorage(settings.upload_directory)
