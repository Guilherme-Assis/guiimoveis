import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerAvatar {
  displayName: string;
  avatarUrl: string | null;
}

export const usePropertyPartners = (propertyId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["property-partners", propertyId],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PartnerAvatar[]> => {
      // Get partnerships for this property
      const { data: partnerships, error } = await supabase
        .from("partnerships")
        .select("partner_broker_id")
        .eq("property_id", propertyId)
        .in("status", ["pendente", "aceita", "ativa"]);

      if (error || !partnerships?.length) return [];

      const brokerIds = partnerships.map((p) => p.partner_broker_id);

      // Get broker user_ids
      const { data: brokers } = await supabase
        .from("brokers")
        .select("user_id")
        .in("id", brokerIds);

      if (!brokers?.length) return [];

      // Use RPC to get public profiles
      const profiles: PartnerAvatar[] = [];
      for (const b of brokers) {
        const { data } = await supabase.rpc("get_public_profile", { _user_id: b.user_id });
        if (data?.[0]) {
          profiles.push({
            displayName: data[0].display_name || "Corretor",
            avatarUrl: data[0].avatar_url,
          });
        }
      }

      return profiles;
    },
  });
};
