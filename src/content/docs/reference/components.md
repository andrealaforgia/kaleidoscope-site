---
title: Component status
description: The current implementation status of every Kaleidoscope component — shipped, v0 in-memory, or durable v1 — and what each one replaces.
---

This is the honest, at-a-glance state of every component. Read the status column
literally:

<p>
<span class="k-status k-status--shipped">shipped</span> — complete and in use internally.
<span class="k-status k-status--v0">v0</span> — in-memory adapter behind a stable, tested trait; loses state on restart.
<span class="k-status k-status--v1">v1</span> — durable file-backed adapter behind the same trait; survives restart.
<span class="k-status k-status--roadmap">roadmap</span> — named but not yet implemented.
</p>

## The fifteen instruments

Each instrument name links to a detailed page on how it works. For the
conceptual tour see [The fifteen instruments](/concepts/instruments/).

| Component | Role | Replaces | Status |
| --- | --- | --- | --- |
| **Harness** | OTLP conformance test suite | (internal) | <span class="k-status k-status--shipped">shipped</span> |
| [**Spark**](/components/spark/) | Manual-init OTel SDK wrapper | Datadog / NR APM agents | <span class="k-status k-status--v0">v0</span> |
| [**Aperture**](/components/aperture/) | OTLP-compatible ingest gateway | Datadog Agent, Splunk UF, OTel Collector | <span class="k-status k-status--v0">v0</span> |
| [**Sluice**](/components/sluice/) | Durable ingest buffer | A vendor's internal queues | <span class="k-status k-status--v1">v1</span> |
| [**Sieve**](/components/sieve/) | Sampling and filtering | Datadog filters, Honeycomb Refinery | <span class="k-status k-status--v0">v0</span> |
| [**Codex**](/components/codex/) | Schema registry + semantic conventions | Datadog tags taxonomy | <span class="k-status k-status--v0">v0</span> |
| [**Pulse**](/components/pulse/) | Time-series metrics engine | Datadog / NR Metrics, Cloud Monitoring | <span class="k-status k-status--v1">v1</span> |
| [**Lumen**](/components/lumen/) | Log storage and search | Datadog Logs, Splunk, Loki, Elastic | <span class="k-status k-status--v1">v1</span> |
| [**Ray**](/components/ray/) | Distributed trace storage and query | Datadog APM, NR Tracing, Tempo | <span class="k-status k-status--v1">v1</span> |
| [**Strata**](/components/strata/) | Passive profile storage | Datadog Profiler, NR code-level metrics | <span class="k-status k-status--v1">v1</span> |
| [**Cinder**](/components/cinder/) | Local tier-metadata governor | Datadog Flex Logs, S3 Archives | <span class="k-status k-status--v1">v1</span> |
| [**Prism**](/components/prism/) | Single-metric PromQL explorer (full dashboards: future) | Grafana (single-panel explore) | <span class="k-status k-status--v0">v0</span> |
| [**Beacon**](/components/beacon/) | Alerting + SLO burn-rate engine | Datadog Monitors, NR Alerts, PagerDuty | <span class="k-status k-status--v1">v1</span> |
| [**Augur**](/components/augur/) | Anomaly detection / AIops | Datadog Watchdog, NR AI | <span class="k-status k-status--v0">v0</span> |
| [**Aegis**](/components/aegis/) | AuthN/Z, multi-tenancy, audit | Datadog RBAC, NR user management | <span class="k-status k-status--v0">v0</span> |
| [**Loom**](/components/loom/) | Rule-catalogue change control | Terraform Datadog provider | <span class="k-status k-status--v0">v0</span> |

:::note
Status reflects the state of `main`. "v1" on a storage pillar means a durable,
file-backed adapter ships behind the same trait as the v0 in-memory one and
survives a process restart. Capabilities such as Cinder's object-storage cold
tier, Strata's continuous scraping, and Spark's auto-instrumentation remain
<span class="k-status k-status--roadmap">roadmap</span> even where the component
itself is shipped — see [Honest limitations](/operating/limitations/).
:::

## The runnable binaries

Beyond the named instruments, these are the programs you actually launch:

| Binary | What it is | Status |
| --- | --- | --- |
| `kaleidoscope-gateway` | The OTLP gateway that receives telemetry and persists it into the durable stores | <span class="k-status k-status--shipped">shipped</span> |
| `kaleidoscope-cli` | The operator tool for ingest, read, inspection and tiering | <span class="k-status k-status--shipped">shipped</span> |
| `query-api` | The metrics read service (and can serve the Prism frontend) | <span class="k-status k-status--shipped">shipped</span> |
| `log-query-api` | The log read service | <span class="k-status k-status--shipped">shipped</span> |
| `trace-query-api` | The trace read service | <span class="k-status k-status--shipped">shipped</span> |

Kaleidoscope also observes itself through its own metrics engine and carries an
internal test suite that checks the parts compose as one platform.

## Reading the status honestly

If you are evaluating Kaleidoscope as your future observability platform, the
columns that matter most are the storage pillars at **v1** — those hold data
durably today — and the integration components at **v0**, which work but keep
working state in memory. The [two planes](/concepts/two-planes/) page explains why
that division exists, and the [durability page](/operating/durability/) explains
how the v1 stores prove they actually persist.
