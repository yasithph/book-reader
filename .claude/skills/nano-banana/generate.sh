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

# Parse response and save image using Python
OUTPUT_PATH="${OUTPUT_DIR}/${FILENAME}.png"

echo "$RESPONSE" | python3 -c "
import sys, json, base64
try:
    d = json.load(sys.stdin)
    if 'error' in d:
        print(f\"❌ API Error: {d['error'].get('message', 'Unknown error')}\")
        sys.exit(1)
    for part in d.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        if 'inlineData' in part:
            img_data = part['inlineData']['data']
            with open('$OUTPUT_PATH', 'wb') as f:
                f.write(base64.b64decode(img_data))
            print('✅ Image saved to: $OUTPUT_PATH')
            print('   Public URL: /images/generated/${FILENAME}.png')
            sys.exit(0)
    print('❌ No image generated in response')
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f'❌ Failed to parse response: {e}')
    sys.exit(1)
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
"
