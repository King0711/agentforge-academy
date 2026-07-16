import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlock({ code, language = 'python', title }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[#0D1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {title || language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed scrollbar-thin">
        <code className="text-slate-200">{code}</code>
      </pre>
    </div>
  );
}
