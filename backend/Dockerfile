# ==============================================================================
# BACKEND DOCKERFILE - Rust/Axum API Server for Railway Deployment
# ==============================================================================

# Build stage - compile Rust backend
FROM rust:1.75-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy backend source
COPY backend/Cargo.toml backend/Cargo.lock* ./
COPY backend/src ./src

# Build release binary
RUN cargo build --release

# Production stage - minimal runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the compiled binary
COPY --from=builder /app/target/release/auction-intel-backend /usr/local/bin/

# Railway provides PORT env var
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Run the backend
CMD ["auction-intel-backend"]
