#!/bin/bash

# Nano Banana Image Generator
# Usage: ./generate.sh "prompt" "filename"

PROMPT="$1"
FILENAME="$2"
MODEL="gemini-3-pro-image-preview"

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ Error: GEMINI_API_KEY environment variable is not set"
  echo "Get your API key from: https://aistudio.google.com/apikey"
  echo "Then run: export GEMINI_API_KEY=\"your-key-here\""
  exit 1
fi

if [ -z "$PROMPT" ] || [ -z "$FILENAME" ]; then
  echo "Usage: ./generate.sh \"<prompt>\" \"<filename>\""
  echo "Example: ./generate.sh \"A cozy bookshelf\" \"bookshelf\""
  exit 1
fi

echo "🎨 Generating image with Nano Banana..."
echo "   Prompt: $PROMPT"
echo "   Model: $MODEL"

# Create output directory
OUTPUT_DIR="$(pwd)/public/images/generated"
mkdir -p "$OUTPUT_DIR"

# Make API request
RESPONSE=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{
    \"contents\": [{
      \"parts\": [{\"text\": \"$PROMPT\"}]
    }],
    \"generationConfig\": {
      \"responseModalities\": [\"TEXT\", \"IMAGE\"]
    }
  }")

# Check for errors
ERROR=$(echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$ERROR" ]; then
  echo "❌ API Error: $ERROR"
  exit 1
fi

# Extract base64 image data
IMAGE_DATA=$(echo "$RESPONSE" | grep -o '"data":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$IMAGE_DATA" ]; then
  echo "❌ No image generated. Response:"
  echo "$RESPONSE" | head -c 500
  exit 1
fi

# Save image
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}.png"
echo "$IMAGE_DATA" | base64 -d > "$OUTPUT_PATH"

echo "✅ Image saved to: $OUTPUT_PATH"
echo "   Public URL: /images/generated/${FILENAME}.png"
