import { useState } from 'react';
import { Loader2, Tag, CheckCircle2, X } from 'lucide-react';
import { invokeWithRetry } from '../lib/invokeFunction';

const inputClass =
  'flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-white dark:bg-[#0F1A2A] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand/40';

// "Have a discount code?" on a price card. `applied` is { code, price } once the
// server has confirmed the code, else null. Checking here is only so the buyer
// sees the new price — create-paystack-checkout checks the code again and is
// what actually decides the charge.
export default function CouponField({ plan, applied, onApplied }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const apply = async (e) => {
    e.preventDefault();
    if (!value.trim() || checking) return;
    setChecking(true);
    setError('');
    const { data, error: fnError } = await invokeWithRetry('create-paystack-checkout', {
      body: { action: 'validate_coupon', plan, coupon: value },
    });
    setChecking(false);
    if (fnError || !data) {
      setError(fnError?.message || 'We could not check that code. Please try again.');
      return;
    }
    if (!data.valid) {
      setError(data.error || "That code isn't valid.");
      return;
    }
    onApplied({ code: data.code, price: data.price });
    setValue('');
  };

  const remove = () => {
    onApplied(null);
    setError('');
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-green/30 bg-[#EAFAF1] dark:bg-green/10 px-3.5 py-2.5 mb-4">
        <p className="flex items-center gap-2 text-[13px] font-bold text-green min-w-0">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Code <span className="font-mono">{applied.code}</span> applied</span>
        </p>
        <button
          type="button"
          onClick={remove}
          className="text-body hover:text-ink flex-shrink-0"
          aria-label="Remove discount code"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[13px] font-bold text-link hover:underline mb-4"
      >
        <Tag className="w-3.5 h-3.5" /> Have a discount code?
      </button>
    );
  }

  return (
    <form onSubmit={apply} className="mb-4" noValidate>
      <label htmlFor="coupon-code" className="block text-xs font-semibold text-body-strong mb-1">Discount code</label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter your code"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink text-white dark:bg-white dark:text-ink text-sm font-bold disabled:opacity-50"
        >
          {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Apply
        </button>
      </div>
      {error && <p role="alert" className="text-[12.5px] text-rose mt-1.5">{error}</p>}
    </form>
  );
}
