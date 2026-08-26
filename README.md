# galaxy-brain

Galaxy Brain combines a human-owned knowledge base for personal research and continuing education with the project files used to develop its desktop Knowledge Workbench. Agents are helpers: they may research, organize, test, and propose, while the user remains the primary author, learner, and authority over core knowledge.

## Start here

- [Knowledge map](knowledge-repository/knowledge/README.md)
- [Project documentation](app/docs/README.md)
- [V1 Knowledge Workbench architecture](app/docs/architecture/v1-ui/README.md)
- [Human-agent collaboration](app/docs/agents/collaboration.md)
- [Knowledge-base guidance](app/docs/agents/knowledge-base.md)
- [Research guidance](app/docs/agents/research.md)
- [Software design principles](app/docs/agents/software-design.md)
- [Code guidance](app/docs/agents/code.md)
- [Software development conventions](app/docs/agents/software-development.md)
- [Engineering glossary](app/docs/engineering/glossary.md)

## Structure

This development repository deliberately contains both application-project material and a working Knowledge Repository. Keep their roles distinct:

- `app/`: the Galaxy Brain application project
  - `app/docs/`: application architecture, ADRs, guidance, proposals, and review records
  - `app/prototype/`: temporary, disposable GUI explorations
- `knowledge-repository/`: the local, portable Knowledge Repository
  - `knowledge-repository/assets/`: local images, reference documents, and other files supporting the knowledge base
  - `knowledge-repository/knowledge/`: finalized, reviewed, approval-gated knowledge
  - `knowledge-repository/projects/`: working knowledge notes organized around a specific project or outcome
  - `knowledge-repository/proposals/`: proposals to change governed knowledge-base content
  - `knowledge-repository/scratch/`: miscellaneous working knowledge notes that do not yet belong under a source or project
  - `knowledge-repository/sources/`: working notes and annotations organized around a specific source, such as a book, PDF, class, paper, or website
  - `knowledge-repository/templates/`: templates and snippets used to create knowledge-base files

The application namespace and Knowledge Repository namespace are physically and logically distinct. Application source, dependencies, build output, and application-owned assets remain under `app/`; knowledge-base files remain under `knowledge-repository/`. A user can update the application while keeping the same Knowledge Repository, and can move or back up the Knowledge Repository without carrying application files with it.
