"use client";

import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "s", "h2", "h3", "blockquote", "ul", "ol", "li", "hr", "img"];
const ALLOWED_ATTR = ["style", "src", "alt", "width", "height", "class"];

interface DynamicIntroContentProps {
  content: string;
  textColor: string;
  secondaryColor: string;
}

export function DynamicIntroContent({
  content,
  textColor,
  secondaryColor,
}: DynamicIntroContentProps) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });

  return (
    <div
      className="dynamic-intro-content sinhala"
      style={{
        color: textColor,
        maxWidth: "560px",
        width: "100%",
        textAlign: "center",
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: sanitized }}
        style={{
          fontSize: "15px",
          lineHeight: 1.8,
          color: secondaryColor,
        }}
      />
    </div>
  );
}
