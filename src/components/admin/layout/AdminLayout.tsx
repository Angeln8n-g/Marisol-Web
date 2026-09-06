import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useSessionTimeout } from '../../../hooks/useSessionTimeout'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Monitorear timeout de sesión
  useSessionTimeout()

  return (
    <div className="min-h-screen bg-cream flex print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 print:block">
        <div className="print:hidden">
          <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto print:p-0 print:m-0 print:overflow-visible print:block">
          {children}
        </main>
      </div>
    </div>
  )
}
