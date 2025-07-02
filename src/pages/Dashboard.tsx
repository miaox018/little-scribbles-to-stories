
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CreateStory } from "@/components/dashboard/CreateStory";
import { Library } from "@/components/dashboard/Library";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { RecoveryButton } from "@/components/dashboard/RecoveryButton";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useStoryRecovery } from "@/hooks/useStoryRecovery";
import { useState, useEffect, useRef } from "react";
import { LogOut, User, Shield } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const { user, signOut } = useAuth();
  const { isAdmin, assignAdminByEmail } = useUserRoles();
  const { checkForUnfinishedStories } = useStoryRecovery();
  const hasAttemptedAssignment = useRef(false);
  const hasCheckedUnfinished = useRef(false);

  // Auto-assign admin role to the specified email on first load only
  useEffect(() => {
    if (user?.email === 'miaox018@gmail.com' && !isAdmin && !hasAttemptedAssignment.current) {
      hasAttemptedAssignment.current = true;
      // Use a timeout to avoid race conditions
      setTimeout(() => {
        assignAdminByEmail.mutate('miaox018@gmail.com', {
          onError: (error) => {
            console.log('Admin role assignment skipped (likely already exists):', error);
          }
        });
      }, 1000);
    }
  }, [user?.email, isAdmin, assignAdminByEmail]);

  // Check for unfinished stories on dashboard load
  useEffect(() => {
    if (user && !hasCheckedUnfinished.current) {
      hasCheckedUnfinished.current = true;
      // Wait a bit for initial load to complete
      setTimeout(() => {
        checkForUnfinishedStories();
      }, 2000);
    }
  }, [user, checkForUnfinishedStories]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavigateToCreate = () => {
    setActiveTab("create");
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "create": return "Create Story";
      case "library": return "My Library";
      default: return "Dashboard";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                {getTabTitle()}
              </h1>
              <div className="flex items-center space-x-4">
                {activeTab === "library" && <RecoveryButton />}
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                  {isAdmin && (
                    <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Admin</span>
                    </div>
                  )}
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
            {isAdmin && (
              <div className="mb-6">
                <AdminPanel />
              </div>
            )}
            {activeTab === "create" && <CreateStory />}
            {activeTab === "library" && <Library onNavigateToCreate={handleNavigateToCreate} />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
