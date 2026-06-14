---
title: Run the whole stack (one command)
description: Bring the entire Kaleidoscope ingest-and-query loop up locally with a single command, then send telemetry and see it in Prism.
sidebar:
  badge:
    text: Easiest
    variant: tip
---

This is the easiest way to try Kaleidoscope end to end on your own machine: one
command brings up a single process that receives telemetry, stores it, answers
queries, and serves the Prism UI — all together, with what you send queryable
straight away.

:::note[Local posture]
This stack is for local experimentation: a single tenant (`acme`), authentication
off, and no TLS. It is not a production deployment. See [Honest
limitations](/operating/limitations/).
:::

## What you need

Docker (with Compose) and a clone of the repository. The `Makefile` is a thin
wrapper over `docker compose`, so you do not need a Rust toolchain.

```sh
git clone https://github.com/andrealaforgia/kaleidoscope.git
cd kaleidoscope
```

## Bring it up

```sh
make up
```

This builds and starts one consolidated runtime container, waits until it is
healthy, and prints the URL. In a single process, sharing one data volume, it
serves:

- OTLP ingest — gRPC on `:4317`, HTTP/protobuf on `:4318`
- Query APIs — metrics on `:9090`, logs on `:9091`, traces on `:9092`
- Prism — served same-origin on `:9090` (no separate web server, no CORS)

Because ingest and query share the same process and the same stores, a metric you
send is immediately queryable — there is no restart step between writing and
reading.

```mermaid
flowchart LR
    C[your app / OTel SDK] -->|OTLP :4317 / :4318| R[consolidated runtime]
    R -->|metrics :9090| Prism[Prism + metrics query]
    R -->|logs :9091| LQ[logs query]
    R -->|traces :9092| TQ[traces query]
    R --- V[(shared data volume)]
```

## Send some telemetry

The simplest path is the bundled sample generator:

```sh
make demo    # push a sample of each signal now
make seed    # push it once (a no-op if already seeded)
```

Both push one of each signal for tenant `acme` — a `request_count` metric, a
`checkout failed: card declined` log, and a `GET /api/v1/query_range` span under
a fixed trace id — against the running stack. The generator runs a reachability
check first, so if the stack is not up it names the unreachable endpoint, exits
non-zero, and sends nothing rather than firing into the void.

To send your own instead, point any OpenTelemetry SDK or the Collector's OTLP
exporter at `localhost:4317` (gRPC) or `localhost:4318` (HTTP) and emit as usual.
The local stack is single-tenant with authentication off, so no bearer token is
needed; just make sure your telemetry uses the same tenant (`acme` by default)
so it is visible. The repository's `examples/otel-external-demo` is a small
Python app that uses only the official OpenTelemetry SDK — no Kaleidoscope
dependency — and is the clearest proof that any standard OTLP source works.

## See it

Open `http://localhost:9090` for Prism and query `request_count` to see the
sample metric plotted. Logs and traces come back as JSON from the query APIs —
see [Query your telemetry](/getting-started/querying/).

## Manage it

```sh
make logs    # follow the runtime logs
make down    # stop the stack, keep your data (the volume is preserved)
make clean   # stop the stack and wipe the data volume (fresh start)
```

## Keep it honest

To say it plainly: this is a local experiment posture — one tenant, no
authentication, no TLS. It is not a production deployment. For the authenticated,
multi-signal setup, see [Run the gateway end to end](/getting-started/gateway/),
and for the honest state of everything, [Is it ready for
you?](/start/status/).
