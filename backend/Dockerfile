# ==============================================================================
# BACKEND DOCKERFILE — Rust/Axum API server
# Works unmodified on Fly.io, Railway, Render, Docker Compose, or any container
# platform that injects a PORT environment variable (default 8080).
# Build context must be the repo root: `docker build -f backend/Dockerfile .`
# ==============================================================================

# --- Build stage: compile the release binary ---------------------------------
FROM rust:1.85-slim AS builder
WORKDIR /app

# System deps: pkg-config + openssl headers for reqwest/sqlx.
RUN apt-get update \
 && apt-get install -y --no-install-recommends pkg-config libssl-dev \
 && rm -rf /var/lib/apt/lists/*

# Layer 1: cache dependency compilation by building an empty shell first.
COPY backend/Cargo.toml backend/Cargo.lock* ./
RUN mkdir src && echo "fn main(){}" > src/main.rs \
 && cargo build --release \
 && rm -rf src target/release/deps/auction_intel_backend*

# Layer 2: copy real sources and compile the actual binary.
COPY backend/src ./src
RUN cargo build --release \
 && strip /app/target/release/auction-intel-backend

# --- Runtime stage: minimal distro with just the binary ----------------------
FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/auction-intel-backend /usr/local/bin/

ENV PORT=8080 \
    RUST_LOG=auction_intel_backend=info,tower_http=info
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT}/api/health" || exit 1

CMD ["auction-intel-backend"]
