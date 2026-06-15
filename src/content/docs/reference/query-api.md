---
title: Query API reference
description: The HTTP read endpoints for metrics, logs and traces — parameters, response shapes, error cases and the shared safety caps.
---

The read side is served by a family of small HTTP services sharing a common
scaffold (`query-http-common`): the same safety caps, the same error envelope,
the same tenant resolution, the same JSON tracing to stderr. This page is the
contract.

## Shared behaviour

**Tenant resolution.** Every endpoint resolves the tenant and fails closed. An
unresolved tenant is a `401`, never someone else's data.

**Authentication.** When the read service is configured with authentication, a
request must carry a valid bearer token and the query is scoped to that token's
tenant; a missing or invalid token is a `401` before the store is touched. When
authentication is not configured, the service uses a configured tenant and
ignores any `Authorization` header. This applies to all the read endpoints —
metrics, logs and traces (including trace lookup by id). If you do configure
authentication but the config is incomplete or unreadable, the service refuses to
start rather than run unprotected, the same fail-closed posture as the gateway.

**Safety caps.** Every endpoint enforces a maximum window of **86,400 seconds
(24h)** and a maximum result of **100,000 rows**. Exceeding either is a `400`
naming `window` or `result`. See [read-side caps](/operating/read-caps/).

**Error envelope.** Errors return a small JSON object with `error` and `status`
fields. The body never echoes raw input values or forwarded headers.

**Empty is not an error.** An empty window or a no-match query returns a calm
`200` with an empty result, not an error — finding nothing is an ordinary answer.

**Time bounds.** `start` and `end` accept either RFC3339 timestamps or Unix
seconds. A malformed bound is a `400` that names both accepted formats and does
not echo the raw value.

**Usage help.** `GET /help` on the metrics origin (`:9090`) returns a plain-text
usage summary with example `curl` commands and the accepted time formats. The
Prism SPA is still served at `/`.

## Metrics — `GET /api/v1/query_range`

Reads from the durable Pulse store, answers in the Prometheus matrix shape.

| Parameter | Meaning |
| --- | --- |
| `query` | Metric name, optionally with label matchers (see below) |
| `start`, `end` | Window bounds |
| `step` | Accepted but **not honoured** at v0 — raw points returned, not a re-stepped grid |

**Query grammar.** A bare metric name, optionally followed by
`{label OP "value", …}`:

| Operator | Meaning |
| --- | --- |
| `=` | equals |
| `!=` | not equals |
| `=~` | regex match (whole-value anchored, RE2-derived, linear time) |
| `!~` | negated regex match |

Label names may contain dots. An absent label is treated as the empty string,
exactly as Prometheus does, so `{env=""}` matches series lacking the label.
Anything outside this grammar — functions, aggregations, unterminated braces,
unquoted values — returns a `400` that says "not yet".

## Logs — `GET /api/v1/logs`

Reads from the durable Lumen store, returns a JSON array of records ascending in
time.

| Parameter | Meaning |
| --- | --- |
| `start`, `end` | Window bounds for a time-range query, validated before the store is touched |
| `trace_id` | Fetch the logs correlated to one trace (32 hex chars), across all time; an invalid id is a `400` naming the format |
| `min_severity` | One of the six OTel severity names; returns that severity or worse |
| `body_contains` | Case-sensitive substring match on the record body (≤ 1024 bytes) |
| `body_regex` | Regex match on the body; use `(?i)` to fold case (≤ 1024 bytes) |
| `limit`, `offset` | Pagination within the window (after the cap check) |

`body_contains` and `body_regex` are mutually exclusive; supplying both is a
`400`. An empty value for any string filter is a `400`, not a silent "no filter".

A log record carries its `trace_id` and `span_id` as lowercase hex, the same form
the trace API uses. So correlation works both ways: take a log's `trace_id` and
look the trace up with `/api/v1/traces/by_id`, or pass `trace_id` here to pull
that trace's logs in one query. A `trace_id` query needs no time window — it spans
all time — though a window is still applied if you give one. A request must carry
either a window or a `trace_id`; with neither, it is a `400`. An unknown id is a
calm `200 []`.

## Traces — `GET /api/v1/traces`

Reads from the durable Ray store, returns a JSON array of spans.

| Parameter | Meaning |
| --- | --- |
| `service` | **Required.** Ray's store is keyed by service; missing or empty is a `400` |
| `start`, `end` | Window bounds |

## Trace by id — `GET /api/v1/traces/by_id`

| Parameter | Meaning |
| --- | --- |
| `trace_id` | 32 hex characters, case-insensitive (W3C/OTel). Wrong length, empty or non-hex is a `400` |

An unknown trace id is a calm `200 []`, never a `404`.

## Serving Prism from the same origin

`query-api` optionally serves the Prism static bundle alongside its routes when
`KALEIDOSCOPE_QUERY_STATIC_DIR` points at a built bundle. Exact API routes win
over the static fallback; unknown paths fall through to Prism's `index.html`. The
switch is off by default. See [See it in Prism](/getting-started/prism/).
