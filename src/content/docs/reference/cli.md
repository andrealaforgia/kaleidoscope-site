---
title: CLI reference
description: Every kaleidoscope-cli subcommand — ingest, read, stats, migrate, place, get-tier, list-items, evaluate-policy — with its arguments and flags.
---

`kaleidoscope-cli` is the operator-facing binary. It wires the durable log store
(Lumen v1), the tiering governor (Cinder v1) and self-observability into a single
tool. Every command operates on a tenant id and a data directory.

Build it with:

```sh
cargo build --release -p kaleidoscope-cli
# binary at ./target/release/kaleidoscope-cli
```

## Common shape

```
kaleidoscope-cli <subcommand> <tenant> <data-dir> [args] [flags]
```

A few subcommands deviate, noted below. Unknown flags are rejected with exit code
`2` and a usage message, before any I/O.

## Subcommands

### `ingest`

```
kaleidoscope-cli ingest <tenant> <data-dir> [--observe-otlp <path>]
```

Reads newline-delimited JSON log records from stdin into the durable store.
**All or nothing**: if any line fails to parse, nothing is committed and the
offending line number is reported, so a re-run after the fix ingests exactly
once.

### `read`

```
kaleidoscope-cli read <tenant> <data-dir> [--since <iso>] [--until <iso>] [--observe-otlp <path>]
```

Streams stored records back to stdout as NDJSON, ascending in time. `--since`
and `--until` take ISO 8601 UTC timestamps to scope the window.

### `stats`

```
kaleidoscope-cli stats <tenant> <data-dir> [--since <iso>] [--until <iso>]
```

Prints a summary instead of dumping records: `records=N`, `earliest=<iso>`,
`latest=<iso>`, and Cinder tier distribution (`hot=`, `warm=`, `cold=`, with
zero-count lines omitted). For a tenant with no records, prints `records=0`.

### `migrate`

```
kaleidoscope-cli migrate <tenant> <data-dir> <item-id> <tier> [--observe-otlp <path>]
```

Moves a Cinder item between tiers (`hot`, `warm`, `cold`) and reports the
transition: `migrated tenant=… item=… from=hot to=cold`.

### `place`

```
kaleidoscope-cli place <tenant> <data-dir> <item-id> <tier> [--observe-otlp <path>]
```

Directly places an item into a tier. Useful for rebuilding a tier catalogue from
a manifest:

```sh
cat manifest.txt | xargs -I X kaleidoscope-cli place acme ./data X hot --observe-otlp /tmp/audit.ndjson
```

### `get-tier`

```
kaleidoscope-cli get-tier <tenant> <data-dir> <item-id>
```

Reports the current tier of a single item in one call.

### `list-items`

```
kaleidoscope-cli list-items <tenant> <data-dir> <tier>
```

Lists the item ids in a tier, sorted alphabetically (deterministic and
diff-friendly). Pairs with `migrate` for bulk moves:

```sh
kaleidoscope-cli list-items acme ./data cold \
  | xargs -I X kaleidoscope-cli migrate acme ./data X warm
```

### `evaluate-policy`

```
kaleidoscope-cli evaluate-policy <data-dir> <hot-to-warm-secs> <warm-to-cold-secs> [--observe-otlp <path>]
```

Runs Cinder's age-based tiering policy across **all** tenants — note there is no
tenant argument, because the underlying API is cross-tenant by design. Each
internal migration emits a `cinder.migrate.count` line to the audit sink when
`--observe-otlp` is set, so per-tenant accounting is a `jq` filter away.

## The `--observe-otlp` flag

Available on `ingest`, `read`, `migrate`, `place` and `evaluate-policy`. Writes
one OTLP-JSON line per operation to the given file in append mode, so an
incident-response session leaves a complete forensic trail through the same OTLP
collector you already run. See [Self-observability](/operating/self-observability/).

## Coverage

The CLI covers the full tiering lifecycle — place an item, look up its tier, move
it, list a tier, and run the ageing policy — and the full log read path. It is a
working operator surface, not a thin wrapper.
