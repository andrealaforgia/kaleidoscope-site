---
title: Build journal
description: A chronological account of how Kaleidoscope was built feature by feature through nWave — from the first conformance harness to a platform that runs end to end.
---

This is the condensed story of how Kaleidoscope was built, feature by feature,
each through the five [nWave](/background/nwave/) waves. The primary source is the
project's living presentation deck and the per-wave decision documents in the
repository; this page is the narrative spine. If you want the full text, the
slides and narrative live under `docs/presentation/` in the repo.

## Feature 1 — the OTLP conformance harness

The first feature was deliberately tiny: a small Rust library whose single job is
to validate that a byte sequence is a valid OpenTelemetry message. It is the leaf
dependency every other component consumes, and the smallest thing that exercises
the whole nWave loop end to end — a walking skeleton for the *methodology*, not
the product.

Seven user stories, seven Elephant Carpaccio slices, fifty-two acceptance tests
all RED on day one, seven slices delivered outside-in, 100% mutation kill rate,
five blocking CI gates. The first end-to-end CI run was under eight minutes, all
gates green. The most important learning surfaced exactly where it should: the
gap between the artefact and operational reality, at the first real CI run.

## Feature 2 — Aperture, the OTLP receiver

The first network-facing component. Listens on gRPC `:4317` and HTTP `:4318`,
validates every payload through the harness, hands accepted records to a
pluggable sink. Going from a library to a long-lived service introduced runtime
concerns the harness never had: backpressure, graceful shutdown, observing
itself, forward-compatible configuration. Eight slices, 176 active tests, 100%
mutation kill rate.

## Feature 3 — Spark, the SDK

The first feature written from the application's seat rather than the platform's.
Spark lives inside someone else's process, which raises the stakes on public-API
ergonomics: renaming a function becomes a breaking change. Two honest
back-propagations surfaced here — the OpenTelemetry SDK at the pinned version did
not expose certain counts, and exposed a getter for some signal providers but not
others — and both were recorded in the design rather than papered over. This is
the kind of honest escalation the methodology depends on.

## Features 4–6 — Sieve, Codex, Prism

**Sieve** brought sampling inside the pipeline: trace-level decisions that keep
error traces at 100% while throttling the rest, implemented as a decorator over
Aperture's existing sink so Aperture's public surface never moved.

**Codex** added schema authority: catching attribute typos at integration time
with fuzzy "did you mean" suggestions, default-warn and opt-in-strict.

**Prism** was the project's first frontend feature — TypeScript instead of Rust,
React and ECharts instead of a service binary, Vitest and Playwright instead of
`cargo test`. The real question was whether nWave absorbs a paradigm shift or
breaks against it. It absorbed it: six slices delivered a calm, accessible
single-panel triage UI built around a paged-at-03:14 SRE persona, including a
WCAG 2.2 AA pass.

## Features 7–9 — Beacon, Loom, Aegis

**Beacon** brought alerting: a rule state machine, storm-collapsing inhibition,
SLO burn-rate synthesis by the Google SRE workbook, and four routing sinks. A
spike here led to an honest schema decision — semantically CUE-shaped but TOML on
the wire, because no mature Apache-licensed Rust CUE library exists yet.

**Loom** added Git-backed change control over the rule catalogue: validate, plan,
apply, with deterministic diffs and atomic file operations.

**Aegis** added identity: JWT validation, a tenant catalogue, two roles, and an
audit log — deliberately minimal, with the heavier machinery staged for later.
Its first real consumer landed afterwards: Aperture's ingest path now
authenticates every OTLP request against an Aegis HS256 JWT validator,
fail-closed, with the validated tenant rippling through the pipeline and the
gateway refusing to start without an auth block.

## Features 10–15 — the storage plane

Lumen (logs), Pulse (metrics), Ray (traces) and Strata (profiles) each shipped a
v0 in-memory store behind a stable trait, followed by Sluice (the queue) and
Cinder (the tiering governor). Each one pinned the OTLP-shaped types at its
boundary, tenant isolation by construction, and a `MetricsRecorder` seam for
self-observation.

## The v0 → v1 carry-forward

The claim that "v1 inherits the v0 trait" was rhetoric until Cinder v1 shipped
the first durable, file-backed adapter behind an unchanged trait. Then Sluice v1
proved it on a queue, Lumen v1 on a log store, and eventually Pulse, Ray and
Strata followed. Six storage pillars made the round trip across six different
data shapes, with the same WAL-plus-snapshot machinery and at most one additive
error variant each. The carry-forward stopped being a thing the project did and
became a settled property of the methodology.

## The platform comes together

With the pieces durable, the integration work began. An `integration-suite` crate
proved the durable stores compose under one tenant and recover together. A
`self-observe` crate closed the loop so Kaleidoscope watches itself through Pulse.
`kaleidoscope-cli` turned libraries into something an operator could launch. The
`aperture-storage-sink` and `kaleidoscope-gateway` joined ingest to storage —
a span sent to `:4317` finally reached Ray. `query-api` and its siblings closed
the read loop for metrics, logs and traces, and Prism became visible in a browser
from the same origin. Ingest, store, query, see.

## The Earned-Trust pass

A residuality analysis then turned the project's own honesty thesis on itself and
found promises the code had not kept: WAL writes that flushed but never `fsync`ed,
read APIs with no size caps, a cardinality bomb waiting in the metrics index, a
torn WAL tail that bricked recovery, a `tls.enabled` knob that warned and bound
plaintext anyway, and a README that overstated several components. Each was fixed
in code, proven with the right discriminating test, and the documentation dragged
up to the truth — including a dedicated "claims honesty pass" feature whose entire
job was to remove overstatement from the project's own prose. See
[Durability and Earned Trust](/operating/durability/) and
[Read-side safety caps](/operating/read-caps/).

## What stayed consistent throughout

Small commits. Trunk-based development. CI as feedback, not as a blocker.
Fix-forward when reality contradicts the artefact. Discipline, not heroics —
across more than two dozen features, in two languages, through several agent
outages that the methodology survived because the methodology was never the
agent. The agent was just the cheap labour.
