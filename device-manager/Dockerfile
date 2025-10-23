# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies into a separate layer for caching
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies only
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from install stage and copy source code
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Optional: Run type checking
# RUN bun run type-check

# Final production stage
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app .

# Expose ports
EXPOSE 3001 1883

# Set environment to production
ENV NODE_ENV=production

# Run the app
USER bun
ENTRYPOINT [ "bun", "run", "index.ts" ]
