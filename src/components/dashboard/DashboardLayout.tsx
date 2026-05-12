import { NavLink, Routes, Route, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, Calendar, FileText, LogOut, MessageSquare, Settings, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import Overview from '@/pages/dashboard/Overview'
import Leads from '@/pages/dashboard/Leads'
import Conversations from '@/pages/dashboard/Conversations'
import Devis from '@/pages/dashboard/Devis'
import Rdv from '@/pages/dashboard/Rdv'
import Reminders from '@/pages/dashboard/Reminders'
import DashboardSettings from '@/pages/dashboard/Settings'

const navItems = [
  { to: '/dashboard', label: 'Tableau de bord', icon: BarChart3, end: true },
  { to: '/dashboard/leads', label: 'Leads', icon: Users },
  { to: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/dashboard/devis', label: 'Devis', icon: FileText },
  { to: '/dashboard/rdv', label: 'Rendez-vous', icon: Calendar },
  { to: '/dashboard/reminders', label: 'Rappels SMS', icon: Bell },
  { to: '/dashboard/settings', label: 'Paramètres', icon: Settings },
]

export default function DashboardLayout() {
  const { user, garageProfile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('Déconnecté')
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">A</div>
            <span className="font-display text-[15px] font-semibold tracking-tight">AutoLead AI</span>
          </NavLink>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-2">
            <p className="text-[12px] font-medium text-sidebar-foreground truncate">
              {garageProfile?.garage_name ?? 'Mon garage'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-[13px] text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 items-center border-b border-border px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="leads" element={<Leads />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="devis" element={<Devis />} />
            <Route path="rdv" element={<Rdv />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Routes>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
