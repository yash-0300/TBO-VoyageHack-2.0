import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Add custom styling for other markdown elements
          h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold text-white mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold text-white mb-2">{children}</h3>,
          p: ({ children }) => <p className="text-gray-300 mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4">{children}</ol>,
          li: ({ children }) => <li className="mb-2">{children}</li>,
          a: ({ href, children }) => (
            <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};