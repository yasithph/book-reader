import { NextRequest, NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to check admin
async function checkAdmin() {
  const session = await getSession();
  if (!session) return { error: "Unauthorized", status: 401 };

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Forbidden", status: 403 };

  return { user };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured" },
        { status: 500 }
      );
    }

    // Get the PDF file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    // Validate file size (max 20MB for PDF)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 20MB" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Initialize Gemini with higher output limit
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 65536, // Maximum output for longer documents
      },
    });

    // Create the extraction prompt
    const extractionPrompt = `You are a document parser specialized in extracting chapters from Sinhala novels.

IMPORTANT: This document may have MANY chapters (50-100+). You MUST extract ALL chapters from the entire document, not just the first few.

Analyze this PDF document and extract EVERY chapter with its content. The document is a Sinhala novel.

CHAPTER FORMAT IN THIS DOCUMENT:
- Chapters are marked by a STANDALONE NUMBER at the top of the page (e.g., "12" by itself)
- There are NO chapter titles - just the number followed by content
- The chapter number appears alone, then the chapter content begins

For each chapter, extract:
1. Chapter number - the standalone number at the start of each chapter
2. title_si - leave empty string "" since there are no titles
3. title_en - leave empty string "" since there are no titles
4. The full chapter content as plain text with paragraph breaks

Rules for extraction:
- Extract ALL chapters from the ENTIRE document - do not stop early
- A new chapter starts when you see a standalone number (1, 2, 3... 70, etc.)
- Do NOT confuse page numbers with chapter numbers - chapter numbers appear prominently at the start of a new section
- Preserve all Sinhala text exactly as it appears
- Format content as plain paragraphs separated by double newlines
- Do NOT include the chapter number in the content
- Do NOT include page headers, footers, or image references

Respond with a JSON array of chapters in this exact format:
{
  "chapters": [
    {
      "number": 1,
      "title_si": "",
      "title_en": "",
      "content": "First paragraph of chapter content.\\n\\nSecond paragraph continues here..."
    }
  ]
}

CRITICAL: Extract ALL chapters (likely 50-70+). Do not stop early. Only respond with valid JSON, no other text.`;

    // Send to Gemini with the PDF
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64Data,
        },
      },
      { text: extractionPrompt },
    ]);

    const response = result.response;
    const text = response.text();

    console.log("Gemini response length:", text.length);
    console.log("Gemini response preview:", text.substring(0, 500));

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      // Handle markdown code blocks like ```json ... ```
      let jsonStr = text;

      // Remove markdown code block if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Try to find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in response. Full response:", text.substring(0, 2000));
        throw new Error("No JSON found in response");
      }

      jsonStr = jsonMatch[0];

      // Fix common JSON issues
      // Sometimes the response gets cut off - try to fix incomplete JSON
      if (!jsonStr.endsWith("}")) {
        // Try to find the last complete chapter and close the JSON
        const lastCompleteChapter = jsonStr.lastIndexOf('},');
        if (lastCompleteChapter > 0) {
          jsonStr = jsonStr.substring(0, lastCompleteChapter + 1) + ']}';
          console.log("Fixed truncated JSON");
        }
      }

      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Response text (first 3000 chars):", text.substring(0, 3000));
      console.error("Response text (last 1000 chars):", text.substring(text.length - 1000));
      return NextResponse.json(
        { error: "Failed to parse extraction results. The response may have been too long. Please try again." },
        { status: 500 }
      );
    }

    // Validate the response structure
    if (!parsedResponse.chapters || !Array.isArray(parsedResponse.chapters)) {
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 }
      );
    }

    // Convert plain text content to HTML paragraphs
    function textToHtml(text: string): string {
      if (!text) return "";
      // If already has HTML tags, return as-is
      if (/<p>|<div>|<br>/i.test(text)) return text;
      // Split by double newlines and wrap in <p> tags
      return text
        .split(/\n\n+/)
        .map((para) => para.trim())
        .filter((para) => para.length > 0)
        .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
    }

    // Sanitize and validate each chapter
    const chapters = parsedResponse.chapters.map((ch: { number?: number; title_si?: string; title_en?: string; content?: string }, index: number) => ({
      number: ch.number || index + 1,
      title_si: ch.title_si || "",
      title_en: ch.title_en || `Chapter ${ch.number || index + 1}`,
      content: textToHtml(ch.content || ""),
    }));

    return NextResponse.json({ chapters });
  } catch (error) {
    console.error("Error in PDF import:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract chapters" },
      { status: 500 }
    );
  }
}
