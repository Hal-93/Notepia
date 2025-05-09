import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export default function NoteSection() {
  const [readmeContent, setReadmeContent] = useState<string>("");

  useEffect(() => {
    fetch("/README.md")
      .then((res) => res.text())
      .then(setReadmeContent)
      .catch((err) => console.error("リリースノートの取得に失敗しました", err));
  }, []);

  return (
    <div className="h-full w-full p-4 flex flex-col text-gray-200">
      <h2 className="text-2xl font-bold mb-4">リリースノート</h2>
      {/* Markdown scroll area */}
      <div className="flex-1 overflow-auto no-scrollbar">
        {readmeContent ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h1: ({ node, ...props }) => <h1 {...props} className="text-3xl font-bold mb-4" />,
              h2: ({ node, ...props }) => <h2 {...props} className="text-2xl font-semibold mb-3" />,
              p: ({ node, ...props }) => <p {...props} className="mb-4 whitespace-pre-wrap" />,
              ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside ml-4 mb-4" />,
              ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside ml-4 mb-4" />,
              a: ({ node, ...props }) => <a {...props} className="text-blue-400 hover:underline" />,
            }}
          >
            {readmeContent}
          </ReactMarkdown>
        ) : (
          <p>読み込み中...</p>
        )}
      </div>
      {/* Fixed GitHub button */}
      <div className="mt-4 flex-shrink-0">
        <Button
          onClick={() => window.open("https://github.com/Hal-93/Notepia", "_blank")}
        >
          <FontAwesomeIcon icon={faGithub} className="mr-2" />
          GitHub リポジトリ
        </Button>
      </div>
    </div>
  );
}
