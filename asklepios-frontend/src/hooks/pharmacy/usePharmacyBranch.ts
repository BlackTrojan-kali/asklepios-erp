import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getPharmacyBranches, 
  getPharmacyBranchesById, 
  updatePharmacyBranchArticlePrice,
  exportBranchArticlesExcel,
  type UpdatePricePayload 
} from "../../services/pharmacyBranchService";

export const usePharmacyBranches = () => {
  return useQuery({
    queryKey: ["pharmacyBranches"],
    queryFn: getPharmacyBranches,
  });
};

export const usePharmacyBranchArticles = (
  branchId: number | null,
  page: number = 1,
  search: string = "",
  perPage: number = 15
) => {
  return useQuery({
    queryKey: ["pharmacyBranchArticles", branchId, page, search, perPage],
    queryFn: () => getPharmacyBranchesById(branchId!, page, search, perPage),
    enabled: branchId !== null, // N'exécuter que si l'ID de la branche est valide
  });
};

export const useUpdatePharmacyBranchArticlePrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: UpdatePricePayload) => updatePharmacyBranchArticlePrice(payload),
    onSuccess: (_, variables) => {
      // Rafraîchir la liste des articles de la succursale modifiée
      queryClient.invalidateQueries({
        queryKey: ["pharmacyBranchArticles", variables.pharmacy_branch_id]
      });
    }
  });
};

export const useExportBranchArticlesExcel = () => {
  return useMutation({
    mutationFn: (branchId?: number | null) => exportBranchArticlesExcel(branchId),
  });
};

export default usePharmacyBranches;
