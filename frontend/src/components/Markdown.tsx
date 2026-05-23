import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================
// Markdown – renders a markdown string safely (no raw HTML, so
// message content can't inject markup). Styling lives in the
// `.markdown-body` CSS rules in index.css.
// ============================================================

interface MarkdownProps {
  children: string;
}

function Markdown({ children }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links always open safely in a new tab
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
