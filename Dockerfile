FROM rust:1-bookworm AS builder

WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/

# Build release binaries
RUN cargo build --release -p etalon-cli -p etalon-mcp-server

# ── Stage 2: Runtime ───────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binaries
COPY --from=builder /build/target/release/etalon-cli /usr/local/bin/etalon
COPY --from=builder /build/target/release/etalon-mcp-server /usr/local/bin/etalon-mcp-server

# Copy vendor registry and templates
COPY data/ /usr/share/etalon/data/
COPY templates/ /usr/share/etalon/templates/

ENV ETALON_DATA_DIR=/usr/share/etalon/data
ENV ETALON_TEMPLATE_DIR=/usr/share/etalon/templates

ENTRYPOINT ["etalon"]
CMD ["--help"]
