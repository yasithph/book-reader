#!/usr/bin/env npx ts-node

/**
 * Nano Banana Image Generation Script
 *
 * Usage: npx ts-node generate.ts "prompt" "filename"
 *
 * Generates an image using Google's Gemini Image API (Nano Banana)
 * and saves it to the public/images folder.
 */

import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3-pro-image-preview'; // Nano Banana Pro - best quality
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
  error?: {
    message: string;
    code: number;
  };
}

async function generateImage(prompt: string, filename: string): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set.\n' +
      'Get your API key from: https://aistudio.google.com/apikey\n' +
      'Then run: export GEMINI_API_KEY="your-key-here"'
    );
  }

  console.log(`\n🎨 Generating image with Nano Banana...`);
  console.log(`   Prompt: "${prompt}"`);
  console.log(`   Model: ${MODEL}\n`);

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"]
    }
  };

  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed (${response.status}): ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    throw new Error(`API error: ${data.error.message}`);
  }

  // Find the image part in the response
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error('No content in response');
  }

  const imagePart = parts.find(part => part.inlineData);
  if (!imagePart?.inlineData) {
    // Log any text response for debugging
    const textPart = parts.find(part => part.text);
    if (textPart?.text) {
      console.log('Response text:', textPart.text);
    }
    throw new Error('No image generated in response. The model may have declined to generate this image.');
  }

  // Decode base64 image
  const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');

  // Determine file extension from mime type
  const mimeType = imagePart.inlineData.mimeType;
  const extension = mimeType.split('/')[1] || 'png';

  // Ensure filename doesn't have extension, we'll add it
  const cleanFilename = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const outputFilename = `${cleanFilename}.${extension}`;

  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'public', 'images', 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save the image
  const outputPath = path.join(outputDir, outputFilename);
  fs.writeFileSync(outputPath, imageBuffer);

  const relativePath = `/images/generated/${outputFilename}`;

  console.log(`✅ Image saved successfully!`);
  console.log(`   Path: ${outputPath}`);
  console.log(`   Public URL: ${relativePath}`);
  console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(1)} KB\n`);

  return relativePath;
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Nano Banana Image Generator
============================

Usage: npx ts-node generate.ts "<prompt>" "<filename>"

Arguments:
  prompt    - Description of the image to generate
  filename  - Output filename (without extension)

Example:
  npx ts-node generate.ts "A cozy reading corner with warm lighting" "reading-corner"

Environment:
  GEMINI_API_KEY - Your Google AI Studio API key (required)
                   Get one at: https://aistudio.google.com/apikey
`);
  process.exit(1);
}

const [prompt, filename] = args;

generateImage(prompt, filename)
  .then((path) => {
    console.log(`Image available at: ${path}`);
  })
  .catch((error) => {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  });
