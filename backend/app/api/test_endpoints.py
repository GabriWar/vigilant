"""Test endpoints for monitoring system"""
from fastapi import APIRouter, Response, Request, Query
from datetime import datetime, timezone
import random
import string
import json

router = APIRouter(prefix="/test", tags=["test"])

@router.get("/ping")
async def ping(request: Request):
    """Ping endpoint that returns test data and received cookies"""
    # Get cookies from request
    received_cookies = dict(request.cookies)
    
    return {
        "status": "success",
        "message": "Ping successful!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "random_value": random.randint(1000, 9999),
        "data": {
            "server": "vigilant-backend",
            "version": "2.0.0",
            "uptime": "running"
        },
        "received_cookies": received_cookies,
        "cookie_count": len(received_cookies)
    }

@router.get("/cookie-teste")
async def cookie_teste(response: Response):
    """Cookie test endpoint that sets a test cookie"""
    # Generate a random cookie value
    cookie_value = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    
    # Set cookie
    response.set_cookie(
        key="test_cookie",
        value=cookie_value,
        max_age=3600,  # 1 hour
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    
    return {
        "status": "success",
        "message": "Cookie set successfully",
        "cookie_name": "test_cookie",
        "cookie_value": cookie_value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def _generate_random_data():
    """Generate random data for test endpoints"""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "random_number": random.randint(1000, 9999),
        "random_string": ''.join(random.choices(string.ascii_letters + string.digits, k=12)),
        "random_float": round(random.uniform(0.0, 100.0), 2),
        "random_boolean": random.choice([True, False]),
        "random_array": [random.randint(1, 100) for _ in range(random.randint(3, 8))],
        "random_object": {
            "id": random.randint(1, 1000),
            "name": ''.join(random.choices(string.ascii_letters, k=8)),
            "active": random.choice([True, False]),
            "score": round(random.uniform(0.0, 10.0), 1)
        },
        "server_info": {
            "name": "vigilant-test-server",
            "version": f"2.{random.randint(0, 9)}.{random.randint(0, 9)}",
            "uptime": f"{random.randint(1, 365)} days",
            "load": round(random.uniform(0.1, 5.0), 2)
        }
    }

@router.get("/random-json")
async def random_json():
    """Returns random JSON data that changes on each call"""
    data = _generate_random_data()
    return data

@router.get("/random-html")
async def random_html():
    """Returns random HTML page that changes on each call"""
    data = _generate_random_data()
    
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Random Test Page</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }}
        .container {{ background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        .header {{ color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }}
        .data {{ margin: 20px 0; }}
        .item {{ margin: 10px 0; padding: 8px; background: #f8f9fa; border-left: 4px solid #007bff; }}
        .timestamp {{ color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Random Test Data Page</h1>
        <div class="timestamp">Generated at: {data['timestamp']}</div>
        
        <div class="data">
            <div class="item"><strong>Random Number:</strong> {data['random_number']}</div>
            <div class="item"><strong>Random String:</strong> {data['random_string']}</div>
            <div class="item"><strong>Random Float:</strong> {data['random_float']}</div>
            <div class="item"><strong>Random Boolean:</strong> {data['random_boolean']}</div>
            <div class="item"><strong>Random Array:</strong> {data['random_array']}</div>
            <div class="item"><strong>Random Object:</strong> {json.dumps(data['random_object'], indent=2)}</div>
        </div>
        
        <h2>Server Information</h2>
        <div class="data">
            <div class="item"><strong>Server Name:</strong> {data['server_info']['name']}</div>
            <div class="item"><strong>Version:</strong> {data['server_info']['version']}</div>
            <div class="item"><strong>Uptime:</strong> {data['server_info']['uptime']}</div>
            <div class="item"><strong>Load:</strong> {data['server_info']['load']}</div>
        </div>
    </div>
</body>
</html>
    """
    
    return Response(content=html_content, media_type="text/html")

@router.get("/random-xml")
async def random_xml():
    """Returns random XML document that changes on each call"""
    data = _generate_random_data()
    
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<testData>
    <metadata>
        <timestamp>{data['timestamp']}</timestamp>
        <generator>vigilant-test-server</generator>
    </metadata>
    
    <randomValues>
        <number>{data['random_number']}</number>
        <string>{data['random_string']}</string>
        <float>{data['random_float']}</float>
        <boolean>{str(data['random_boolean']).lower()}</boolean>
        <array>
            {''.join([f'<item>{item}</item>' for item in data['random_array']])}
        </array>
    </randomValues>
    
    <object>
        <id>{data['random_object']['id']}</id>
        <name>{data['random_object']['name']}</name>
        <active>{str(data['random_object']['active']).lower()}</active>
        <score>{data['random_object']['score']}</score>
    </object>
    
    <serverInfo>
        <name>{data['server_info']['name']}</name>
        <version>{data['server_info']['version']}</version>
        <uptime>{data['server_info']['uptime']}</uptime>
        <load>{data['server_info']['load']}</load>
    </serverInfo>
</testData>"""
    
    return Response(content=xml_content, media_type="application/xml")

@router.get("/random-text")
async def random_text():
    """Returns random plain text that changes on each call"""
    data = _generate_random_data()
    
    text_content = f"""RANDOM TEST DATA REPORT
Generated at: {data['timestamp']}

=== RANDOM VALUES ===
Number: {data['random_number']}
String: {data['random_string']}
Float: {data['random_float']}
Boolean: {data['random_boolean']}
Array: {', '.join(map(str, data['random_array']))}

=== RANDOM OBJECT ===
ID: {data['random_object']['id']}
Name: {data['random_object']['name']}
Active: {data['random_object']['active']}
Score: {data['random_object']['score']}

=== SERVER INFORMATION ===
Server Name: {data['server_info']['name']}
Version: {data['server_info']['version']}
Uptime: {data['server_info']['uptime']}
Load: {data['server_info']['load']}

=== END OF REPORT ===
This content changes on every request to test change detection.
"""
    
    return Response(content=text_content, media_type="text/plain")

@router.get("/random")
async def random_format(
    format: str = Query("json", description="Output format: json, html, xml, text")
):
    """Returns random data in specified format"""
    format = format.lower()
    
    if format == "json":
        return await random_json()
    elif format == "html":
        return await random_html()
    elif format == "xml":
        return await random_xml()
    elif format == "text":
        return await random_text()
    else:
        return {
            "error": "Invalid format",
            "message": "Supported formats: json, html, xml, text",
            "provided": format
        }
