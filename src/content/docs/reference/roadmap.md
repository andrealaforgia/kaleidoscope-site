---
title: Roadmap and phasing
description: The phased build plan for Kaleidoscope — what ships when, and which first useful workflow each phase unlocks.
---

The roadmap is organised into phases. Calendar is wall-clock time, not effort.
The integration plane ships first and is useful on top of any existing OTel
backend; the storage plane ships incrementally, each engine opt-in.

| Phase | Window | What ships | First useful workflow |
| --- | --- | --- | --- |
| 0 | Months 0–2 | Codex + Spark + OTLP conformance harness | Instrumented services emit standard OTLP |
| 1 | Months 2–4 | Aperture + Prism v0 | Telemetry routed through Aperture; viewable in Prism over your existing backend |
| 2 | Months 4–6 | Beacon + Aegis + Loom v0 | SLO-backed alerting, multi-tenant access, dashboards-as-code, on your existing storage |
| **MVP** | **Month 6** | **First deployable Kaleidoscope** | **The integration plane works over any existing OTel backend** |
| 3 | Months 6–10 | Lumen (first-party log engine) | Optional migration off Loki / Elasticsearch |
| 4 | Months 10–14 | Pulse (first-party metrics engine) | Optional migration off Mimir / VictoriaMetrics |
| 5 | Months 14–18 | Ray (first-party trace engine) + Sieve v1 | Optional migration off Tempo |
| 6 | Months 18–22 | Strata + cross-pillar exemplars | Full four-pillar correlation |
| 7 | Months 22–26 | Cinder + Sluice durability + DR | Production-grade retention and disaster recovery |
| 8 | Months 26–30 | Native queue (first port escape hatch) | Stops depending on Kafka / NATS |
| 9 | Months 30–36 | Native authz + Augur v0 | Stops depending on SpiceDB; ships modest anomaly detection |

## How the current state maps onto this

The build did not follow the phase calendar linearly. The project chose to ship
**v0 in-memory adapters behind stable traits** for nearly every component first
— proving the contracts — and then return to add **durable v1 adapters** for the
six storage pillars and for alert state. The result is that pieces from several
phases exist at once, at different maturities.

That is why the [component status table](/reference/components/) is the most
accurate picture of "now", and this roadmap is the picture of "where it is
going". The two are meant to be read together.

## The MVP milestone, restated

The milestone that matters most for adopters is the **integration plane over your
existing backend**. That is the point at which Kaleidoscope earns its keep
without asking you to migrate any storage: better alerting with Beacon, schema
validation with Codex, config-as-code with Loom, multi-tenant access with Aegis,
and a calm triage UI in Prism — all in front of the Prometheus, Mimir, Loki or
Tempo you already run. The storage plane is then a series of optional, one-at-a-
time migrations on your own schedule.
