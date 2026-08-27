# Evidence-backed research

Follow `docs/agents/knowledge-base.md` whenever research writes to the repository. The user owns the knowledge; the agent gathers, evaluates, challenges, and proposes.

## 1. Frame the question

State the question, intended scope, relevant field, and what would count as an answer or bounded non-answer. Identify claims whose currency, stakes, or controversy demand corroboration. Framing is complete when the evidence needs and stopping condition are explicit.

## 2. Gather by source role

Use sources according to their role:

- **Primary evidence**: original research, datasets, artifacts, interviews, statutes, standards, source code, or direct observations.
- **Authoritative reference**: official documentation, consensus reports, established reference works, or institutional guidance.
- **Secondary synthesis**: systematic reviews, meta-analyses, scholarly reviews, or strong explanatory works integrating primary sources.
- **Criticism and interpretation**: credible methodological critiques, competing schools, or alternative readings.
- **Discovery lead**: search results, aggregators, unsourced summaries, social media, or general reference pages used to locate stronger material.

Discovery leads and agent summaries are not evidence. Primary-first does not mean primary-only: a rigorous synthesis may outweigh an isolated primary source.

Evaluate each material source for directness, methodology, transparency, authority, corroboration, currency, incentives, and version. Adapt the test to the field. Prefer version-matched official sources for software, controlling and current authority for law, proofs and direct verification for mathematics, and primary artifacts paired with scholarship for history and the humanities.

Gathering is complete when every material claim has suitable direct support, consequential or contested claims have proportionate corroboration, and the strongest credible contrary evidence is represented.

## 3. Preserve provenance

Put citations beside the claims they support. Record author, title, publication date, access date where relevant, and the precise page, section, theorem, version, or passage when practical. Mark inaccessible or indirectly known sources as unverified instead of implying they were read.

Use explicit markers where provenance or certainty could be confused:

- `**Source claim:**`
- `**Established fact:**`
- `**Interpretation — user:**`
- `**Inference — agent:**`
- `**Hypothesis:**`

A hypothesis states what evidence would strengthen or weaken it. An agent inference remains attributable even when well supported.

For external PDFs, keep the portable Source Record and page-linked annotations in the selected repository's `sources/papers/`. Use DOI or another persistent identifier, citation key, canonical URL, edition or version, and an optional logical locator. Preserve what the source claimed even if later evidence rejects it; annotate retractions or reliability changes separately.

## 4. Synthesize and challenge

Answer the question rather than concatenating summaries. Distinguish evidence from interpretation, preserve uncertainty, and show the strongest alternative account. Practice constructive dissent: state tensions plainly, separate factual correction from preference, and leave judgment with the user.

When credible evidence has no clear resolution, present a decision brief containing:

1. Competing claims.
2. Strongest evidence for each.
3. Consequences of each interpretation.
4. The agent's recommendation and confidence.
5. The exact question requiring human judgment.

Ask the user for guidance rather than flattening the conflict.

## 5. Complete the research

Research is complete only when:

- the question is answered or explicitly bounded;
- every material claim is cited;
- credible contrary evidence is represented;
- uncertainty is stated proportionally;
- open questions are recorded; and
- proposed core changes are isolated as exact diffs awaiting final sign-off.

For continuing education, choose useful stages from `explain → retrieve → apply → discriminate`. Present exercises before solutions and evaluate against explicit criteria. Use mistakes to select the next exercise. Reusable practice is core; temporary practice remains with its source, course, or project.
