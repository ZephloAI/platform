"""AWS S3 service for logo uploads."""

import os
from uuid import uuid4

import boto3
from fastapi import UploadFile

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
        )
    return _client


def _get_bucket():
    return os.environ.get("S3_BUCKET_NAME", "")


async def upload_logo(file: UploadFile, chatbot_id: int) -> str:
    """Upload a logo image to S3 and return the public URL."""
    client = _get_client()
    bucket = _get_bucket()

    ext = os.path.splitext(file.filename or "logo.png")[1]
    key = f"logos/{chatbot_id}/{uuid4().hex}{ext}"

    content = await file.read()
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=content,
        ContentType=file.content_type or "image/png",
    )

    region = os.environ.get("AWS_REGION", "us-east-1")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"


async def upload_document(file: UploadFile, chatbot_id: int) -> str:
    """Upload a PDF document to S3 and return the public URL."""
    client = _get_client()
    bucket = _get_bucket()

    ext = os.path.splitext(file.filename or "document.pdf")[1]
    key = f"documents/{chatbot_id}/{uuid4().hex}{ext}"

    content = await file.read()
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=content,
        ContentType=file.content_type or "application/pdf",
    )

    region = os.environ.get("AWS_REGION", "us-east-1")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
