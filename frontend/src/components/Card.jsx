function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default Card;
