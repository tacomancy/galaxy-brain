# Tracer Bullet 6.1: Promote the Atlas view

Status: planned; implementation pending.

This follow-up slice promotes the Atlas view from the accepted TB6 functional shell to a prototype-informed production UI. It is a new S1 behavior slice, not a second implementation phase hidden inside TB6.

## Public Behavior

After opening the fixture Knowledge Repository, Atlas presents a polished **Continue working** surface using real Workbench state:

- Topic: `Bayesian statistics`.
- Source Record: `Bayesian statistics fixture source`.
- A visible, keyboard-operable action opens the topic in Studio.
- The selected repository and existing empty, unavailable, and invalid-repository recovery states remain visible and truthful.

## Test Seam and expected values

Use S1, the packaged desktop workflow, through the real Workbench Session, repository Adapter, preload bridge, and Atlas UI Adapter. Assert visible content, accessible names, focus, and the transition outcome. Do not use mock cards as a substitute for repository state or inspect renderer state as a side channel.

## Minimum vertical path

1. Replace the minimal selected-repository Atlas presentation with the continuation layout needed by this behavior.
2. Bind the topic and Source Record labels to the caller-visible Workbench context.
3. Preserve the existing Atlas → Studio transition and all repository recovery outcomes.
4. Add the focused S1 workflow and manual accessibility review.

## Boundaries and acceptance

This slice does not add metrics, learning progress, proposal queues, Search, Ask, Jump, generated dashboard data, or new Atlas domain rules. It must remain provider-free and local. Acceptance requires the packaged workflow to display the real continuation surface, preserve accessible keyboard activation, and retain all previous S1 coverage.
