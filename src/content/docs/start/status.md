---
title: Is it ready for you?
description: An honest account of what Kaleidoscope can do today, what is still in-memory, and what is roadmap — so you can decide whether to adopt it now.
sidebar:
  badge:
    text: Read this
    variant: caution
---

This is the most important page on the site. Kaleidoscope's whole reason for
existing is to be honest where other tools overstate, so the documentation has
to hold itself to the same standard. Here is the unvarnished state of the
project.

## The one-paragraph answer

Kaleidoscope is **implementation in progress**. It is not yet a drop-in Datadog
replacement and you should not bet a production incident-response practice on it
today. What it *is*: a working, end-to-end pipeline you can run on your own
machine — ingest OTLP, persist it durably, query it back, and plot it — with a
real test discipline behind every line. If you want to evaluate it, experiment
with it, contribute to it, or follow a build done in the open, it is ready for
that now.

## What works today

At the time of writing, the project reports **134 test suites green on `main`**
and **twenty-six features shipped** across the platform plane.

The platform runs end to end:

- The **`kaleidoscope-gateway`** binary receives OTLP over gRPC (`:4317`) and
  HTTP (`:4318`), validates it against the conformance harness, and persists
  each signal into its durable pillar — logs to Lumen, traces to Ray, metrics
  to Pulse.
- The **`kaleidoscope-cli`** binary wires a durable log store plus the tiering
  governor plus self-observability into an operator-facing ingest / read /
  inspect pipeline.
- The **`query-api`** binary serves a Prometheus-shaped
  `/api/v1/query_range` endpoint over the durable metrics store, and can also
  serve the Prism frontend bundle from the same origin (no separate web server,
  no CORS).
- Log and trace read endpoints (`/api/v1/logs`, `/api/v1/traces`,
  `/api/v1/traces/by_id`) close the read loop for all three classical signals.

So the loop is complete: **ingest, store, query, see.**

## What is durable, and what is not

The single most important distinction for an adopter. "Durable" here means the
data survives a process restart; "v0" means an in-memory adapter that loses its
data when the process exits.

All six storage pillars now ship a **durable v1 adapter** behind the same trait
as their v0 in-memory one:

| Pillar | Durable store |
| --- | --- |
| Logs (Lumen) | `FileBackedLogStore` |
| Metrics (Pulse) | `FileBackedMetricStore` |
| Traces (Ray) | `FileBackedTraceStore` |
| Profiles (Strata) | `FileBackedProfileStore` |
| Tiering ledger (Cinder) | `FileBackedTieringStore` |
| Ingest buffer (Sluice) | `FileBackedQueue` |

Alerting state is durable too (`FileBackedRuleStateStore`), so a firing alert
survives a restart instead of re-paging the on-call engineer for an incident
they are already handling.

Durability is not just claimed — it is proven with kill-9 tests and an
fsync-honesty probe that refuses to start if the underlying disk lies about
persistence. See [Durability and Earned Trust](/operating/durability/).

The **integration-plane** components (Spark, Aperture, Sieve, Codex, Prism,
Augur, Aegis) are still at **v0**. They work, they are tested, but several keep
their working state in memory. Check the [component status
table](/reference/components/) for the per-component picture.

## What is explicitly roadmap

A few capabilities are named in the docs but not yet built. The project is
careful to say so rather than imply otherwise:

- **Object-storage cold tier.** Cinder stores tier *metadata* today; the
  S3 / GCS / R2 cold tier over OpenDAL + Iceberg is v2.
- **PromQL beyond a bare metric name.** `query_range` accepts a metric name with
  label matchers (equality, inequality, regex). Functions, aggregations and the
  rest of PromQL are not implemented; the endpoint returns a clean `400` rather
  than a plausible wrong answer.
- **`step` re-sampling.** `query_range` accepts the `step` parameter but does not
  honour it at v0: it returns the raw in-window points, not a re-stepped grid.
- **Auto-instrumentation.** Spark is a manual-init SDK wrapper at v0;
  auto-instrumentation is a later version.
- **Continuous profiling.** Strata is a passive profile *sink*; continuous
  scraping is roadmap.
- **TLS / SPIFFE on the wire.** Aperture refuses to start if you enable these
  knobs, rather than binding plaintext while pretending otherwise. Real TLS is
  Phase 2.

## Who should adopt it now

You are a good fit today if you want to **evaluate** the architecture, **run the
pipeline locally**, **build on the SDKs and protocol libraries** under Apache
licensing, or **follow and learn from** a platform built fully in the open with
a strict TDD discipline.

You should **wait** if you need a turnkey, multi-node, production-grade Datadog
replacement with cold-tier retention and full PromQL today. The
[roadmap](/reference/roadmap/) shows when those land.

## A note on contributions

Kaleidoscope is currently a single-author project and external pull requests are
not yet accepted. The repository is public so the design can be read and
observed. When contribution opens, the model is the Developer Certificate of
Origin with no Contributor Licence Agreement — see [Licensing](/background/licensing/).
