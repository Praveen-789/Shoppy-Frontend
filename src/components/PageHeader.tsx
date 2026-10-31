import type { ReactNode } from 'react'
import './PageHeader.css'

interface Props {
  eyebrow: ReactNode
  title: ReactNode
  description?: ReactNode
  // Buttons that belong to the whole page, such as Refresh or Add product. They sit on the right.
  actions?: ReactNode
}

// The compact heading used at the top of every page except the catalog. The catalog keeps its
// larger welcome banner because it is the shop's front door; everywhere else, a short heading
// with the page's main action gets visitors to the content sooner.
export default function PageHeader({ eyebrow, title, description, actions }: Props) {
  return <section className="page-header">
    <div className="page-header-text">
      <span className="page-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </section>
}
