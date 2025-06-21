
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CreateStory } from "@/components/dashboard/CreateStory";
import { Library } from "@/components/dashboard/Library";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 p-8">
            {activeTab === "create" && <CreateStory />}
            {activeTab === "library" && <Library />}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Dashboard;
