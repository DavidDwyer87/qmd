#!/bin/bash
set -e

echo "=== QMD Starting ==="

# Environment variables with defaults
QMD_DATA_DIR="${QMD_DATA_DIR:-/data/qmd}"
KNOWLEDGE_DIR="${KNOWLEDGE_DIR:-/data/knowledge}"
COLLECTION_NAME="${COLLECTION_NAME:-knowledge}"
QMD_PORT="${QMD_PORT:-8181}"
INIT_DONE_FLAG="${QMD_DATA_DIR}/.init_done"

# Create directories
mkdir -p "$QMD_DATA_DIR"
mkdir -p "$KNOWLEDGE_DIR"

# Configure QMD to use custom data directory
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-/data/models}"

echo "Data directory: $QMD_DATA_DIR"
echo "Knowledge directory: $KNOWLEDGE_DIR"
echo "Collection: $COLLECTION_NAME"

# First-run initialization (idempotent)
if [ ! -f "$INIT_DONE_FLAG" ]; then
    echo "=== First-run initialization ==="
    
    # Check if knowledge directory has files
    if [ -d "$KNOWLEDGE_DIR" ] && [ "$(ls -A $KNOWLEDGE_DIR)" ]; then
        echo "Creating collection '$COLLECTION_NAME' from $KNOWLEDGE_DIR..."
        
        # Create collection
        qmd collection add "$KNOWLEDGE_DIR" --name "$COLLECTION_NAME"
        
        # Add context (optional, helps search quality)
        echo "Adding context..."
        qmd context add qmd://"$COLLECTION_NAME" "Knowledge base documents" 2>/dev/null || true
        
        # Generate embeddings (this downloads models on first run)
        echo "Generating embeddings (first run downloads models - this may take a while)..."
        qmd embed
        
        echo "Initialization complete!"
    else
        echo "WARNING: Knowledge directory is empty. Skipping collection creation."
        echo "Add markdown files to $KNOWLEDGE_DIR and run: docker compose exec qmd qmd update && qmd embed"
    fi
    
    # Mark initialization as done
    touch "$INIT_DONE_FLAG"
else
    echo "=== Subsequent run - skipping init (data already exists) ==="
    
    # Optionally re-index if files changed
    if [ "$AUTO_UPDATE" = "true" ]; then
        echo "AUTO_UPDATE enabled - re-indexing..."
        qmd update
        qmd embed
    fi
fi

# Start nginx in background (reverse proxy)
echo "Starting nginx reverse proxy..."
nginx -c /etc/nginx/nginx.conf &

# Start QMD MCP HTTP server
echo "Starting QMD MCP server on port $QMD_PORT..."
exec qmd mcp --http --port "$QMD_PORT"
