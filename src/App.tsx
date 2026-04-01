import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { lazy, Suspense, ReactNode } from "react";

// Eager load: home page
import Index from "./pages/Index";

// Lazy load: all other pages
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const BrokerProfile = lazy(() => import("./pages/BrokerProfile"));
const BrokerCard = lazy(() => import("./pages/BrokerCard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MapSearch = lazy(() => import("./pages/MapSearch"));
const CityProperties = lazy(() => import("./pages/CityProperties"));
const Lancamentos = lazy(() => import("./pages/Lancamentos"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Properties = lazy(() => import("./pages/admin/Properties"));
const Brokers = lazy(() => import("./pages/admin/Brokers"));
const Profile = lazy(() => import("./pages/admin/Profile"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const CRM = lazy(() => import("./pages/admin/CRM"));
const PropertyChatWidget = lazy(() => import("./components/PropertyChatWidget"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="font-body text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/imovel/:slug" element={<PropertyDetail />} />
              <Route path="/corretor/:slug" element={<BrokerProfile />} />
              <Route path="/corretor/:slug/cartao" element={<BrokerCard />} />
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
              <Route path="/admin/crm" element={<ProtectedRoute><AdminLayout><CRM /></AdminLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Suspense fallback={null}>
          <PropertyChatWidget />
        </Suspense>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
