"""Create request endpoint"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.database import get_db
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestResponse

router = APIRouter()


@router.post("/", response_model=RequestResponse, status_code=201)
async def create_request(
    request_data: RequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new request with validation"""
    # Check if name already exists
    result = await db.execute(
        select(Request).where(Request.name == request_data.name)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Request with name '{request_data.name}' already exists"
        )

    # Validate and parse request_data JSON
    try:
        parsed_data = json.loads(request_data.request_data)

        # Validate required fields
        if "url" not in parsed_data:
            raise HTTPException(status_code=400, detail="request_data must contain 'url' field")

        # Validate method
        valid_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
        method = parsed_data.get("method", "GET").upper()
        if method not in valid_methods:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid HTTP method. Must be one of: {', '.join(valid_methods)}"
            )
        parsed_data["method"] = method

        # Validate and parse headers if present
        if "headers" in parsed_data:
            if isinstance(parsed_data["headers"], str):
                try:
                    parsed_data["headers"] = json.loads(parsed_data["headers"])
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="headers must be valid JSON object")

            if not isinstance(parsed_data["headers"], dict):
                raise HTTPException(status_code=400, detail="headers must be a JSON object")
        else:
            parsed_data["headers"] = {}

        # Validate and parse body if present
        if "body" in parsed_data and parsed_data["body"]:
            if isinstance(parsed_data["body"], str):
                try:
                    parsed_data["body"] = json.loads(parsed_data["body"])
                except json.JSONDecodeError:
                    # If it's not JSON, keep it as string (for form data, etc.)
                    pass

        # Re-serialize the validated data
        request_data.request_data = json.dumps(parsed_data)

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON in request_data: {str(e)}"
        )

    # Create new request
    request = Request(**request_data.model_dump())

    db.add(request)
    await db.commit()
    await db.refresh(request)

    return request
