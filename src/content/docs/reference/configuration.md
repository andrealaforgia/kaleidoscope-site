---
title: Configuration reference
description: Every setting Kaleidoscope reads today — data location, tenants, listen addresses, read-side authentication, sampling and logging — with the real defaults and the honest gaps.
---

Kaleidoscope's configuration surface is deliberately small. Most of it is
environment variables; ingest authentication is a small block in a TOML file.
This page lists what each binary actually reads today, with the real defaults,
and is honest about what is fixed and what is not yet configurable.

A note before the tables: there are two ways to run the platform, and they have
different configuration surfaces.

- **The consolidated runtime** is what [`make up`](/getting-started/run-the-stack/)
  starts: one process that does ingest, all three queries and Prism together. It
  is built for local evaluation, so its ports are fixed and its read side runs
  without authentication.
- **The standalone services** — the gateway and the three query binaries — are
  what you assemble when you want to place each part yourself, set listen
  addresses, and turn on authentication.

## Data location (every binary)

Every binary stores and reads from a single root directory, resolved the same
way everywhere.

| Setting | Default | Notes |
| --- | --- | --- |
| First command-line argument | — | If given, it wins over everything below |
| `KALEIDOSCOPE_PILLAR_ROOT` | — | Used when no argument is passed |
| (fallback) | `kaleidoscope-data` | A directory under the working directory |

All four signal stores live under this root, each in its own sub-directory. Point
every binary that should share data at the same root.

## Tenant

One variable sets the tenant for every role, and per-role variables override it
where you need them to differ. The precedence is always **per-role, then the
unified variable, then unset**.

| Setting | Applies to |
| --- | --- |
| `KALEIDOSCOPE_TENANT` | The unified tenant for all roles below |
| `KALEIDOSCOPE_DEFAULT_TENANT` | The tenant assigned to ingested data |
| `KALEIDOSCOPE_QUERY_TENANT` | The tenant the metrics read service answers for |
| `KALEIDOSCOPE_LOG_QUERY_TENANT` | The tenant the logs read service answers for |
| `KALEIDOSCOPE_TRACE_QUERY_TENANT` | The tenant the traces read service answers for |

These tenant variables apply when authentication is **off**. With authentication
on, the tenant comes from the verified token instead, and the query is scoped to
it. The local stack uses `acme`.

## The consolidated runtime (`make up`)

The consolidated runtime is the local-evaluation posture: it reads the data
location, the tenant variables above, and the Prism bundle path. Everything else
is fixed by design.

| Setting | Default | Notes |
| --- | --- | --- |
| `KALEIDOSCOPE_QUERY_STATIC_DIR` | unset | Points at a built Prism bundle to serve same-origin on `:9090` |
| `KALEIDOSCOPE_DEMO_OVERLAY` | on | The always-current demo, synthesised at read time for the demo service only. Set to `0` or `false` to turn it off (a staged cutover, or a raw-only instance) |
| `KALEIDOSCOPE_RETENTION_MAX_AGE` | unset (keep forever) | How long metrics, logs and traces are kept. A window like `60s`, `15m`, `1h` or `7d`; anything older is deleted before each read. Unset keeps everything |

### Data retention

By default Kaleidoscope keeps everything forever. Set
`KALEIDOSCOPE_RETENTION_MAX_AGE` to a single global window — a positive whole
number followed by a unit, one of `s` (seconds), `m` (minutes), `h` (hours) or
`d` (days), for example `KALEIDOSCOPE_RETENTION_MAX_AGE=7d`. The one window
governs all three signals — **metric samples, log records and traces**: anything
older than it is **genuinely deleted**, not hidden. An expired metric point, log
line or span is gone even from an unfiltered read — and, for traces, gone from
both the trace list and a direct lookup by ID — and does not come back after a
restart. The window is applied on the read path, so a value you change takes
effect on the next query. At startup the configured window is logged
(`event=retention.configured`) so you can confirm it live; a malformed value (a
missing unit like `60`, an unknown unit like `10y`, or a zero window like `0s`)
refuses to start rather than being silently ignored.

The demo overlay is on by default so the first look is never empty: it synthesises
a now-relative demo (the failed-checkout trace, its cause log and a metric) for the
demo service alone, with no write path, so it never accumulates and never touches
real data. Every other query passes straight through. See [Run the whole
stack](/getting-started/run-the-stack/).

**Fixed in this runtime:** the listen ports — ingest gRPC `:4317`, ingest HTTP
`:4318`, metrics `:9090`, logs `:9091`, traces `:9092`, all bound on `0.0.0.0` —
are not configurable here. **Read authentication is off** in the consolidated
runtime; it is meant for a single-tenant local box. If you need to choose
addresses or protect the read side, run the standalone services below. Startup is
fail-closed: any bind or probe failure refuses to start rather than coming up
half-running.

## Standalone read services

Each read service is a separate binary with its own listen address and its own
optional authentication. The defaults match the consolidated runtime's fixed
ports, so the two postures line up.

| Service | Address variable | Default address | Tenant variable |
| --- | --- | --- | --- |
| Metrics | `KALEIDOSCOPE_QUERY_ADDR` | `0.0.0.0:9090` | `KALEIDOSCOPE_QUERY_TENANT` |
| Logs | `KALEIDOSCOPE_LOG_QUERY_ADDR` | `0.0.0.0:9091` | `KALEIDOSCOPE_LOG_QUERY_TENANT` |
| Traces | `KALEIDOSCOPE_TRACE_QUERY_ADDR` | `0.0.0.0:9092` | `KALEIDOSCOPE_TRACE_QUERY_TENANT` |

The metrics service also reads `KALEIDOSCOPE_QUERY_STATIC_DIR` to serve Prism
from the same origin.

### Read-side authentication

Each service takes an authentication block as four variables. They are
**all-or-nothing**: set the complete set to require a bearer token, or set none
to run open. A partial or unreadable configuration makes the service **refuse to
start** rather than run unprotected — the same fail-closed posture as the
gateway.

| Variable (metrics shown) | Meaning |
| --- | --- |
| `KALEIDOSCOPE_QUERY_AUTH_ISSUER` | Expected token issuer |
| `KALEIDOSCOPE_QUERY_AUTH_AUDIENCE` | Expected token audience |
| `KALEIDOSCOPE_QUERY_AUTH_SECRET_FILE` | File holding the signing secret |
| `KALEIDOSCOPE_QUERY_AUTH_CATALOGUE` | Tenant catalogue the token is checked against |

The logs and traces services use the same four names with their own prefixes:
`KALEIDOSCOPE_LOG_QUERY_AUTH_*` and `KALEIDOSCOPE_TRACE_QUERY_AUTH_*`. When
authentication is on, the request's token decides the tenant and the per-service
tenant variable is ignored. See [Query API reference](/reference/query-api/) for
how the read side behaves request by request.

## Ingest authentication (gateway)

Ingest authentication is **not** an environment variable. The gateway reads it
from a TOML block, `[aperture.security.auth.jwt]`, carrying the issuer, audience,
a secret file and a tenant catalogue path. As with the read side, an absent,
incomplete or unreadable block makes the gateway refuse to start rather than
accept unauthenticated telemetry.

The gateway also reads the data location (as above) and
`KALEIDOSCOPE_DEFAULT_TENANT`. With ingest authentication on, the verified token
carries the tenant; with it off, a record that arrives without a tenant is
refused rather than silently assigned. See [Tenancy and
identity](/concepts/tenancy/).

## Sampling

Sieve decides which traces to keep. Error-bearing traces are always kept; the
rest are sampled at a configurable rate.

| Setting | Default | Notes |
| --- | --- | --- |
| `SIEVE_NON_ERROR_TRACE_RATE` | `0.1` | Fraction of non-error traces retained (here, 10%) |

## Sending telemetry from your apps

Your applications do not need anything Kaleidoscope-specific to send data — they
use the standard OpenTelemetry environment variables their SDK already
understands, pointed at the ingest endpoint.

| Variable | Meaning |
| --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Where to send OTLP — `http://localhost:4317` for the local stack |
| `OTEL_SERVICE_NAME` | The service name attached to your telemetry |

The bundled sample generator (`make demo` / `make seed`) honours both of these
plus `KALEIDOSCOPE_TENANT` so you can aim it at a different stack or tenant.

## Logging

Every service writes structured JSON traces to standard error. The verbosity is
controlled by the standard `RUST_LOG` filter.

| Variable | Meaning |
| --- | --- |
| `RUST_LOG` | Log filter for the platform's own diagnostics |

## What is not here yet

The read-side [safety caps](/operating/read-caps/) — the 24-hour window and the
100,000-row limit — are fixed in the read contract today, not configuration. TLS
is not yet a working knob. These gaps are tracked honestly on the [honest
limitations](/operating/limitations/) page rather than implied away here.
