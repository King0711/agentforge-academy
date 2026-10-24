// Colour tokens for the admin analytics charts. Categorical slots 1-5 of the
// validated reference palette, in fixed order, with the dark steps chosen for the
// dark surface. Dark mode here is the app's own data-theme="dark" (ThemeContext).
export const VIZ_CSS = `
.viz-root {
  --surface-1: #fcfcfb; --text-primary: #0b0b0b; --text-secondary: #52514e; --text-muted: #6f6d67;
  --grid: #e1e0d9; --axis: #c3c2b7; --good-text: #006300; --bad-text: #b3261e;
  --series-1: #2a78d6; --series-2: #eb6834; --series-3: #1baf7a; --series-4: #eda100; --series-5: #e87ba4; --series-other: #898781;
}
:root[data-theme="dark"] .viz-root {
  --surface-1: #1a1a19; --text-primary: #f0efec; --text-secondary: #c3c2b7; --text-muted: #a3a29b;
  --grid: #2c2c2a; --axis: #383835; --good-text: #0ca30c; --bad-text: #ff8a80;
  --series-1: #3987e5; --series-2: #d95926; --series-3: #199e70; --series-4: #c98500; --series-5: #d55181; --series-other: #898781;
}
`;

export const compactNumber = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${+(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${+(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}K`;
  return String(Math.round(n));
};
