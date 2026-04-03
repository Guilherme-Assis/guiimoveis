import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "pv_session_id";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function useTrackPropertyView(propertyId: string | undefined) {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!propertyId || tracked.current === propertyId) return;
    tracked.current = propertyId;

    const record = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("property_views").insert({
        property_id: propertyId,
        user_id: user?.id || null,
        session_id: getSessionId(),
      });
    };
    record();
  }, [propertyId]);
}
