import { Lightbulb, CheckCircle2 } from 'lucide-react';
import CodeBlock from './CodeBlock';

export default function StepGuide({ steps }) {
  return (
    <div className="space-y-6">
      {steps.map((step) => (
        <div key={step.number} className="relative pl-12">
          <div className="absolute left-0 top-0 w-8 h-8 rounded-lg bg-[#0067B8]/20 border border-[#0067B8]/40 text-[#0067B8] font-bold flex items-center justify-center text-sm">
            {step.number}
          </div>
          <h4 className="font-bold text-white text-base mb-1">{step.title}</h4>
          <p className="text-sm text-slate-400 mb-3">{step.description}</p>
          {step.code && <CodeBlock code={step.code} />}
          {step.tip && (
            <div className="mt-3 flex gap-2 items-start text-sm text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{step.tip}</span>
            </div>
          )}
          {step.verify && (
            <div className="mt-2 flex gap-2 items-start text-sm text-emerald-300/90 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><span className="font-bold">Check your work: </span>{step.verify}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
