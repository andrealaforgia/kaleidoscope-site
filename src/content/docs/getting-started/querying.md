---
title: Query your telemetry
description: How to read metrics, logs and traces back out of Kaleidoscope through the OpenTelemetry-shaped read APIs.
---

Once telemetry is in the durable stores — whether through the
[gateway](/getting-started/gateway/) or the [CLI](/getting-started/quick-start/)
— you read it back through a small set of HTTP endpoints. The metrics endpoint
speaks the Prometheus query protocol Prism already understands; logs and traces
return plain JSON.

This page is a practical walkthrough. The exact contract, including every error
case, is in the [Query API reference](/reference/query-api/).

## Metrics: Prometheus-shaped range queries

```mermaid
flowchart LR
    Q["query: name{service.name='checkout'}"] --> P[parser]
    P -->|name| Pulse[(pulse)]
    Pulse -->|fan out across series| F[keep_row filter]
    P -->|matchers| F
    F --> M[Prometheus matrix]
```

`GET /api/v1/query_range` reads metrics out of the durable Pulse store and
answers in the matrix shape Prometheus clients expect. The query is a metric
name, optionally followed by label matchers:

```
http_requests_total
http_requests_total{service.name="checkout"}
http_requests_total{service.name!="batch"}
http_requests_total{route=~"/api/.*"}
```

Supported matchers are equality (`=`), inequality (`!=`), regex (`=~`) and
negated regex (`!~`). Values are double-quoted; multiple matchers are ANDed.
Label names may contain dots, because labels are OpenTelemetry-shaped.

Two behaviours worth knowing, both chosen so the number on your screen never
lies:

- **Regex is whole-value anchored.** `service.name=~"check"` does *not* match
  `checkout`; every pattern compiles as `^(?:…)$`, exactly like Prometheus. The
  engine is the RE2-derived `regex` crate, so there is no catastrophic
  backtracking to exploit.
- **An absent label is the empty string.** `{env=""}` matches series with no
  `env` label; `{env!=""}` keeps only those that carry one.

Anything the parser does not support — a function, an aggregation, an
unterminated brace — returns a clean `400` that says "not yet", never a
plausible-looking wrong answer. At v0 the `step` parameter is accepted but not
honoured: you get the raw in-window points, not a re-stepped grid.

## Logs: window, severity and body search

`GET /api/v1/logs` returns the records for a tenant inside a time window as a
JSON array, ascending in time. In the consolidated stack the logs service
listens on `:9091`:

```sh
curl 'http://localhost:9091/api/v1/logs?start=...&end=...'
```

You can narrow the result before it is capped:

- `min_severity=WARN` — only records at that OTel severity or worse.
- `body_contains=kafka%20timeout` — case-sensitive substring match on the body.
- `body_regex=kafka.*(timeout|timed%20out)` — regex match; use `(?i)` to fold
  case.
- `trace_id=<32-hex>` — fetch the logs correlated to one trace, across all time;
  this selector needs no window. See the pivot below.
- `limit` and `offset` — paginate within the window.

An empty window is a calm `[]` at `200`, not an error — finding nothing is an
ordinary answer. A malformed or back-to-front window is refused with `400`
before the store is even touched.

## Traces: by service-and-window, or by id

In the consolidated stack the traces service listens on `:9092`.
`GET /api/v1/traces?service=checkout&start=...&end=...` returns the in-window
spans for a tenant and a service. `service` is required, because Ray's store is
keyed by it; a missing or empty `service` earns a clean `400`.

Add `error=true` to narrow the result to only the traces that contain at least
one failing span — and you get the *whole* failing trace, not just its error
span. It is the fast path from "show me everything" to "show me what broke":

```sh
curl 'http://localhost:9092/api/v1/traces?service=kaleidoscope-demo&start=...&end=...&error=true'
```

When you already have the id — from an alert, a log line, or a customer reading
numbers off a screen — look it up directly:

```sh
curl 'http://localhost:9092/api/v1/traces/by_id?trace_id=4bf92f3577b34da6a3ce929d0e0e4736'
```

The id is 32 hex characters, case-insensitive, W3C/OTel shape. An unknown id is
a calm `200 []`, never a `404`.

## Trace and its logs, in one call

`GET /api/v1/traces/with_logs?trace_id=<32-hex>` returns one object —
`{trace_id, spans, logs}` — carrying the trace's spans (status included) and
every log correlated to that trace, so "a trace and its logs" is one request
instead of two and a client-side stitch. Like the by-id lookup it is keyed on
the trace alone, so it needs no time window. An unknown id is a calm `200` with
empty `spans` and `logs`.

## Follow a failure from trace to cause

The [always-current demo](/getting-started/run-the-stack/) is shaped to walk this
path, and it is there as soon as the stack is up — no seeding needed. It carries
a failed checkout trace for the `kaleidoscope-demo` service, with timestamps
always relative to now so it is queryable at any time. The failed span is marked
with an error status, and its cause log rides inside the same trace, so one call
shows both *where* and *why*:

```sh
curl 'http://localhost:9092/api/v1/traces/with_logs?trace_id=4bf92f3577b34da6a3ce929d0e0e4736'
```

The span comes back with an error status reading `checkout failed: card
declined` (the *where*), alongside the matching log record (the *why*). To do it
in two steps instead, look the trace up with `/api/v1/traces/by_id` on `:9092`,
then pass the same id to `/api/v1/logs?trace_id=…` on `:9091`.

## Safety caps you will hit on purpose

Every read endpoint enforces two limits, declared as part of the contract: a
maximum window of **24 hours** and a maximum result of **100,000 rows**. Exceed
either and you get a `400` that names which one — not a truncated answer with a
quiet `X-Truncated` header, and not an out-of-memory melt. The reasoning is on
the [Read-side safety caps](/operating/read-caps/) page.
