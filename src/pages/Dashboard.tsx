
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CreateStory } from "@/components/dashboard/CreateStory";
import { Library } from "@/components/dashboard/Library";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "create" ? "Create Story" : "My Library"}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </header>
          
          <div className="p-6">
            {activeTab === "create" && <CreateStory />}
            {activeTab === "library" && <Library />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
