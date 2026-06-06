---
title: Run with Docker
description: Run the Kaleidoscope CLI with no local Rust toolchain using the multi-stage Docker image.
---

If you would rather not install a Rust toolchain, the CLI ships as a Docker
image. The build is multi-stage: `rust:1.88-slim-bookworm` compiles the binary
in release mode, and `debian:bookworm-slim` carries only the compiled binary —
no toolchain, no source.

## Build the image

```sh
git clone https://github.com/andrealaforgia/kaleidoscope.git
cd kaleidoscope
docker build -t kaleidoscope-cli .
```

## Ingest and read through the container

Mount a host directory so the durable store persists outside the container:

```sh
mkdir -p ./data

echo '{"observed_time_unix_nano":100,"severity_number":9,"severity_text":"INFO","body":"hello","attributes":{},"resource_attributes":{"service.name":"checkout"},"trace_id":null,"span_id":null}' \
  | docker run --rm -i -v "$(pwd)/data:/data" kaleidoscope-cli ingest acme /data

docker run --rm -v "$(pwd)/data:/data" kaleidoscope-cli read acme /data
```

Because `./data` is a host volume, the data survives the container being removed.
That is the same durability guarantee the [quick start](/getting-started/quick-start/)
relies on.

## Other binaries

The repository also carries `Dockerfile.gateway` and `Dockerfile.query-api` for
the OTLP gateway and the read API respectively. Those wire the network-facing
side of the platform; see [Run the gateway end to end](/getting-started/gateway/)
for what they do and how they fit together.
