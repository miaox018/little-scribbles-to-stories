
import ReactMarkdown from 'react-markdown';
import { BlogPost } from '@/lib/blog';

interface BlogContentProps {
  post: BlogPost;
}

export function BlogContent({ post }: BlogContentProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold text-gray-800 mb-6 leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-200 pl-4 italic text-gray-600 my-6">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
        }}
      >
        {post.content}
      </ReactMarkdown>
    </div>
  );
}
