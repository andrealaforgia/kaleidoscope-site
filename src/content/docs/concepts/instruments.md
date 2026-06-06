---
title: The fifteen instruments
description: Every Kaleidoscope component is named after a part of an optical instrument. What each one does and what it replaces.
---

Kaleidoscope is composed of fifteen named components, each named after a part of
an optical instrument. The metaphor is the contract: light enters, reflects,
refracts, and emerges as a coherent spectrum. Together they implement the four
pillars of observability — logs, metrics, traces, profiles — plus the
cross-cutting concerns of ingest, buffering, sampling, schema, alerting, anomaly
detection, identity, cold storage and configuration as code.

This page is the conceptual tour. Each instrument also has a **detailed page**
on how it works, under "The instruments" in the sidebar — linked from each name
below. For the current implementation status of each one, see the [component
status table](/reference/components/).

## The integration plane

**Spark** is the SDK applications use to emit telemetry. A manual-init wrapper
over the OpenTelemetry SDK at v0. It replaces per-host APM agents like the
Datadog or New Relic agents — and being an SDK, it carries no per-host fee.

**Aperture** is the OTLP ingest gateway. It listens on gRPC and HTTP, validates
every payload, and hands accepted records to a pluggable sink. It replaces the
Datadog Agent, Splunk Universal Forwarder, or the OpenTelemetry Collector.

**Sieve** is the sampling and filtering processor. It makes trace-level
decisions so you keep the traces that matter during an incident while dropping
volume you do not need. It replaces Datadog Live Search filters and Honeycomb
Refinery.

**Sluice** is the durable ingest buffer — the queue between sampling and storage.
It replaces a vendor's internal queues, and hides behind a port so the
underlying queue (Kafka, NATS, Redpanda) can be swapped.

**Codex** is the schema registry. It catches typos in attributes at integration
time, before they ship, using the OpenTelemetry semantic conventions plus a few
Kaleidoscope house attributes. It replaces an ad-hoc tags taxonomy.

**Aegis** is identity: authentication, authorization, multi-tenancy and audit.
It replaces a vendor's RBAC and user management — and unlike them, it is in the
free product, always.

**Prism** is the unified query and visualisation frontend. It replaces Datadog
dashboards, New Relic One, or Grafana. No seat licensing.

**Beacon** is the alerting and SLO burn-rate engine. It evaluates rules against
any OTel-compatible backend and routes incidents to standard sinks. It replaces
Datadog Monitors, New Relic Alerts, or PagerDuty rule evaluation.

**Loom** is the change-control surface for rules and dashboards as code. It
replaces the Terraform Datadog provider for the catalogue it governs.

## The storage plane

**Pulse** is the time-series metrics engine. It replaces Datadog Metrics, New
Relic Metrics, or Cloud Monitoring — with no metric-count surcharge.

**Lumen** is log storage and search. It replaces Datadog Logs, Splunk, Loki or
Elastic, on Apache Parquet in your own object storage.

**Ray** is distributed trace storage and query. It replaces Datadog APM, New
Relic Distributed Tracing, or Tempo, and charges nothing per span.

**Strata** is profile storage. A passive profile sink at v0 (continuous scraping
is roadmap). It replaces the Datadog Profiler or New Relic code-level metrics.

**Cinder** is the tiering governor. It records which tier each item lives in and
moves data between hot, warm and cold as it ages. It replaces Datadog Flex Logs
and S3 archive SKUs; the object-storage cold tier itself is a later version.

## Cross-cutting analysis

**Augur** is anomaly detection and AIops. At v0 it is hand-rolled classical
statistics — Welford's online variance and frequency tables, no ML stack — with
a generic trait that later versions lift to change-point detection and embedding
clustering. It replaces Datadog Watchdog or New Relic AI.

## The supporting crates

Beyond the fifteen named instruments, the workspace carries a handful of
cross-cutting crates that make them work as one platform: an integration suite
of cross-crate composition tests, a self-observability bridge so Kaleidoscope
watches itself through its own primitives, the storage sink that translates OTLP
into the durable pillars, and the runnable binaries — `kaleidoscope-cli`,
`kaleidoscope-gateway` and `query-api` — that you actually launch.
