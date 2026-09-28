import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

// Styled elements; raw HTML in the source is not rendered (react-markdown's default)
const components: Components = {
  h1: ({ node: _node, ...props }) => <h2 className="mt-6 mb-3 text-xl first:mt-0" {...props} />,
  h2: ({ node: _node, ...props }) => <h3 className="mt-6 mb-2 text-lg first:mt-0" {...props} />,
  h3: ({ node: _node, ...props }) => <h4 className="mt-5 mb-2 text-md first:mt-0" {...props} />,
  h4: ({ node: _node, ...props }) => <h5 className="mt-4 mb-2 font-display text-sm font-semibold first:mt-0" {...props} />,
  p: ({ node: _node, ...props }) => <p className="my-3 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="my-3 list-disc space-y-1 pl-5 marker:text-muted" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="my-3 list-decimal space-y-1 pl-5 marker:text-muted" {...props} />,
  li: ({ node: _node, ...props }) => <li className="leading-relaxed" {...props} />,
  a: ({ node: _node, ...props }) => (
    <a className="text-accent-blue underline-offset-2 hover:underline" target="_blank" rel="noreferrer noopener" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote className="my-3 border-l-2 border-accent-purple/60 pl-3 text-muted" {...props} />
  ),
  hr: () => <hr className="my-5 border-border" />,
  code: ({ node: _node, className, ...props }) => (
    <code className={cn('rounded-[4px] bg-raised px-1 py-0.5 font-mono text-[0.9em]', className)} {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre className="my-3 overflow-x-auto rounded-control border border-border bg-base p-3 text-sm [&_code]:bg-transparent [&_code]:p-0" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }) => <th className="border-b border-border px-2 py-1.5 font-medium text-muted" {...props} />,
  td: ({ node: _node, ...props }) => <td className="border-b border-border px-2 py-1.5" {...props} />,
  input: ({ node: _node, ...props }) => <input className="mr-1.5 accent-accent-teal" {...props} />,
};

/** Rendered markdown (GitHub-flavoured: tables, task lists, strikethrough). */
export function MarkdownView({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('text-sm break-words text-primary', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
}
