import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useTrades() {
  const qc = useQueryClient();
  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("trades").select("*")
        .or(`from_player_id.eq.${user.id},to_player_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 6000,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["trades"] });
  return { trades: trades || [], isLoading, invalidate };
}
