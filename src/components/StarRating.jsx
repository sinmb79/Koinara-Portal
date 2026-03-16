export default function StarRating({ value = 0, count }) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const position = index + 1
    if (value >= position) return "star"
    if (value >= position - 0.5) return "star_half"
    return "star_outline"
  })

  return (
    <div className="flex items-center gap-1 text-xs text-amber-400">
      <div className="flex items-center gap-0.5">
        {stars.map((icon, index) => (
          <span key={`${icon}-${index}`} className="material-symbols-outlined text-sm leading-none">
            {icon}
          </span>
        ))}
      </div>
      <span className="font-semibold text-slate-100">{value.toFixed(1)}</span>
      {count != null ? <span className="text-slate-500">({count})</span> : null}
    </div>
  )
}
