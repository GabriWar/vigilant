#!/usr/bin/env python3
"""Test diff computation"""
import sys
import asyncio
sys.path.insert(0, '/app')

from app.database import AsyncSessionLocal
from app.models.change_log import ChangeLog
from sqlalchemy import select

async def test_diff():
    async with AsyncSessionLocal() as db:
        # Get a recent modified change log
        result = await db.execute(
            select(ChangeLog)
            .where(ChangeLog.change_type == 'modified')
            .order_by(ChangeLog.id.desc())
            .limit(1)
        )
        log = result.scalar_one_or_none()
        
        if not log:
            print("No modified change logs found")
            return
            
        print(f"Change log ID: {log.id}")
        print(f"Old content length: {len(log.old_content) if log.old_content else 0}")
        print(f"New content length: {len(log.new_content) if log.new_content else 0}")
        print(f"Diff length: {len(log.diff) if log.diff else 0}")
        
        if log.old_content and log.new_content:
            # Test compute_diff
            import difflib
            try:
                old_text = log.old_content.decode('utf-8')
                new_text = log.new_content.decode('utf-8')
                old_lines = old_text.splitlines(keepends=True)
                new_lines = new_text.splitlines(keepends=True)
                diff = difflib.unified_diff(old_lines, new_lines, fromfile='old', tofile='new', lineterm='')
                diff_text = '\n'.join(diff)
                
                print(f"\nManually computed diff length: {len(diff_text)}")
                if diff_text:
                    print(f"First 200 chars of diff:\n{diff_text[:200]}")
                else:
                    print("Manually computed diff is EMPTY!")
                    print(f"Old hash: {log.old_hash}")
                    print(f"New hash: {log.new_hash}")
                    print(f"Old and new are equal: {old_text == new_text}")
            except Exception as e:
                print(f"Error computing diff: {e}")

if __name__ == "__main__":
    asyncio.run(test_diff())

