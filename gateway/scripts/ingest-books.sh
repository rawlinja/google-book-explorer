#!/bin/zsh
BOOKS_FILE="books.json"
API_URL="http://localhost:3000/api/rag/ingest/book"

jq -c '.[]' "$BOOKS_FILE" | while read -r book; do
  echo "Sending book: $(echo $book | jq -r .title)"
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$book"
  echo "\n---"
done
