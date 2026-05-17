# Клиент MinIO для хранения файлов портфолио

import io
import uuid
from pathlib import Path

from minio import Minio
from minio.error import S3Error

from app.config import settings


class StorageClient:
    def __init__(self) -> None:
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
        except S3Error as e:
            if e.code != "BucketAlreadyOwnedByYou":
                raise

    def upload_file(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str = "application/octet-stream",
        prefix: str = "portfolio",
    ) -> tuple[str, str]:
        ext = Path(original_filename).suffix
        object_key = f"{prefix}/{uuid.uuid4().hex}{ext}"

        self.client.put_object(
            bucket_name=self.bucket,
            object_name=object_key,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type=content_type,
        )

        public_url = f"{settings.MINIO_PUBLIC_ENDPOINT}/{self.bucket}/{object_key}"
        return object_key, public_url

    def delete_file(self, object_key: str) -> None:
        try:
            self.client.remove_object(self.bucket, object_key)
        except S3Error:
            pass


_storage: StorageClient | None = None


def get_storage() -> StorageClient:
    global _storage
    if _storage is None:
        _storage = StorageClient()
    return _storage
