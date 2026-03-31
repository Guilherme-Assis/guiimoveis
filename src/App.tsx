import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import PropertyDetail from "./pages/PropertyDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import BrokerProfile from "./pages/BrokerProfile";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Favorites from "./pages/Favorites";
import MapSearch from "./pages/MapSearch";
import CityProperties from "./pages/CityProperties";
import Lancamentos from "./pages/Lancamentos";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Properties from "./pages/admin/Properties";
import Brokers from "./pages/admin/Brokers";
import Profile from "./pages/admin/Profile";
import BlogAdmin from "./pages/admin/BlogAdmin";
import { ReactNode } from "react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/admin" replace />;
  if (!role) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Sem permissão de acesso.</p></div>;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/imovel/:slug" element={<PropertyDetail />} />
            <Route path="/corretor/:slug" element={<BrokerProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/mapa" element={<MapSearch />} />
            <Route path="/imoveis/:citySlug" element={<CityProperties />} />
            <Route path="/lancamentos" element={<Lancamentos />} />
            <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/properties" element={<ProtectedRoute><AdminLayout><Properties /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/brokers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><Brokers /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute><AdminLayout><Profile /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><BlogAdmin /></AdminLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
