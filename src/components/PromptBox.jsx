import { useState } from 'react';
import { Copy, Check, MessageSquareText } from 'lucide-react';

export default function PromptBox({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="rounded-lg border border-[#0067B8]/30 bg-[#0067B8]/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#0067B8]/20 bg-[#0067B8]/10">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#3FA9F5]">
          <MessageSquareText className="w-3.5 h-3.5" />
          Prompt to use
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-[#3FA9F5] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="px-3.5 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
