const Loading = ({ text = "Memproses..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={text}>
      <svg className="h-8 w-8 animate-spin text-[var(--brand-gold)]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
};

export default Loading;
