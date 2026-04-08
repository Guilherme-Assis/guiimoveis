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
      const { data, error } = await supabase.rpc("get_property_partner_avatars", {
        _property_id: propertyId,
      });

      if (error || !data?.length) return [];

      return data.map((row: any) => ({
        displayName: row.display_name || "Corretor",
        avatarUrl: row.avatar_url,
      }));
    },
  });
};
