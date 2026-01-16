export function navLinkClass(isActive) {
  const base = 'py-2 px-3 rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-primary'
  if (isActive) return `${base} bg-slate-800 text-indigo-300`
  return `${base} text-slate-200 hover:bg-slate-800 focus-visible:bg-slate-800`
}
