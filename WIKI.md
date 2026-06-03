> Agent context — not for human reading.

# Project WIKI

## Tech Stack Notes

*(Added per phase)*

## From Global WIKI — claude-agent-sdk

**Claude Agent SDK: always pass `pathToClaudeCodeExecutable`**
The SDK's `query()` resolves its bundled native binary and can mis-select the wrong variant on the host (e.g. musl vs glibc on Linux). Fix: pass `options.pathToClaudeCodeExecutable` set to the system `claude` binary via `execSync('which claude')`. This must be applied at every new SDK call site independently — a single missing guard silently fails while other call sites work. Phase 1, Task Group 1 must verify this end-to-end as its first action.
