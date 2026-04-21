import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "admin" | "broker" | null;
  brokerId: string | null;
  hasActiveSubscription: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "broker" | null>(null);
  const [brokerId, setBrokerId] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  const fetchRole = async (userId: string) => {
    // Paralelizar todas as queries — antes eram sequenciais (3 round-trips)
    const nowIso = new Date().toISOString();
    const [rolesRes, brokerRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("brokers").select("id").eq("user_id", userId).maybeSingle(),
    ]);

    const data = rolesRes.data;
    setBrokerId(brokerRes.data?.id || null);

    if (data && data.length > 0) {
      const roles = data.map((d) => d.role as "admin" | "broker");
      const r = roles.includes("admin") ? "admin" : roles[0];
      setRole(r);

      if (r === "admin") {
        setHasActiveSubscription(true);
      } else {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "ativa" as any)
          .gte("expires_at", nowIso)
          .lte("starts_at", nowIso)
          .limit(1);
        setHasActiveSubscription(subs && subs.length > 0);
      }
    } else {
      setRole(null);
      setHasActiveSubscription(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
          setBrokerId(null);
          setHasActiveSubscription(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setBrokerId(null);
    setHasActiveSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, brokerId, hasActiveSubscription, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
