import { expect, test, describe } from 'vitest'
import { navLinkClass } from './navLinkClass'

describe('navLinkClass', () => {
  test('returns active class when isActive is true', () => {
    const result = navLinkClass(true)
    expect(result).toContain('bg-slate-800')
    expect(result).toContain('text-indigo-300')
    expect(result).toContain('py-2 px-3 rounded-md text-sm')
    expect(result).toContain('focus:outline-none')
    expect(result).toContain('focus-visible:ring-3')
    expect(result).toContain('focus-visible:ring-primary')
  })

  test('returns inactive class when isActive is false', () => {
    const result = navLinkClass(false)
    expect(result).toContain('text-slate-200')
    expect(result).toContain('hover:bg-slate-800')
    expect(result).toContain('focus-visible:bg-slate-800')
    expect(result).toContain('py-2 px-3 rounded-md text-sm')
    expect(result).toContain('focus:outline-none')
    expect(result).toContain('focus-visible:ring-3')
    expect(result).toContain('focus-visible:ring-primary')
    expect(result).not.toContain('bg-slate-800 text-indigo-300')
  })

  test('includes base classes in both active and inactive states', () => {
    const activeResult = navLinkClass(true)
    const inactiveResult = navLinkClass(false)

    const baseClasses = 'py-2 px-3 rounded-md text-sm focus:outline-none focus-visible:ring-3 focus-visible:ring-primary'

    expect(activeResult).toContain(baseClasses)
    expect(inactiveResult).toContain(baseClasses)
  })

  test('active and inactive classes are different', () => {
    const activeResult = navLinkClass(true)
    const inactiveResult = navLinkClass(false)

    expect(activeResult).not.toBe(inactiveResult)
  })
})