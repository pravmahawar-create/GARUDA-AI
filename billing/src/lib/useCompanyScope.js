import { useEffect, useState } from 'react'
import { getCompanies, getActiveCompany } from '../db'

export default function useCompanyScope() {
  const [scope, setScope] = useState('active')
  const [companies, setCompanies] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    ;(async () => {
      setCompanies(await getCompanies())
      const active = await getActiveCompany()
      setActiveId(active.id)
    })()
  }, [])

  const matches = (row) => scope === 'all' || row.companyId === activeId || !row.companyId

  return { scope, setScope, companies, activeId, matches }
}