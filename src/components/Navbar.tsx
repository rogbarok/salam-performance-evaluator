
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { LogOut, User } from "lucide-react";

export const Navbar = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b mb-6">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Sistem Evaluasi Kinerja Karyawan
            </h1>
            <p className="text-sm text-gray-600">Yayasan As-Salam Joglo</p>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
