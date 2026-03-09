---
description: Automatically update an existing spec or create a new one based on a feature prompt, then run the full speckit flow.
---

## User Input

```text
$ARGUMENTS
```

## Workflow Execution

When this command is triggered with a feature description/prompt:

### 1. Spec Analysis Phase
Search the `specs/` directory for existing `spec.md` files.
Analyze the content of existing specifications to determine if the current prompt modifies an already defined feature.

- **Match Found**: 
    1. Identify the specific `spec.md` file.
    2. Invoke `/speckit.specify` with the prompt, ensuring it targets the existing specification file.
    3. Proceed to the orchestration phase.

- **No Match Found**:
    1. Evaluate the complexity of the prompt.
    2. If the feature is complex (multiple components, data changes, or non-trivial UI):
        - Invoke `/speckit.specify` to create a **new** feature specification.
        - Proceed to the orchestration phase.
    3. If the feature is simple:
        - Carry out the change directly without the full speckit overhead, or notify the user if they specifically wanted a spec.

### 2. Orchestration Phase
Once the specification is updated or created, execute the full `speckit` lifecycle in sequence:

1.  **Planning**: Run `/speckit.plan` to generate the implementation plan and design artifacts.
2.  **Task Generation**: Run `/speckit.tasks` to break the plan into actionable tasks.
3.  **Implementation**: Run `/speckit.implement` to execute the tasks and complete the feature.

## Critical Rules
- **Consistency**: Ensure that all generated artifacts (plans, tasks) remain consistent with the project's `specs/memory/constitution.md`.
- **Automation**: Use absolute paths for all tool calls.
- **Reporting**: After each sub-command completes, provide a brief status update before moving to the next.
