import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function usePlayer() {
  const qc = useQueryClient();
  const { data: player, isLoading } = useQuery({
    queryKey: ["player"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("players").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["player"] });
  return { player, isLoading, invalidate };
}
