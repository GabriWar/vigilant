#!/usr/bin/env python3
"""
Script to populate headers table with useful default headers
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.header import Header

def create_default_headers():
    """Create default headers for common use cases"""
    
    default_headers = [
        {
            "name": "Accept",
            "value": "application/json, text/javascript, */*; q=0.01",
            "description": "Standard AJAX accept header"
        },
        {
            "name": "X-Requested-With",
            "value": "XMLHttpRequest",
            "description": "Indicates AJAX request"
        },
        {
            "name": "Referer",
            "value": "https://mobile-tracker-free.com/dashboard/",
            "description": "Referer for mobile tracker requests"
        },
        {
            "name": "Accept-Language",
            "value": "en-US,en;q=0.9",
            "description": "Browser language preferences"
        },
        {
            "name": "Cache-Control",
            "value": "no-cache",
            "description": "Disable caching"
        },
        {
            "name": "Pragma",
            "value": "no-cache",
            "description": "Legacy cache control"
        },
        {
            "name": "DNT",
            "value": "1",
            "description": "Do Not Track header"
        },
        {
            "name": "Sec-Fetch-Dest",
            "value": "empty",
            "description": "Security fetch destination"
        },
        {
            "name": "Sec-Fetch-Mode",
            "value": "cors",
            "description": "Security fetch mode"
        },
        {
            "name": "Sec-Fetch-Site",
            "value": "same-site",
            "description": "Security fetch site"
        }
    ]
    
    db = SessionLocal()
    try:
        # Check if headers already exist
        existing_count = db.query(Header).count()
        if existing_count > 0:
            print(f"Headers table already has {existing_count} entries. Skipping creation.")
            return
        
        # Create headers
        for header_data in default_headers:
            header = Header(
                name=header_data["name"],
                value=header_data["value"],
                description=header_data["description"],
                is_active=True
            )
            db.add(header)
        
        db.commit()
        print(f"Created {len(default_headers)} default headers successfully!")
        
    except Exception as e:
        print(f"Error creating headers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_headers()
