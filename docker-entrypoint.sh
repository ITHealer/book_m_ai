#!/bin/sh
chown -R healer:healer /app/data
chmod 755 /app/data
bun --bun run run-migrations && bun ./build/index.js
