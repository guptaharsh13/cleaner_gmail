// src/utils/emailExtractor.ts

export interface EmailPart {
  mimeType: string;
  body?: { data?: string };
  parts?: EmailPart[];
}

export interface ExtractedContent {
  textContent: string;
  htmlContent: string;
}

export function extractEmailContent(payload: EmailPart): ExtractedContent {
  let textContent = "";
  let htmlContent = "";

  function extractContent(part: EmailPart) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      textContent +=
        Buffer.from(part.body.data, "base64").toString("utf-8") + "\n";
    } else if (part.mimeType === "text/html" && part.body?.data) {
      htmlContent += Buffer.from(part.body.data, "base64").toString("utf-8");
    } else if (part.parts) {
      part.parts.forEach(extractContent);
    }
  }

  extractContent(payload);

  console.log("Extracted content:", { textContent, htmlContent });

  if (!textContent && !htmlContent) {
    console.warn("No content extracted from email:", payload);
  }

  return { textContent: textContent.trim(), htmlContent: htmlContent.trim() };
}
