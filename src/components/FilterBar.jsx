import SearchBar from "./SearchBar.jsx"

export default function FilterBar({
  searchPlaceholder,
  defaultQuery = "",
  onQueryChange,
  categoryLabel,
  categoryOptions = [],
  categoryValue = "",
  onCategoryChange,
  sortLabel,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  extra,
}) {
  return (
    <div className="sticky top-20 z-30 rounded-2xl border border-primary/10 bg-slate-900/55 p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[240px] flex-1">
          <SearchBar placeholder={searchPlaceholder} defaultValue={defaultQuery} onQueryChange={onQueryChange} compact />
        </div>
        {categoryOptions.length ? (
          <label className="min-w-[180px]">
            <span className="sr-only">{categoryLabel}</span>
            <select value={categoryValue} onChange={(event) => onCategoryChange?.(event.target.value)} className="h-11 rounded-xl border border-primary/10 bg-[#10261f]/90 px-3 text-sm text-slate-200">
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {sortOptions.length ? (
          <label className="min-w-[180px]">
            <span className="sr-only">{sortLabel}</span>
            <select value={sortValue} onChange={(event) => onSortChange?.(event.target.value)} className="h-11 rounded-xl border border-primary/10 bg-[#10261f]/90 px-3 text-sm text-slate-200">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {extra}
      </div>
    </div>
  )
}
