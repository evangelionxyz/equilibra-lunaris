import sys
import os
import asyncio
import unittest
from unittest.mock import MagicMock, patch

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.webhook_handlers import sync_github_tasks

class TestWebhookSync(unittest.IsolatedAsyncioTestCase):
    @patch("services.webhook_handlers.get_github_client")
    @patch("services.webhook_handlers._get_conn")
    @patch("services.webhook_handlers._put_conn")
    async def test_sync_github_tasks(self, mock_put_conn, mock_get_conn, mock_get_github_client):
        # Mock payload
        payload = {
            "repository": {
                "full_name": "test/repo",
                "html_url": "https://github.com/test/repo"
            },
            "installation": {"id": 12345}
        }

        # Mock Github Client
        mock_gh = MagicMock()
        mock_get_github_client.return_value = mock_gh
        mock_repo = MagicMock()
        mock_gh.get_repo.return_value = mock_repo

        # Mock openspec/changes contents
        mock_dir = MagicMock()
        mock_dir.type = "dir"
        mock_dir.path = "openspec/changes/feature-1"
        
        mock_task_file = MagicMock()
        mock_task_file.name = "tasks.md"
        mock_task_file.decoded_content = b"- [ ] Task 1\n- [x] Task 2\n- [ ] Task 3"
        
        # Side effect for repo.get_contents
        def get_contents_mock(path):
            if path == "openspec/changes":
                return [mock_dir]
            if path == "openspec/changes/feature-1":
                return [mock_task_file]
            return []
            
        mock_repo.get_contents.side_effect = get_contents_mock

        # Mock DB
        mock_conn = MagicMock()
        mock_get_conn.return_value = mock_conn
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        
        # Simulate project NOT found (trigger Zero-Config)
        mock_cur.fetchone.side_effect = [
            None, # SELECT project
            {"id": "new-project-id"}, # RETURNING id from project INSERT
            {"id": "new-bucket-id"}, # RETURNING id from bucket INSERT
            None, # SELECT task 1
            None, # SELECT task 2
            None  # SELECT task 3
        ]

        await sync_github_tasks(payload)

        # Assertions
        # 1. Project should be inserted
        mock_cur.execute.assert_any_call(
            "INSERT INTO public.projects (id, name, gh_repo_url) VALUES (%s, %s, %s) RETURNING id;",
            (unittest.mock.ANY, "repo", ["https://github.com/test/repo"])
        )
        
        # 2. Bucket should be inserted
        mock_cur.execute.assert_any_call(
            "INSERT INTO public.buckets (id, project_id, name, state, is_system_locked, order_idx) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id;",
            (unittest.mock.ANY, unittest.mock.ANY, "AI Drafts", "DRAFT", True, 0)
        )
        
        # 3. Tasks should be inserted
        mock_cur.execute.assert_any_call(
            "INSERT INTO public.tasks (id, project_id, bucket_id, title, type, weight) VALUES (%s, %s, %s, %s, 'CODE', 1);",
            (unittest.mock.ANY, unittest.mock.ANY, unittest.mock.ANY, "Task 1")
        )
        mock_cur.execute.assert_any_call(
            "INSERT INTO public.tasks (id, project_id, bucket_id, title, type, weight) VALUES (%s, %s, %s, %s, 'CODE', 1);",
            (unittest.mock.ANY, unittest.mock.ANY, unittest.mock.ANY, "Task 2")
        )
        mock_cur.execute.assert_any_call(
            "INSERT INTO public.tasks (id, project_id, bucket_id, title, type, weight) VALUES (%s, %s, %s, %s, 'CODE', 1);",
            (unittest.mock.ANY, unittest.mock.ANY, unittest.mock.ANY, "Task 3")
        )
        
        print("Verification test PASSED!")

if __name__ == "__main__":
    asyncio.run(TestWebhookSync().test_sync_github_tasks())
