---
description: Evaluate new code, update existing specs, or create new specs via speckit if necessary.
---

## User Input

```text
$ARGUMENTS
```

## Workflow Execution

When this command is triggered after creating or modifying code:

### 1. Analyze the New Feature/Code
Analyze the provided code changes, or the user's description of what was just coded, to understand the intent and scope of the feature.

### 2. Check for an Existing Spec
Review the project's existing specifications (typically located in the `specs/` directory).
- **If the new feature belongs to an older spec**: 
  1. Update that existing specification document to reflect the new feature or changes. 
  2. Proceed to fully implement the code for the user.

### 3. Evaluate for a New Spec
If the new feature does *not* exist in an old spec, assess its value and scope to determine if a brand new specification is needed.
- **If it is worth a new spec**:
  1. Inform the user that the new implementation is significant enough to have its own spec.
  2. Use the `/speckit.specify` command/workflow to start creating a new spec.
  3. Work with the user to follow the entire `speckit` process (specify -> plan -> tasks -> implement) until the feature is formally implemented.
- **If it is just a fix or a minor change**:
  1. If it doesn't need a spec, just explicitly state so to the user ("this is just a fix that doesn't need a spec").
  2. Help implement the fix or complete the code without creating any specification documents.

## Critical Rules
- **Communication**: Explicitly communicate to the user whether the change was tied to an old spec, warrants a new spec, or requires no spec at all before taking major actions.
