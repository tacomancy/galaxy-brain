# Test-driven code

When changing code or tests, use the installed `tdd` skill as the authoritative testing process. Also read `CONTEXT.md` and relevant ADRs when they exist so interfaces and test names use the project's domain language.

Before writing a test:

1. Identify the public interfaces and proposed test seams.
2. Explain why those seams cover the critical behavior.
3. Confirm the seams with the user.

Then work in vertical tracer-bullet slices: one behavior-level test, observe the expected failure, implement the minimum passing behavior, and repeat. Verify through public interfaces, derive expected values independently, and mock only at system boundaries.

Keep refactoring outside the red-to-green loop. Perform it during review while the suite remains green. Agent-maintained code and tests remain subordinate to the user's product and design decisions.
