import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://tema.indinesia.id" target="_blank" rel="noopener noreferrer">
          TEMA
        </a>
        <span className="ms-1">&copy; 2025 Tema.indinesia.id</span>
      </div>
      <div className="ms-auto">
        
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
