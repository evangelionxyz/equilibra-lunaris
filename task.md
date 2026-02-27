# Task Checklist

- [x] Investigate bucket deletion error [/]
    - [x] Analyze console error and backend count logic [x]
    - [x] Identify ID truncation issue in `App.tsx` [x]
- [ ] Implement fixes [/]
    - [ ] Update backend `is_deleted` checks (tasks.py, buckets.py) [/]
    - [ ] Fix ID truncation in `App.tsx` [/]
    - [ ] Update frontend components to handle `string | number` for `projectId` [ ]
- [ ] Verify the fix [ ]
