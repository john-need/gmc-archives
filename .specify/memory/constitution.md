<!--
Sync Impact Report
Version change: (none) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles: I. Library-First, II. CLI Interface, III. Test-First (NON-NEGOTIABLE),
    IV. Integration Testing, V. Observability, Versioning & Simplicity
  - Additional Constraints
  - Development Workflow
  - Governance
Removed sections: N/A (initial ratification)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check gate is generic)
  - .specify/templates/spec-template.md ✅ no changes needed (no principle-specific references)
  - .specify/templates/tasks-template.md ✅ no changes needed (task categories already generic)
  - .specify/templates/checklist-template.md ✅ no changes needed
Follow-up TODOs: none
-->

# GMC Archives Constitution

## Core Principles

### I. Library-First
Every feature starts as a standalone library; Libraries must be self-contained,
independently testable, and documented; Clear purpose required — no
organizational-only libraries.

### II. CLI Interface
Every library exposes its functionality via a CLI; Text in/out protocol:
stdin/args → stdout, errors → stderr; Both JSON and human-readable output
formats MUST be supported.

### III. Test-First (NON-NEGOTIABLE)
TDD is mandatory: tests are written, then approved, then confirmed to fail,
and only then is implementation written. The Red-Green-Refactor cycle MUST
be strictly enforced for all new functionality.

### IV. Integration Testing
Integration tests are required for: new library contract tests, changes to
existing contracts, inter-service communication, and shared schemas. These
areas MUST NOT rely on unit tests alone.

### V. Observability, Versioning & Simplicity
Text I/O ensures debuggability; structured logging is required for all
libraries and services. Versioning follows MAJOR.MINOR.BUILD semantics, and
breaking changes MUST be called out explicitly in release notes. Implementations
MUST start simple and follow YAGNI — added complexity requires written
justification.

### VI. Functional Programming Paradigm
- All code MUST adhere to functional programming principles: immutability, pure functions, and avoidance of side effects. This promotes predictability,
testability, and maintainability across the codebase. Any deviation from functional programming MUST be justified with a clear rationale and documented in the code comments.   
- Avoid stateful patterns and mutable data structures; prefer composition over inheritance; and ensure that functions are deterministic and free of side effects. This principle is fundamental to maintaining the integrity and reliability of the codebase, and any exceptions must be carefully considered and documented.
- Prefer const over let/var for variable declarations; use higher-order functions and functional utilities to manage data transformations; and avoid shared mutable state across modules. Adherence to this principle is essential for achieving the goals of simplicity, testability, and maintainability outlined in the other core principles.

### Redux
- The architecture of the codebase MUST follow the Redux pattern, with a clear separation of concerns between actions, reducers, and state management. This ensures a predictable data flow and makes it easier to reason about the state of the application. Any deviation from the Redux pattern MUST be justified with a clear rationale and documented in the code comments.
- Actions MUST be plain objects that describe the type of change being made to the state; reducers
- MUST be pure functions that take the current state and an action as input and return a new state; and the state MUST be immutable, with updates performed through the use of reducers. Adherence to this principle is crucial for maintaining the integrity and predictability of the codebase, and any exceptions must be carefully considered and documented.

### Ramda
- The codebase MUST utilize the Ramda library for functional programming utilities, such as data transformations, function composition, and immutability helpers. This promotes consistency and leverages a well-established library for functional programming in JavaScript. Any deviation from using Ramda MUST be justified with a clear rationale and documented in the code comments.
- Ramda functions MUST be used for common operations such as map, filter, reduce, and compose, and the codebase SHOULD avoid reinventing these utilities. Adherence to this principle is important for maintaining consistency and leveraging the benefits of a well-known functional programming library, and any exceptions must be carefully considered and documented.

### Test First Development
- Tests must be written before implementation, and the Red-Green-Refactor cycle MUST be strictly followed. This means that tests are written and approved before any implementation code is written, and that the tests must fail before the implementation is written to ensure that they are testing the intended functionality. Adherence to this principle is critical for maintaining the integrity of the test-first development approach, and any exceptions must be carefully considered and documented.
- All new features and functionality MUST be developed using a test-first approach, where tests are written before the implementation code. This ensures that the code is designed with testability in mind and helps to catch issues early in the development process. Any deviation from a test-first approach MUST be justified with a clear rationale and documented in the code comments.
- The test-first approach MUST be applied to all levels of testing, including unit tests, integration tests, and end-to-end tests. This promotes a comprehensive testing strategy and helps to ensure the reliability and maintainability of the codebase. Adherence to this principle is essential for achieving the goals of simplicity, testability, and maintainability outlined in the other core principles, and any exceptions must be carefully considered and documented.
- Unit tests MUST be written for individual functions and modules, integration tests MUST be written for interactions between modules and services, and end-to-end tests MUST be written for user-facing features and workflows. This comprehensive testing strategy is crucial for ensuring the quality and reliability of the codebase, and any exceptions must be carefully considered and documented.
- Test coverage should not fall below 90% for any new code, and critical paths MUST be fully covered by tests. This ensures that the code is thoroughly tested and helps to catch issues before they reach production. Adherence to this principle is important for maintaining the integrity of the test-first development approach, and any exceptions must be carefully considered and documented.

### Accessibility
- All user-facing features and interfaces MUST adhere to accessibility standards (e.g., WCAG 2.1) to ensure inclusivity. This includes providing appropriate ARIA labels, ensuring keyboard navigability, and maintaining sufficient color contrast. Any deviation from accessibility standards MUST be justified with a clear rationale and documented in the code comments.
- Accessibility considerations MUST be integrated into the design and development process from the outset, rather than being treated as an afterthought. This promotes a more inclusive user experience and helps to ensure that the application is usable by a wider audience. Adherence to this principle is essential for achieving the goals of simplicity, testability, and maintainability outlined in the other core principles, and any exceptions must be carefully considered and documented.
- Regular accessibility audits MUST be conducted, and any identified issues MUST be addressed in a timely manner. This ensures that the application remains accessible as it evolves and helps to maintain a high standard of inclusivity. Adherence to this principle is important for maintaining the integrity of the accessibility commitment, and any exceptions must be carefully considered and documented.

### Naming Conventions
- file names should be in kebab-case.
- Functions and variables should be in camelCase.
- Class names and React components should be in PascalCase.
- Constants should be in UPPER_SNAKE_CASE.
- Adherence to consistent naming conventions is crucial for readability and maintainability of the codebase.

## Additional Constraints

This project is a Node.js-based repository (see `package.json`). Any
dependencies introduced MUST be justified by a concrete feature need —
no speculative tooling. Content and data files (e.g., archival or reference
markdown) are treated as project artifacts subject to the same review
discipline as code: changes MUST be reviewed for accuracy and sourcing
before merge.

## Development Workflow

All changes MUST go through review before merging, with reviewers verifying:
adherence to the Core Principles above, presence of required tests, and that
complexity added is justified. Quality gates (tests, lint, build) MUST pass
before a change is considered mergeable. Deployment or publication of
artifacts requires explicit approval from the project owner.

## Governance

This constitution supersedes all other project practices. Amendments require:
(1) a documented rationale for the change, (2) approval from the project
owner, and (3) a migration plan for any artifacts affected by the change.
All PRs and reviews MUST verify compliance with this constitution; any added
complexity MUST be explicitly justified in the PR description. Use `CLAUDE.md`
for day-to-day runtime development guidance that supplements, but does not
override, this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-21 | **Last Amended**: 2026-06-21
