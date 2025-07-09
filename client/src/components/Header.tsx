import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Video, Home, BarChart3, Upload, User } from "lucide-react";

export default function Header() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/upload", label: "Upload", icon: Upload },
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  ];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center hover:text-primary transition-colors"
            >
              <Video className="text-primary text-2xl mr-2" />
              <span className="text-xl font-bold text-gray-900">VideoAnalyzer Pro</span>
            </button>
            
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      location === item.path
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-700 hover:text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">
                {user?.firstName || user?.email || 'User'}
              </span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
