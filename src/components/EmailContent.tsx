import React from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Email } from "../types";

interface EmailContentProps {
  email: Email | undefined;
}

const EmailContent: React.FC<EmailContentProps> = ({ email }) => {
  if (!email) {
    return (
      <div className="w-2/3 p-4 bg-white text-gray-800 flex items-center justify-center">
        <p className="text-lg font-semibold">
          Select an email to view its content
        </p>
      </div>
    );
  }

  const renderEmailContent = async () => {
    if (!email.body || email.body.trim() === "") {
      return <p className="text-gray-500 italic">This email has no content.</p>;
    }

    if (email.mimeType === "text/html") {
      // If it's HTML, sanitize it and render
      return (
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
        />
      );
    } else {
      // If it's plain text or markdown, render it as HTML
      const htmlContent = await marked(email.body);
      return (
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
        />
      );
    }
  };

  return (
    <div className="w-2/3 h-full overflow-y-auto p-6 bg-white text-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-blue-600">{email.subject}</h2>
      <div className="email-content">{renderEmailContent()}</div>
    </div>
  );
};

export default EmailContent;
