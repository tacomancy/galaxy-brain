# Documentation additions and corrections review

Date: 2026-08-28
Documentation baseline: `f829e4f00f74dab1cc771012b66ca276db1d36c9` (`codex/tb9-stale-application`, based on `b5bf417` `origin/main`)
Release baseline: application `0.8.0`

## Question, scope, and method

This review asks: **What factual corrections, status repairs, public coverage,
and authority improvements are needed after comparing the current internal
documentation, public documentation projection, application documentation,
and recent committed changes?**

The review covered root and application READMEs, the changelog and security
policy, `docs/`, the `docs-site/` manifest/configuration/tutorial sources, the
public build scripts, current production/test structure, and the recent commit
sequence through TB8 file-backed persistence. A recommendation is included
when the evidence identifies a concrete stale statement, an implemented
behavior with no appropriate documentation surface, or an ambiguity likely to
make a reader confuse accepted V1 intent, `main`, and a published release.

The checkout moved while the review was in progress: the initial branch was
behind the first tutorials and merged TB8 persistence. The findings below were
refreshed against `f829e4f`, which includes release `0.8.0` (`ea34f7c`), the
first public tutorials (`d7fa7b5`), TB8 file-backed persistence (`b5bf417`), the
committed TB9 stale-Judgment implementation brief (`caa0f9f`), and the first
implemented TB9 stale-Judgment slice (`f829e4f`). That TB9 behavior is a tested
S2 module capability with human acceptance pending; it has no desktop route and
is not part of release `0.8.0`. No application or existing documentation files
were modified by this review.

The curated public site passes its mechanical gate at this baseline. With the
Python 3.11 environment on `PATH`, `python scripts/test_public_docs.py` ran all
four tests successfully and built the strict MkDocs artifact twice. That proves
manifest shape, required tutorial metadata/headings, output allowlisting,
local-link integrity, and artifact hygiene; it does **not** prove that tutorial
claims match current application semantics. The current checks validate
structure and links ([tutorial validation](../../scripts/build_public_docs.py#L49-L126),
[build test](../../scripts/test_public_docs.py#L68-L156)).

## Recommended priority order

| Priority | Outcome |
| --- | --- |
| P0 | Correct public facts that are wrong now: supported version, repository tree, current capability language, and TB8 status/inventory. |
| P1 | Give public readers one versioned current-capabilities surface, release context, install/build boundary, and the missing explicit-context/fixture guidance. |
| P2 | Clarify documentation authority and reduce status duplication so future implementation changes have one place to update. |
| P3 | Add semantic drift checks and optional usability enhancements after the factual and authority repairs land. |

## P0 — factual corrections and stale status

### 1. Correct the public security support table

`SECURITY.md` says fixes apply to the latest release but its table still marks
only `0.1.x` supported ([policy and table](../../SECURITY.md#L3-L12)). The package
and changelog identify `0.8.0` as the latest published application version
([package version](../../app/package.json#L1-L9),
[0.8.0 changelog entry](../../app/CHANGELOG.md#L1-L8)). Because the security
policy is directly allowlisted on the public site
([manifest](../../docs-site/site-manifest.json#L2-L6)), this is the highest-risk
public factual error.

**Correction:** replace the hard-coded `0.1.x` row with the actual supported
release line or a deliberately low-maintenance policy such as “latest release
only,” and add a release-time check that the security table agrees with the
release manifest/package. If `main` is also supported, keep that as a separate
source-build statement rather than a semver table row.

### 2. Repair the root structure tree and narrow current-capability claims

The root README visually nests root-level `docs/` and `prototype/` under
`app/`, while the next entries repeat `app/` inside that already nested tree
([structure block](../../README.md#L22-L31)). Those paths are actually sibling
project roots. The same README says local editing and governance workflows are
available now ([provider paragraph](../../README.md#L34-L35)), but Knowledge
Authoring and the Proposal Review UI are unimplemented
([module/UI status](../architecture/v1-ui/code-map.md#L50-L69)). The application
README also calls existing source and dependencies “future”
([application inventory](../../app/README.md#L3-L10)).

**Correction:** render `app/`, `docs/`, and `prototype/` as sibling roots;
change “future application source” to current source/dependency/build assets;
and split current `0.8.0` behavior from accepted V1 intent. The current public
summary should name only the supported desktop paths: safe repository
open/create/resume, explicit context selection, contextual Atlas/Studio/Paper
Desk inspection, provider-free Synthesis confirmation outcomes, and saved
result viewing/restoration. Editing, real-PDF capture, live provider calls, and
desktop Governance should be labeled planned or module-only.

### 3. Reconcile TB8 status across the code map, brief, and delivery record

The delivery plan records a passing 22-spec packaged workflow and says only
human acceptance remains pending
([TB8 S5 record](../architecture/v1-ui/delivery-plan.md#L425-L435)). Three other
status surfaces disagree:

- the code-map header says every tracer bullet after TB7 is unimplemented
  ([header](../architecture/v1-ui/code-map.md#L1-L5));
- the Governance module row says file-backed persistence is still deferred,
  and the contract-test inventory omits the new Governance storage contract
  ([test/module rows](../architecture/v1-ui/code-map.md#L43-L55)); and
- the TB8 brief still says packaged-runtime verification is pending in both its
  status and prerequisite summary
  ([brief status](../architecture/v1-ui/tracer-bullet-8-spec.md#L1-L21)).

The code map's Governance storage row already says persistence and recovery are
implemented but repeats the packaged-verification error
([adapter row](../architecture/v1-ui/code-map.md#L71-L80)).

**Correction:** make all current-status summaries say: TB8 S2 and S5
implementation and compatible packaged verification are complete; TB9's first
stale-Judgment S2 slice is implemented; human acceptance remains pending for
both; and the desktop Proposal Review workflow is still unimplemented. Add
`governance-version-store.test.ts` to the contract inventory and the
stale-Judgment behavior test to the Governance inventory. Preserve first-cycle
“deferred” statements inside their explicitly historical completion records,
but do not repeat them as present-tense current status.

### 4. Stop presenting the 0.7.0 user-story snapshot as implicitly current

The review titled “Currently supported user stories” is explicitly pinned to
revision `e8c0bc3` and application `0.7.0`
([baseline](2026-08-28-currently-supported-user-stories.md#L1-L17)). At current
`main`, its claim that Governance is in-memory only, its “TB8 has only the
in-memory S2 slice” limitation, and its stated repository-format tension are
historical rather than current-main facts
([module classification](2026-08-28-currently-supported-user-stories.md#L55-L60),
[limitations and tension](2026-08-28-currently-supported-user-stories.md#L62-L83)).
The thirteen desktop stories remain valid because TB8 added no desktop route,
but the module-supported inventory has changed.

**Correction:** preserve the review as evidence for its pinned revision, add a
prominent “historical snapshot / superseded for current-main status” notice,
and either publish a new snapshot for `b5bf417` or maintain a small current
capability matrix elsewhere. Do not silently rewrite the pinned test counts and
revision-specific evidence.

### 5. Make provider setup language truthful for the current composition

The public README links operational `.env` setup as though adding
`OPENAI_API_KEY` enables the current application
([README](../../README.md#L34-L35), [.env template](../../app/.env.example#L1-L28)).
The current code map says the production model Adapter is unimplemented
([model row](../architecture/v1-ui/code-map.md#L78-L81)), and the Synthesis
tutorial correctly says confirmation currently ends in
`agent-provider-unavailable`
([confirmation boundary](../../docs-site/tutorials/confirm-synthesis-request.md#L36-L47)).

**Correction:** label `.env.example` and the public setup prose as the accepted
V1 configuration contract, not an active enablement path in `0.8.0`. State
plainly that placing a key there does not yet enable live Synthesis. Keep the
privacy/location rules, which remain valid.

### 6. Fix the public-site README list grammar

The public-site inventory has two consecutive “and” endings
([published-content list](../../docs-site/README.md#L10-L18)). Remove the first
one or convert the list to simple parallel noun phrases. This is editorial but
cheap and visible in the docs-maintainer entry point.

## P1 — missing public coverage

### 7. Add one public, versioned “Current capabilities and limitations” page

The public manifest publishes architectural intent and task tutorials, but the
revision-pinned supported-user-stories review is intentionally excluded
([public boundary](../../docs-site/README.md#L26-L30),
[manifest](../../docs-site/site-manifest.json#L1-L32)). Consequently, a reader
has no concise public authority that distinguishes desktop-supported,
module-only, planned V1, and post-V1 behavior. Product Decisions describes the
target V1—including authoring, PDF annotation, and Governance—rather than the
current release ([V1 scope](../architecture/v1-ui/product-decisions.md#L51-L55)).

**Addition:** create a curated public page with:

- “applies to” release and commit/date metadata;
- the thirteen currently supported desktop outcomes in user language;
- module-only foundations, including TB8 persistence and the first implemented
  TB9 stale-Judgment policy slice, with their pending human-acceptance state;
- known limitations: no editor, real PDF engine/import/capture, live OpenAI
  Adapter, Proposal Review UI, Search/Ask/Jump, or Learning; and
- links to tutorials, the changelog, and intended architecture.

This should summarize the evidence review, not publish internal test paths or
make the review itself a competing mutable authority.

### 8. Publish release context and state whether docs track `main` or releases

The public site deploys on every push to `main`
([Pages workflow](../../.github/workflows/pages.yml#L1-L6),
[deployment policy](../../docs-site/README.md#L56-L62)), while the changelog is
release-based. Release `0.8.0` contains the in-memory Governance change
([changelog](../../app/CHANGELOG.md#L1-L8)); tutorials landed after that release,
and file-backed TB8 persistence landed after both. Thus “current” can mean at
least latest site, current `main`, or latest app release.

**Addition:** publish or link the application changelog in the public nav and
state the documentation version policy on every current-capability/tutorial
landing page. Use explicit labels such as “Verified against app 0.8.0” or
“Tracks `main` as of commit …”. Keep unreleased implementation notes out of
released capability claims until the corresponding release exists.

### 9. Add an honest installation/distribution boundary

The first-run tutorial assumes an installed or otherwise available supported
build ([prerequisite](../../docs-site/tutorials/first-run.md#L1-L22)), but the
only application instructions are developer setup and an unsigned local package
written to `app/out/` ([build/package instructions](../../app/README.md#L15-L39)).
The Forge configuration defines packaging resources but no distributable makers
([Forge config](../../app/forge.config.ts#L13-L40)), and Release Please updates
release metadata rather than building a signed app artifact
([release workflow](../../.github/workflows/release-please.yml#L13-L22)).

**Addition:** add a public Install/Run page that says whether users must build
from source, where an unsigned `.app` appears, which macOS/architecture is
verified, and whether signing, notarization, installers, auto-update, and
downloadable binaries are unavailable. Do not present a GitHub release tag as a
downloadable desktop release unless an artifact workflow actually supplies one.

### 10. Document explicit context selection and the starter-to-fixture boundary

Explicit selection for repositories with multiple topic/Source Record contexts
is a supported desktop story, but no tutorial walks through the **Select a
Workbench context** / **Use this context** state. The navigation tutorial starts
after a complete context already exists
([prerequisites and steps](../../docs-site/tutorials/navigate-workspaces.md#L1-L35)).

The tutorial journey also needs a global fixture boundary. Creating the empty
starter succeeds, but the current desktop has no Knowledge Authoring or real
source-import/capture UI; later navigation, reading, and Synthesis tutorials
therefore require pre-existing conforming content or the synthetic fixture
([tutorial index](../../docs-site/tutorials/index.md#L9-L28),
[unimplemented authoring and PDF paths](../architecture/v1-ui/code-map.md#L50-L57),
[PDF status](../architecture/v1-ui/code-map.md#L75-L80)). Individual tutorials
mention fixture PDF rendering, which is good, but the index does not tell a new
user why a newly created repository cannot reach those screens.

**Addition:** add either a focused context-selection tutorial or an explicit
section in navigation, and add an index-level callout separating workflows
available from an empty repository from fixture/pre-populated-repository
workflows. Avoid instructing users to copy the synthetic fixture as though it
were production knowledge.

### 11. Extend the Repository Format overview for merged TB8 persistence

The public overview currently stops at the seven roots and the
Working-Material/Governed-Knowledge distinction
([overview](../../docs-site/tutorials/repository-format-overview.md#L23-L42)).
The authoritative format now specifies applied audit JSON, targeted rollback
bytes, and transaction staging under `proposals/applied/`
([persistence contract](../architecture/v1-ui/repository-format.md#L32-L105)).

**Addition:** summarize these artifacts for repository owners: they are portable
application-readable history/recovery data, not current content or user cleanup
candidates. Also state that the current desktop has no Proposal Review/rollback
UI; this is a format/module capability, not a new end-user Governance tutorial.

## P2 — authority and duplication repairs

### 12. Expand the documentation authority map

The authority map assigns intended behavior, architecture, format, tests,
sequence, ADRs, and agent rules, but it does not assign ownership for current
implementation status, released behavior, or public task instructions
([map](../README.md#L9-L21)). That omission leaves the code map, delivery plan,
implementation briefs, changelog, tutorials, and reviews free to repeat “current”
claims—and TB8 demonstrates the resulting drift.

**Correction:** define these additional owners:

- **Code Map:** current production/module/Adapter locations and implementation
  availability;
- **Delivery Plan:** implementation sequence, completion evidence, and human
  acceptance state;
- **Changelog/release notes:** behavior included in a published version;
- **Current Capabilities page:** public release/main capability boundary; and
- **Tutorials:** task instructions for supported public workflows, with an
  explicit applies-to version.

Implementation briefs should preserve scoped decisions and historical cycle
evidence, then link to the delivery plan/code map for current status rather than
maintaining an additional status sentence.

### 13. Give the public Architecture landing page a true public role

The public nav projects `docs/architecture/v1-ui/README.md` as “V1
architecture,” but that page is primarily an agent implementation package: it
contains the TDD gate, internal specs, and agent guidance
([package inventory and gate](../architecture/v1-ui/README.md#L9-L59)). It also
omits the existing TB8 and TB9 briefs from its package list
([brief list](../architecture/v1-ui/README.md#L18-L29)). Excluded internal links
are deliberately flattened during publication, so the public projection is a
partial rendering rather than a purpose-built reader journey.

**Correction:** either create a short public architecture overview that links
to the four genuinely public authorities, or add a prominent banner and
curated “public reading order” to the existing landing page. In both cases,
separate accepted V1 architecture from current implementation, add TB8 to the
internal package inventory, and add the committed TB9 brief with an explicit
“first slice implemented, human acceptance pending” label rather than implying
desktop support or release availability.

### 14. Prune repeated operational/provider rules after authority is clear

Provider, retention, repository, and local-first rules recur across root/app
READMEs, Product Decisions, Architecture, ADRs, and agent guidance. Some
repetition is appropriate for safety, but operational setup prose should
summarize and link to its owner rather than independently imply availability.
The existing review ledger already records repetition as a deferred editorial
opportunity ([DOC-007 and DOC-008](v1-document-grilling-review-ledger.md#L32-L44)).

**Enhancement:** after the current-capability authority exists, keep the
normative decision in Product Decisions/ADRs, the structural consequence in
Architecture, and a short current-state summary in public operational docs.
This lowers the chance that a future provider or persistence slice updates only
one of several present-tense copies.

## P3 — tutorial quality and semantic drift prevention

The first tutorial set has strong boundaries worth preserving:

- it uses visible UI labels and task-shaped steps;
- it explicitly distinguishes fixture preview from production PDF rendering
  ([source tutorial](../../docs-site/tutorials/read-source-record.md#L35-L43));
- it says current confirmation cannot produce a live provider result
  ([Synthesis tutorial](../../docs-site/tutorials/confirm-synthesis-request.md#L36-L47));
- it separates saved Synthesis Working Material from Governed Knowledge and
  calls out absent save/regenerate/edit controls
  ([results tutorial](../../docs-site/tutorials/understand-synthesis-results.md#L34-L42));
  and
- it includes privacy, recovery, and no-Git/no-backup language.

The mechanical tutorial gate should now be supplemented with semantic checks:

1. Add `applies_to_release`, `verified_commit`, or equivalent metadata and
   validate it for task tutorials.
2. Maintain a small mapping from each tutorial to its packaged workflow test or
   manual acceptance story.
3. Check literal button/heading labels used by tutorials against rendered UI
   selectors or a reviewed label inventory.
4. Require each tutorial to declare whether it works with an empty starter,
   pre-populated repository, synthetic fixture, production Adapter, or fixture
   Adapter.
5. On every production behavior PR, ask whether the current-capabilities page,
   changelog/release notes, code map, delivery status, and affected tutorial
   need updates. The current build tests cannot infer that semantic obligation
   from heading/link validation alone.

Optional public enhancements after those controls are in place include
screenshots of stable packaged states, an accessibility/keyboard note, and a
small glossary callout for Working Material, Governed Knowledge, Source Record,
and Source Locator. These should follow verified UI rather than planned
architecture.

## Suggested implementation sequence

1. **Factual hotfix:** update `SECURITY.md`, root/app README structure and
   current-capability wording, `docs-site/README.md`, code-map TB8 inventory,
   and TB8 brief status. Add a historical-snapshot banner to the user-story
   review.
2. **Authority slice:** extend `docs/README.md`, decide whether public docs track
   releases or `main`, and create the versioned Current Capabilities page.
3. **Public journey slice:** add install/distribution documentation, explicit
   context selection, starter-versus-fixture guidance, release notes, and the
   TB8 Repository Format overview.
4. **Architecture projection slice:** replace or curate the public architecture
   landing page and remove redundant status prose from implementation briefs.
5. **Drift-prevention slice:** add tutorial version/fixture metadata and
   semantic-to-workflow mapping, then adopt the documentation-impact checklist
   for later behavior work.

## Acceptance checks for the documentation changes

- The security policy, release manifest, package version, and latest changelog
  entry agree, or intentionally state different scopes.
- A public reader can answer “What can I do in the latest release?”, “What is
  only on `main`?”, and “What is planned?” without consulting internal tests.
- A clean-start reader is not led from an empty starter into a workflow that
  requires unavailable authoring/import behavior.
- Every public tutorial names its applicable version and fixture/production
  boundary and still matches the visible packaged UI.
- TB8 implementation, packaged verification, and human-acceptance state agree
  across the code map, delivery plan, brief, and current-capabilities page.
- The pinned 0.7.0 user-story review remains reproducible but cannot be mistaken
  for current-main status.
- The first TB9 stale-Judgment slice is presented as module-implemented with
  human acceptance pending at the selected `f829e4f` baseline; it is not
  promoted to desktop-supported or released behavior.
- `python scripts/test_public_docs.py` passes under the documented Python 3.11
  environment, all published local links resolve, excluded internal/private
  paths remain absent, and the generated site contains no secrets or source
  maps.
- `git diff --check` passes and the documentation change does not alter
  application code, existing project documentation, or any governed Knowledge
  Repository content.

## Conclusion

The documentation system has a sound curated-public-site boundary and a strong
first tutorial set, but it currently lacks a single owner for “what works now.”
That gap is visible in the stale security version, overbroad README capability
language, contradictory TB8 statuses, and an accurately pinned review whose
title now sounds more current than its evidence. Correcting those facts first,
then introducing a versioned public capability/release surface, will make the
remaining tutorial and authority improvements substantially easier to maintain.
