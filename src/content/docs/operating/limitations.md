---
title: Honest limitations
description: A single page that collects everything Kaleidoscope cannot do yet, so you can plan an adoption without surprises.
---

This page exists because the project has a feature whose entire job was to remove
overstatement from its own documentation. In that spirit, here is everything in
one place that Kaleidoscope cannot do yet. None of it is hidden in a footnote.

## Deployment shape

Kaleidoscope today runs as a **single-process, local pipeline**. The end-to-end
loop — ingest, store, query, see — is real, but there is no multi-node,
horizontally-scaled, highly-available deployment. Treat the current state as an
evaluation and development setup.

## Storage and retention

- **No object-storage cold tier yet.** Cinder stores tier *metadata* and can move
  items between hot, warm and cold conceptually, but the actual S3 / GCS / R2
  cold tier over OpenDAL and Iceberg is v2.
- **Integration-plane state is still in memory.** Several integration components
  (Spark, Aperture, Sieve, Codex, Prism, Augur, Aegis) are at v0; the durable
  v1 adapters exist for the six storage pillars and for alert state, not yet for
  the integration plane.

## Query

- **PromQL is a small subset.** `query_range` supports a metric name plus label
  matchers (equality, inequality, regex). Functions, aggregations, and the rest
  of PromQL return a clean `400`, not a wrong answer.
- **`step` is not honoured.** The parameter is accepted but ignored at v0; you
  get raw in-window points, not a re-stepped Prometheus grid.
- **Read caps are hard-coded.** The 24-hour window and 100,000-row result caps
  are constants, not yet configuration. See [read-side caps](/operating/read-caps/).
- **Pagination cannot exceed the result cap.** You narrow the window instead.
- **Span-attribute search is exact-string only.** Filtering traces by a span
  attribute (`attr_key` / `attr_value`) matches the value as an exact string —
  good for pulling one `customer.id` out of the crowd, but you cannot yet compare
  a numeric attribute as a number (no `duration_ms >= 500`-style threshold). Span
  attribute values are stored as strings today; typed numeric attributes are a
  later iteration on the [roadmap](/reference/roadmap/).

## Ingest and SDK

- **Spark is manual-init only.** Auto-instrumentation is a later version.
- **Histograms and summaries are skipped.** The storage sink stores gauge and sum
  metrics; histogram and summary points are skipped with an observable event
  until Pulse's point shapes for them land.

## Profiling

- **Strata is a passive sink.** It stores profiles handed to it; continuous
  profile scraping is roadmap.

## Security on the wire

- **Ingest auth is HS256 JWT only.** The gateway now authenticates every OTLP
  ingest request against an Aegis HS256 JWT validator, fail-closed, and refuses
  to start without a complete auth block. The signing scheme is symmetric (HS256
  with a shared secret) at v0; asymmetric keys, JWKS rotation and SPIFFE workload
  identity are later versions.
- **No TLS yet.** Aperture *refuses to start* if you enable the `tls.enabled` or
  `auth.spiffe.enabled` knobs, rather than binding plaintext and pretending. So
  ingest auth currently rides over plaintext unless you terminate TLS in front of
  the gateway. Real in-process transport security is Phase 2. The knobs exist in
  the schema as forward-compatibility room, defaulted off.
- **Aegis is otherwise minimal.** A TOML tenant catalogue and two roles
  (`viewer`, `operator`). Full OPA-style RBAC, federation and a database-backed
  catalogue are later versions, and the auth retrofit into Beacon and Prism has
  not landed yet (only Aperture's ingest path so far).

## Alerting

- **No SMTP sink yet.** Four HTTP sinks ship (webhook, Mattermost, Zulip,
  OnCall); SMTP is deferred to a later version.

## Contributions

External pull requests are **not yet accepted**. The repository is public so the
design can be read. When contribution opens it will be under the Developer
Certificate of Origin with no CLA — see [Licensing](/background/licensing/).

## How to read this list

Everything here is on the [roadmap](/reference/roadmap/) with a phase attached.
The point of being this explicit is that you can plan around it. If a limitation
above is a blocker for you, the roadmap tells you roughly when it lifts; if none
of them are, the [quick start](/getting-started/quick-start/) is waiting.
