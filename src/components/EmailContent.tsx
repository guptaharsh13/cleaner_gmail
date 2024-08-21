"use client";

import React from "react";
import DOMPurify from "dompurify";

interface Email {
  id: string;
  subject: string;
  body: string;
}

interface EmailContentProps {
  email: Email | undefined;
  onMarkAsRead: (id: string) => void;
  onUnsubscribe: (id: string) => void;
}

const EmailContent: React.FC<EmailContentProps> = ({
  email,
  onMarkAsRead,
  onUnsubscribe,
}) => {
  if (!email) {
    return (
      <div className="w-2/3 h-full flex items-center justify-center bg-white text-gray-500">
        <p className="text-lg font-semibold">
          Select an email to view its content
        </p>
      </div>
    );
  }

  const renderEmailContent = () => {
    if (!email.body || email.body.trim() === "") {
      return <p className="text-gray-500 italic">This email has no content.</p>;
    }

    // Check if the content is HTML
    if (email.body.trim().startsWith("<")) {
      // If it's HTML, sanitize it and render
      return (
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
        />
      );
    } else {
      // If it's plain text, convert line breaks to <br> tags and render
      const htmlContent = email.body.replace(/\n/g, "<br>");
      return (
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
        />
      );
    }
  };

  return (
    <div className="w-2/3 h-full overflow-y-auto bg-white text-gray-800">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {email.subject}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onMarkAsRead(email.id)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            Mark as Read (R)
          </button>
          <button
            onClick={() => onUnsubscribe(email.id)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Unsubscribe (U)
          </button>
        </div>
      </div>
      <div className="p-6">{renderEmailContent()}</div>
    </div>
  );
};

export default EmailContent;
