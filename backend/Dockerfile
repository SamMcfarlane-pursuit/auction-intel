# ==============================================================================
# BACKEND DOCKERFILE - Rust/Axum API Server for Render.com Deployment
# ==============================================================================

# Build stage - compile Rust backend
FROM rust:1.75-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy backend source (context is repo root, dockerfile is in backend/)
COPY backend/Cargo.toml backend/Cargo.lock* ./
COPY backend/src ./src

# Build release binary
RUN cargo build --release

# Production stage - minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies (curl for healthcheck)
RUN apt-get update && \
    apt-get install -y ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Copy the compiled binary
COPY --from=builder /app/target/release/auction-intel-backend /usr/local/bin/

# Render uses PORT env var (default 10000)
ENV PORT=10000
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Run the backend
CMD ["auction-intel-backend"]
