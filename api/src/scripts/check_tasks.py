import sys
import os
import psycopg2
import psycopg2.extras

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.database.database import _get_conn, _put_conn

def check_task_status():
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT id, title, bucket_id, lead_assignee_id, branch_name, type FROM public.tasks ORDER BY id DESC LIMIT 10;")
        tasks = cur.fetchall()
        print("Last 10 tasks:")
        for t in tasks:
            print(f"ID: {t['id']} | Title: {t['title']} | Bucket: {t['bucket_id']} | Assignee: {t['lead_assignee_id']} | Branch: {t['branch_name']} | Type: {t['type']}")
            
        cur.execute("SELECT id, state, name FROM public.buckets;")
        buckets = cur.fetchall()
        print("\nBuckets:")
        for b in buckets:
            print(f"ID: {b['id']} | State: {b['state']} | Name: {b['name']}")
            
    finally:
        cur.close()
        _put_conn(conn)

if __name__ == "__main__":
    check_task_status()
