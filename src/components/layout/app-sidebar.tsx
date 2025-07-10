
"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/icons/logo"
import {
  BarChart2,
  ChevronRight,
  FileUp,
  Home,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Rows3,
  Settings,
  TestTube,
  User,
  Users,
  Wand2,
  Library,
  History,
} from "lucide-react"
import Link from "next/link"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define the menu structure
const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  {
    label: "Generate Data",
    icon: Wand2,
    subItems: [
      { href: "/generate/prompt", label: "From Prompt", icon: Wand2 },
      { href: "/generate/structured", label: "Structured Data", icon: Rows3 },
      { href: "/generate/text", label: "Synthetic Text", icon: TestTube },
    ],
  },
  { href: "/enhance", label: "Upload & Enhance", icon: FileUp },
  { href: "/insights", label: "Data Insights", icon: BarChart2 },
  { href: "/query", label: "Query AI", icon: MessageSquare },
  { href: "/workspace", label: "Team Workspace", icon: Users },
  { href: "/marketplace", label: "Marketplace", icon: Library },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: LifeBuoy },
]

// Helper function to check for active path
const isPathActive = (pathname: string, href: string) => {
  if (href === "/dashboard") {
    return pathname === href
  }
  return pathname.startsWith(href)
}

// A dedicated component to render each navigation item.
// It is defined at the top level of the module to prevent re-creation on every render.
const NavItem = ({ item, pathname }: { item: (typeof menuItems)[0], pathname: string }) => {
  const { icon: Icon, label, href, subItems } = item;

  // Render a collapsible menu for items with sub-items
  if (subItems && subItems.length > 0) {
    const isAnySubActive = subItems.some(sub => isPathActive(pathname, sub.href));

    return (
      <Collapsible key={label} defaultOpen={isAnySubActive}>
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="w-full justify-between" isActive={isAnySubActive}>
              <span className="flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {label}
              </span>
              <ChevronRight className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenu className="pl-6">
            {subItems.map((subItem) => (
              <NavItem key={subItem.href} item={subItem} pathname={pathname} />
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Render a single link for items with an href
  if (href) {
    return (
      <SidebarMenuItem key={href}>
        <SidebarMenuButton asChild className="justify-start" isActive={isPathActive(pathname, href)}>
          <Link href={href}>
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {label}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return null;
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">SynthetiX.AI</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <div className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <NavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto text-left">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start truncate">
                  <span className="font-semibold text-sm leading-tight">{user?.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/help')}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
