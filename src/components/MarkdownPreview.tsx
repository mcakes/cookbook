import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
}

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div
      className="prose prose-stone max-w-none
        prose-headings:font-display prose-headings:text-ink prose-headings:font-medium
        prose-p:text-ink prose-p:leading-relaxed
        prose-a:text-accent hover:prose-a:text-accent-hover
        prose-strong:text-ink
        prose-code:bg-tag prose-code:text-tag-ink prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-li:text-ink"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
