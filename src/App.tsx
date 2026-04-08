import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CompareProvider } from "@/contexts/CompareContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { lazy, Suspense, ReactNode } from "react";

// Eager load: home page
import Index from "./pages/Index";

// Lazy load: all other pages
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const BrokerProfile = lazy(() => import("./pages/BrokerProfile"));
const Corretores = lazy(() => import("./pages/Corretores"));
const BrokerCard = lazy(() => import("./pages/BrokerCard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Favorites = lazy(() => import("./pages/Favorites"));
const MapSearch = lazy(() => import("./pages/MapSearch"));
const CityProperties = lazy(() => import("./pages/CityProperties"));
const Lancamentos = lazy(() => import("./pages/Lancamentos"));
const Compare = lazy(() => import("./pages/Compare"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Properties = lazy(() => import("./pages/admin/Properties"));
const Brokers = lazy(() => import("./pages/admin/Brokers"));
const Profile = lazy(() => import("./pages/admin/Profile"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const CRM = lazy(() => import("./pages/admin/CRM"));

const PropertyChatWidget = lazy(() => import("./components/PropertyChatWidget"));
const CompareBar = lazy(() => import("./components/CompareBar"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="font-body text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);


const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) => {
  const { user, loading, role, hasActiveSubscription } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/admin" replace />;
  if (!role) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="font-body text-muted-foreground">Sem permissão de acesso.</p></div>;
  if (role !== "admin" && hasActiveSubscription === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Licença Expirada</h2>
          <p className="text-muted-foreground">Sua licença de acesso expirou ou ainda não foi ativada. Entre em contato com o administrador para renovar seu acesso.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      <CompareProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/imovel/:slug" element={<PropertyDetail />} />
                <Route path="/corretores" element={<Corretores />} />
                <Route path="/corretor/:slug" element={<BrokerProfile />} />
                <Route path="/corretor/:slug/cartao" element={<BrokerCard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/mapa" element={<MapSearch />} />
                <Route path="/imoveis/:citySlug" element={<CityProperties />} />
                <Route path="/lancamentos" element={<Lancamentos />} />
                <Route path="/comparar" element={<Compare />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/properties" element={<ProtectedRoute><AdminLayout><Properties /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/brokers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><Brokers /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/profile" element={<ProtectedRoute><AdminLayout><Profile /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayout><BlogAdmin /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/crm" element={<ProtectedRoute><AdminLayout><CRM /></AdminLayout></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Suspense fallback={null}>
              <CompareBar />
              <PropertyChatWidget />
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CompareProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
