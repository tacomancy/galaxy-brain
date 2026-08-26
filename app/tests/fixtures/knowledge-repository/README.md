# Synthetic Knowledge Repository Fixture

This directory is synthetic test and development data for the portable Knowledge Repository Format. It is not the user's private Knowledge Repository and must never be treated as user knowledge or synchronized from private content. Tests using this fixture must also cover local Workbench behavior without Agent Provider configuration; provider credentials never belong in the fixture.

- `assets/`: repository-managed images, reference documents, and other supporting files
- `knowledge/`: finalized, reviewed core knowledge
- `projects/`: working notes for a specific project or outcome
- `proposals/`: proposals to change governed knowledge-base content
- `scratch/`: miscellaneous provisional knowledge notes
- `sources/`: notes and annotations for books, PDFs, classes, papers, websites, and other sources
- `templates/`: templates and snippets for new knowledge-base files

The application project and starter skeleton are elsewhere under `app/`. The internal roots remain portable when a user creates or opens an independent repository.
