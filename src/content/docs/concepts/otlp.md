---
title: OpenTelemetry everywhere
description: How Kaleidoscope uses OTLP and the OpenTelemetry semantic conventions as the contract at every seam, internal and external.
---

OpenTelemetry is not just how you get data *into* Kaleidoscope. It is the
contract at **every** seam — between your applications and the platform, and
between the platform's own components. This is what keeps Kaleidoscope from
becoming a closed world you cannot escape.

## What "OpenTelemetry everywhere" means concretely

**Ingest is OTLP.** Applications emit telemetry through the OpenTelemetry SDKs.
Aperture receives it as OTLP over gRPC (`:4317`) and HTTP/protobuf (`:4318`).

**Attributes follow the semantic conventions.** Resource and instrumentation
attributes use the OpenTelemetry Semantic Conventions, plus a small set of
Kaleidoscope house attributes (`tenant.id`, `feature_flag.{key}`,
`experiment.id`). Codex validates them at integration time and suggests
corrections for typos.

**Profiles use pprof.** The profiles signal uses the pprof format and the
emerging OpenTelemetry Profiles signal, not a bespoke shape.

**Internal contracts are OTLP too.** The wire format between Kaleidoscope's own
components is OpenTelemetry-defined. The storage stores hold OTLP-shaped types at
their boundary rather than projecting into private representations.

**You can forward downstream.** Kaleidoscope can emit OTLP back out, so it
integrates with any other OTel-compatible backend rather than trapping your
data.

## Why this matters for adoption

Because every seam speaks OTLP, you are never locked in. You can:

- Put the integration plane in front of a backend you already run, because that
  backend already speaks OTLP or Prometheus.
- Replace one Kaleidoscope component with your own, or with a peer project, as
  long as it honours the same wire contract.
- Leave, if you decide to, by forwarding your telemetry to another OTel backend.

The read side reinforces this. The metrics endpoint speaks the Prometheus query
protocol, so existing Prometheus clients — including Prism itself — work against
it without translation. The contract was not Kaleidoscope's to invent, and it
did not try to.

## Conformance is tested, not assumed

The very first thing Kaleidoscope built was an **OTLP conformance harness**: a
small library whose single job is to validate that a byte sequence is a valid
OpenTelemetry message. Every other component consumes it. The gateway runs every
incoming payload through it before storing anything.

One honest caveat, recorded in the project's own honesty pass: the harness
checks that the bytes *decode* correctly as OTLP; it is not a full
specification-conformance test suite. The documentation says exactly that rather
than implying more.
