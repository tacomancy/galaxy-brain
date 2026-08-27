# galaxy-brain

Galaxy Brain's public application project is MIT-licensed. The user's actual Knowledge Repository is a separate private repository and is never part of this project.

Galaxy Brain combines a human-owned knowledge base for personal research and continuing education with the project files used to develop its desktop Knowledge Workbench. Agents are helpers: they may research, organize, test, and propose, while the user remains the primary author, learner, and authority over core knowledge.

## Start here

- [Synthetic repository fixture](app/tests/fixtures/knowledge-repository/knowledge/README.md)
- [Application build and run instructions](app/README.md#build-and-run)
- [Project documentation](docs/README.md)
- [V1 Knowledge Workbench architecture](docs/architecture/v1-ui/README.md)
- [Human-agent collaboration](docs/agents/collaboration.md)
- [Knowledge-base guidance](docs/agents/knowledge-base.md)
- [Research guidance](docs/agents/research.md)
- [Software design principles](docs/agents/software-design.md)
- [Code guidance](docs/agents/code.md)
- [Software development conventions](docs/agents/software-development.md)
- [Engineering glossary](docs/engineering/glossary.md)

## Structure

This public development repository contains application-project material, a synthetic repository fixture, and a starter skeleton. Keep their roles distinct:

- `app/`: the Galaxy Brain application project
  - `docs/`: application architecture, ADRs, guidance, proposals, and review records
  - `prototype/`: temporary, disposable GUI explorations
  - `app/templates/knowledge-repository/`: empty starter skeleton for a new user repository
  - `app/tests/fixtures/knowledge-repository/`: synthetic fixture for tests and development; it is not user knowledge

The application project, starter skeleton, and synthetic fixture are public. A user's Knowledge Repository lives in an independent sibling or otherwise user-selected directory with its own lifecycle. Galaxy Brain can create the files for a new repository, but does not initialize Git or perform commits. Git, Git LFS, remotes, credentials, and backups are optional external user-managed tooling.

Agent Provider configuration is optional. Galaxy Brain remains usable for local repository, reading, editing, source, and governance workflows without an API key or configured provider; only Agentic Capabilities are unavailable until a provider is configured. V1 focuses on the OpenAI API, configured through `OPENAI_API_KEY` in a machine-local `.env` file; see [`app/.env.example`](app/.env.example). This is OpenAI API access, not ChatGPT consumer-account login. The real `.env` is excluded from version control and must never be committed. Other providers and model ecosystems are deferred.
