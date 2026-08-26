# Galaxy Brain application project

This directory contains the MIT-licensed Galaxy Brain desktop Knowledge Workbench project. It is the application namespace, not part of a user's portable Knowledge Repository.

- `docs/`: architecture, ADRs, engineering and agent guidance, proposals, and review records for the application
- `prototype/`: temporary, disposable GUI explorations
- `templates/knowledge-repository/`: the empty public starter skeleton
- `tests/fixtures/knowledge-repository/`: synthetic test and development data
- future application source, dependencies, build output, and UI assets belong here with the application code

The application may open or create files in a user-selected Knowledge Repository, but application releases and source changes must not require changes to the repository's knowledge files. A packaged release starts without a selected repository; the user explicitly opens an existing repository or creates one from the bundled skeleton. Git operations remain external and optional.

Agent Provider configuration is optional. The Workbench must open and support non-agentic local workflows without an API key or configured provider, while clearly reporting Agentic Capabilities as unavailable until one is configured. V1 focuses on the OpenAI API, using `OPENAI_API_KEY` from the machine-local `.env` described in [`.env.example`](.env.example); this is not ChatGPT consumer-account login. The real `.env` is excluded from version control and must never be committed. Other providers and model ecosystems are deferred.
