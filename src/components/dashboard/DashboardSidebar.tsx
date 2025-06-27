import { BookOpen, Upload, Plus, Clock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar";
interface DashboardSidebarProps {
  activeTab: "create" | "in-progress" | "library";
  onTabChange: (tab: "create" | "in-progress" | "library") => void;
}
export function DashboardSidebar({
  activeTab,
  onTabChange
}: DashboardSidebarProps) {
  return <Sidebar>
      <SidebarHeader>
        <div className="flex items-center space-x-2 px-4 py-2">
          <BookOpen className="h-8 w-8 text-purple-600" />
          <span className="text-xl font-bold text-gray-800">StoryMagic</span>
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
                  <span>In Progress</span>
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