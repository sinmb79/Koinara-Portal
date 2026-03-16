import { useEffect, useState } from "react"
import clsx from "clsx"

export default function SearchBar({
  placeholder,
  defaultValue = "",
  onQueryChange,
  className,
  compact = false,
}) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!onQueryChange) return undefined
    const timeout = window.setTimeout(() => onQueryChange(value), 200)
    return () => window.clearTimeout(timeout)
  }, [onQueryChange, value])

  return (
    <div className={clsx("relative w-full", className)}>
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
        search
      </span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full rounded-xl border border-primary/10 bg-[#10261f]/90 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20",
          compact ? "h-11 pl-10 pr-4" : "h-12 pl-10 pr-4",
        )}
      />
    </div>
  )
}
