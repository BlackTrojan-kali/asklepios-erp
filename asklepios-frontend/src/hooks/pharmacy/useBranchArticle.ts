import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getBranches, 
  getBranchArticles, 
  getBranchArticlesAll,
  updateBranchArticlePrice,
  exportBranchArticlesExcel,
  type UpdatePricePayload 
} from "../../services/branchArticleService";

export const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
  });
};

export const useBranchArticles = (
  branchId: number | null,
  page: number = 1,
  search: string = "",
  perPage: number = 15
) => {
  return useQuery({
    queryKey: ["branchArticles", branchId, page, search, perPage],
    queryFn: () => getBranchArticles(branchId!, page, search, perPage),
    enabled: branchId !== null, // N'exécuter que si l'ID de la branche est valide
  });
};

export const useBranchArticlesAll = (
  branchId: number | null,
  search: string = ""
) => {
  return useQuery({
    queryKey: ["branchArticlesAll", branchId, search],
    queryFn: () => getBranchArticlesAll(branchId!, search),
    enabled: branchId !== null, // N'exécuter que si l'ID de la branche est valide
  });
};

export const useUpdateBranchArticlePrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: UpdatePricePayload) => updateBranchArticlePrice(payload),
    onSuccess: (_, variables) => {
      // Rafraîchir la liste des articles de la succursale modifiée
      queryClient.invalidateQueries({
        queryKey: ["branchArticles", variables.branch_id]
      });
      queryClient.invalidateQueries({
        queryKey: ["branchArticlesAll", variables.branch_id]
      });
    }
  });
};

export const useExportBranchArticlesExcel = () => {
  return useMutation({
    mutationFn: (branchId?: number | null) => exportBranchArticlesExcel(branchId),
  });
};

export default useBranches;
