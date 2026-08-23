import React from 'react'
import ClassicTemplate from './templates/ClassicTemplate'
import ModernTemplate from './templates/ModernTemplate'
import PremiumTemplate from './templates/PremiumTemplate'
import MinimalTemplate from './templates/MinimalTemplate'
import TransportTemplate from './templates/TransportTemplate'

const MAP = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  premium: PremiumTemplate,
  minimal: MinimalTemplate,
  transport: TransportTemplate
}

export default function InvoicePaper({ invoice, company, customer }) {
  const tpl = MAP[invoice.templateId] || ClassicTemplate
  return React.createElement(tpl, { invoice, company, customer })
}