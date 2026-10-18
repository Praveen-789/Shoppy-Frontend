import { House, Laptop, Monitor, Package, Shirt, ShoppingBag, Smartphone, Tv } from 'lucide-react'
import { Button } from './ui/button'
import './CategoryNavigation.css'

interface Props {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
}

function categoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'clothing': case 'fashion': return Shirt
    case 'mobiles': case 'phones': return Smartphone
    case 'laptops': return Laptop
    case 'electronic': case 'electronics': return Monitor
    case 'televisions': return Tv
    case 'home': return House
    case 'accessories': return ShoppingBag
    default: return Package
  }
}

function categoryLabel(category: string) {
  return category.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

export default function CategoryNavigation({ categories, selected, onSelect }: Props) {
  const anchor = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    if (!anchor.current) return
    // Observe a stable marker before the bar. Watching the bar itself would
    // retrigger the observer when its height changes and could make it flicker.
    const observer = new IntersectionObserver(([entry]) => {
      setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    observer.observe(anchor.current)
    return () => observer.disconnect()
  }, [])

  const items = [{ value: '', label: 'All products', Icon: ShoppingBag },
    ...categories.map(category => ({ value: category, label: categoryLabel(category), Icon: categoryIcon(category) }))]

  return <>
    <div ref={anchor} className="category-navigation-anchor" aria-hidden="true" />
    <nav className={`category-navigation${compact ? ' category-navigation-compact' : ''}`} aria-label="Shop categories">
    <div className="category-navigation-scroll">
      {items.map(({ value, label, Icon }) => <Button type="button" variant="ghost" key={value}
        className="category-navigation-item" aria-pressed={selected === value} title={label} onClick={() => onSelect(value)}>
        <span className="category-navigation-icon"><Icon className="size-6" strokeWidth={1.6} aria-hidden="true" /></span>
        <span className="category-navigation-label">{label}</span>
      </Button>)}
    </div>
    </nav>
  </>
}
import { useEffect, useRef, useState } from 'react'
