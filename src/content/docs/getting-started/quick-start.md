---
title: Quick start (CLI)
description: Build the Kaleidoscope CLI, ingest an OTLP log record into a durable store, and read it back — in about five minutes.
---

The fastest way to see Kaleidoscope do something real is the CLI. It wires the
durable log store (`Lumen v1`), the tiering governor (`Cinder v1`) and
self-observability into a small operator-facing binary. Data ingested through it
survives a process restart.

## Prerequisites

You need a Rust toolchain. The repository pins it via `rust-toolchain.toml`, so
a recent stable `rustup` install is enough. If you would rather not install Rust
at all, use the [Docker path](/getting-started/docker/) instead.

```sh
git clone https://github.com/andrealaforgia/kaleidoscope.git
cd kaleidoscope
```

## Build the CLI

```sh
cargo build --release -p kaleidoscope-cli
```

The binary lands at `./target/release/kaleidoscope-cli`.

## Ingest a log record

Kaleidoscope's CLI reads newline-delimited JSON (`NDJSON`) `LogRecord` lines
from stdin and writes them into a durable, tenant-scoped store. Each invocation
takes a tenant id and a data directory.

```sh
echo '{"observed_time_unix_nano":100,"severity_number":9,"severity_text":"INFO","body":"hello","attributes":{},"resource_attributes":{"service.name":"checkout"},"trace_id":null,"span_id":null}' \
  | ./target/release/kaleidoscope-cli ingest acme ./data
```

Here `acme` is the tenant id and `./data` is where the durable store lives.

:::note[Ingest is all-or-nothing]
If any line in the input fails to parse, the CLI commits **nothing** and reports
the offending line number. A failed run leaves the store untouched, so a re-run
after the fix ingests exactly once. An acknowledgement that lied about what it
wrote would be worse than useless during recovery.
:::

## Read it back

```sh
./target/release/kaleidoscope-cli read acme ./data
```

The record you ingested comes back. Stop the process, start it again, read once
more — it is still there. That is the durable store doing its job.

## Inspect without dumping everything

You do not always want to stream gigabytes of NDJSON just to learn how much is
there. The `stats` subcommand summarises a tenant's store, including Cinder tier
distribution:

```sh
./target/release/kaleidoscope-cli stats acme ./data
# records=N
# earliest=<ISO 8601>
# latest=<ISO 8601>
# hot=H  warm=W  cold=C   (zero-count lines omitted)
```

## Narrow by time

`read` and `stats` both accept `--since` and `--until` with ISO 8601 UTC
timestamps, so you can scope to the window you care about:

```sh
./target/release/kaleidoscope-cli read acme ./data \
  --since 2026-06-01T00:00:00Z --until 2026-06-02T00:00:00Z
```

## Leave an audit trail

Any state-changing or read command accepts `--observe-otlp <path>`, which emits
one OTLP-JSON line per operation to a file. Point a sidecar at that file and you
have a forensic record of an incident-response session through the same OTLP
collector you already run.

```sh
./target/release/kaleidoscope-cli ingest acme ./data --observe-otlp /tmp/audit.ndjson
```

## Where next

You have the read and inspect side of the platform. To send real OTLP from an
application over the network and persist it, set up the
[gateway end to end](/getting-started/gateway/). For the full command surface,
see the [CLI reference](/reference/cli/).
