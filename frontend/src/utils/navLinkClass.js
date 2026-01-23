export function navLinkClass(isActive) {
  const base = 'py-2 px-3 rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-primary'
  if (isActive) return `${base} btn-accent`
  return `${base} text-text-main opacity-60 hover:bg-indigo-500/5 focus-visible:bg-indigo-500/5`
}
