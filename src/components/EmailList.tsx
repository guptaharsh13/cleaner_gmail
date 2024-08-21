import React, { useEffect } from "react";
import { Email } from "../types";

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string) => void;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  setSelectedEmailId,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (emails.length === 0) return;

      const currentIndex = emails.findIndex(
        (email) => email.id === selectedEmailId
      );
      let newIndex = currentIndex;

      switch (event.key) {
        case "ArrowUp":
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case "ArrowDown":
          newIndex = Math.min(emails.length - 1, currentIndex + 1);
          break;
      }

      if (newIndex !== currentIndex) {
        setSelectedEmailId(emails[newIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emails, selectedEmailId, setSelectedEmailId]);

  return (
    <div className="w-1/3 h-full overflow-y-auto border-r border-gray-200 bg-gray-50">
      {emails.map((email) => (
        <div
          key={email.id}
          className={`p-4 cursor-pointer border-b border-gray-200 transition-colors duration-150 ease-in-out ${
            email.id === selectedEmailId ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
          onClick={() => setSelectedEmailId(email.id)}
        >
          <h3 className="font-semibold text-gray-800 truncate">
            {email.subject}
          </h3>
          <p className="text-sm text-gray-500 mt-1 truncate">
            {email.body.replace(/<[^>]*>/g, "").slice(0, 100)}...
          </p>
        </div>
      ))}
    </div>
  );
};

export default EmailList;
