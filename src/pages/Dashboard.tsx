
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CreateStory } from "@/components/dashboard/CreateStory";
import { Library } from "@/components/dashboard/Library";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useState } from "react";
import { LogOut, User } from "lucide-react";

const Dashboard = () => {
  const [activeView, setActiveView] = useState("create");
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeView === "create" ? "Create Story" : "My Library"}
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
          {activeView === "create" && <CreateStory />}
          {activeView === "library" && <Library />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
