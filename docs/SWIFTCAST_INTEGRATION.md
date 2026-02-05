# SwiftCast Integration Guide

## Timeline AI Activity Feature

ThreadCast can display Claude's work summary in the timeline during weaving.
This requires SwiftCast to include `response_summary` in the `usage_logged` webhook.

### Required SwiftCast Change

In the webhook sending logic (e.g., `webhook.rs`), modify the `usage_logged` event to include the response summary:

```rust
// When sending usage_logged webhook
let payload = json!({
    "event": "usage_logged",
    "todo_id": todo_id,
    "session_id": session_id,
    "timestamp": timestamp,
    "data": {
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        // NEW: Add response summary (first 200 chars of response_text)
        "response_summary": response_text.chars().take(200).collect::<String>()
    }
});
```

### Data Flow

```
SwiftCast                    ThreadCast Server              ThreadCast Web
    |                              |                              |
    |-- usage_logged webhook ----->|                              |
    |   (with response_summary)    |                              |
    |                              |-- recordAIActivity() ------->|
    |                              |   (TimelineService)          |
    |                              |                              |
    |                              |-- WebSocket event ---------->|
    |                              |   (AI_ACTIVITY)              |
    |                              |                              |
    |                              |                    Timeline shows
    |                              |                    "AI Working: ..."
```

### Event Type

- **EventType**: `AI_ACTIVITY`
- **Icon**: Bot (cyan color)
- **Label**: "AI Working"

### Metadata in Timeline Event

```json
{
  "eventType": "AI_ACTIVITY",
  "title": "이전 작업을 이어서 진행하겠습니다. Claude 작업 요약을...",
  "metadata": {
    "model": "claude-opus-4-5-20251101",
    "inputTokens": 1000,
    "outputTokens": 500
  }
}
```

### Testing

1. Start ThreadCast server with `sessioncast` profile
2. Create a Todo and start weaving
3. Manually send a test webhook:

```bash
curl -X POST http://localhost:21000/api/webhooks/swiftcast \
  -H "Content-Type: application/json" \
  -d '{
    "event": "usage_logged",
    "todo_id": "YOUR_TODO_UUID",
    "session_id": "test-session",
    "timestamp": 1234567890,
    "data": {
      "model": "claude-opus-4-5-20251101",
      "input_tokens": 1000,
      "output_tokens": 500,
      "response_summary": "테스트 AI 활동 요약 메시지입니다."
    }
  }'
```

4. Check the timeline for new AI_ACTIVITY event

---

## Session Mapping Feature (register_session)

### Overview

PM Agent uses `>>swiftcast register_session --todo-id=XXX` to map Claude's session_id to a ThreadCast todo_id.
This allows ThreadCast to track which Claude session is working on which Todo.

### Data Flow

```
PM Agent                      SwiftCast                    ThreadCast
    |                              |                              |
    | >>swiftcast register_session |                              |
    | --todo-id=XXX                |                              |
    |----------------------------->|                              |
    |                              |                              |
    |     Custom Task (POST)       |                              |
    |     TaskContext: {           |                              |
    |       session_id,            |                              |
    |       args: "--todo-id=XXX"  |                              |
    |     }                        |                              |
    |----------------------------->|                              |
    |                              |                              |
    |                              |-- Save to local DB -------->|
    |                              |-- Forward to ThreadCast --->|
    |                              |   POST /api/webhooks/       |
    |                              |        session-mapping      |
    |                              |   { session_id, args }      |
    |                              |                              |
```

### tasks.json Configuration

Located at `~/.sessioncast/tasks.json`:

```json
[
  {
    "name": "register_session",
    "description": "Register SwiftCast session ID with ThreadCast todo mapping",
    "task_type": "http",
    "url": "http://localhost:32080/_swiftcast/threadcast/mapping",
    "http_method": "POST"
  }
]
```

### Required SwiftCast Change

The `/_swiftcast/threadcast/mapping` endpoint needs to handle **both** formats:

1. **TaskContext format** (from Custom Task):
```json
{
  "session_id": "abc123...",
  "path": "/v1/messages",
  "model": "claude-opus-4-5-20251101",
  "args": "--todo-id=550e8400-e29b-41d4-a716-446655440000"
}
```

2. **ThreadcastMappingRequest format** (direct API call):
```json
{
  "session_id": "abc123...",
  "todo_id": "550e8400-e29b-41d4-a716-446655440000",
  "mission_id": "optional-mission-id"
}
```

**Suggested implementation** in `handle_threadcast_mapping_internal`:

```rust
// Try parsing as TaskContext first (from Custom Task)
#[derive(Deserialize)]
struct TaskContextRequest {
    session_id: Option<String>,
    args: Option<String>,
    // other fields ignored
}

let body_clone = body_bytes.clone();
if let Ok(task_ctx) = serde_json::from_slice::<TaskContextRequest>(&body_clone) {
    if let Some(args) = task_ctx.args {
        // Parse --todo-id=XXX from args
        if let Some(todo_id) = args.split_whitespace()
            .find(|s| s.starts_with("--todo-id="))
            .map(|s| s.trim_start_matches("--todo-id="))
        {
            let session_id = task_ctx.session_id.unwrap_or_default();
            // Process with session_id and todo_id
            return process_mapping(state, session_id, todo_id.to_string(), None).await;
        }
    }
}

// Fall back to ThreadcastMappingRequest format
let payload: ThreadcastMappingRequest = serde_json::from_slice(&body_bytes)?;
// ... existing logic
```

### SwiftCast Config

Make sure `threadcast_webhook_url` is set correctly:

```sql
-- Check current value
SELECT value FROM config WHERE key='threadcast_webhook_url';

-- Update if needed
UPDATE config SET value='http://localhost:8080' WHERE key='threadcast_webhook_url';
```

### Testing

```bash
# Test with TaskContext format (simulates Custom Task)
curl -X POST http://localhost:32080/_swiftcast/threadcast/mapping \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "path": "/v1/messages",
    "model": "claude-opus-4-5",
    "args": "--todo-id=550e8400-e29b-41d4-a716-446655440000"
  }'

# Test with ThreadcastMappingRequest format (direct API)
curl -X POST http://localhost:32080/_swiftcast/threadcast/mapping \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "todo_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```
