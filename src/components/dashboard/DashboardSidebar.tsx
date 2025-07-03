import { BookOpen, Plus, Clock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
interface DashboardSidebarProps {
  activeTab: "create" | "library" | "in-progress";
  onTabChange: (tab: "create" | "library" | "in-progress") => void;
  processingCount?: number;
}
export function DashboardSidebar({
  activeTab,
  onTabChange,
  processingCount = 0
}: DashboardSidebarProps) {
  return <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-4 py-2">
          <BookOpen className="h-8 w-8 text-purple-600" />
          <span className="text-xl font-bold text-gray-800">StoryMagic
        </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onTabChange("create")} isActive={activeTab === "create"} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Story</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onTabChange("in-progress")} isActive={activeTab === "in-progress"} className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Stories In Progress</span>
                  {processingCount > 0 && <span className="ml-auto bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                      {processingCount}
                    </span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => onTabChange("library")} isActive={activeTab === "library"} className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>My Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}