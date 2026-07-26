import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  branchArticleService,
  type UpdatePricePayload,
  type BranchArticleDto,
  type PaginatedResponse,
} from "../../services/pharmacy/branchArticleService";


export const useBranchArticles = (
  branchId: number | null,
  page: number = 1,
  search: string = "",
  perPage: number = 15
) => {
  return useQuery({
    queryKey: ["branchArticles", branchId, page, search, perPage],
    queryFn: () => branchArticleService.get(branchId!, page, search, perPage),
    enabled: branchId !== null, // N'exécuter que si l'ID de la branche est valide
  });
};

export const useBranchArticlesAll = (
  branchId: number | null,
  search: string = ""
) => {
  return useQuery({
    queryKey: ["branchArticlesAll", branchId, search],
    queryFn: () => branchArticleService.getAll(branchId!, search),
    enabled: branchId !== null, // N'exécuter que si l'ID de la branche est valide
  });
};

export const useUpdateBranchArticlePrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePricePayload) => branchArticleService.updatePrice(payload),
    onMutate: async (newPriceData) => {
      // 1. Annuler les requêtes actives pour éviter les conflits de données
      await queryClient.cancelQueries({
        queryKey: ["branchArticles", newPriceData.branch_id],
      });
      await queryClient.cancelQueries({
        queryKey: ["branchArticlesAll", newPriceData.branch_id],
      });

      // 2. Prendre un snapshot de l'état précédent du cache pour le rollback
      const previousBranchArticlesQueries = queryClient.getQueriesData({
        queryKey: ["branchArticles", newPriceData.branch_id],
      });
      const previousBranchArticlesAllQueries = queryClient.getQueriesData({
        queryKey: ["branchArticlesAll", newPriceData.branch_id],
      });

      // 3. Mise à jour instantanée (Optimistic Update 0ms) des données paginées
      queryClient.setQueriesData<PaginatedResponse<BranchArticleDto>>(
        { queryKey: ["branchArticles", newPriceData.branch_id] },
        (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((article) => {
              if (article.id === newPriceData.article_id) {
                const specialSellingPrice = newPriceData.special_selling_price;
                const finalPrice =
                  specialSellingPrice !== null
                    ? specialSellingPrice
                    : article.default_selling_price;

                return {
                  ...article,
                  selling_price: finalPrice,
                  branch_config: article.branch_config
                    ? {
                        ...article.branch_config,
                        special_selling_price: specialSellingPrice,
                      }
                    : {
                        id: Date.now(),
                        pharmacy_branch_id: newPriceData.branch_id,
                        article_id: newPriceData.article_id,
                        special_selling_price: specialSellingPrice,
                        is_active: true,
                        default_storage_location_id: null,
                      },
                };
              }
              return article;
            }),
          };
        }
      );

      // Mettre à jour également le cache non-paginé branchArticlesAll
      queryClient.setQueriesData<BranchArticleDto[]>(
        { queryKey: ["branchArticlesAll", newPriceData.branch_id] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((article) => {
            if (article.id === newPriceData.article_id) {
              const specialSellingPrice = newPriceData.special_selling_price;
              const finalPrice =
                specialSellingPrice !== null
                  ? specialSellingPrice
                  : article.default_selling_price;

              return {
                ...article,
                selling_price: finalPrice,
                branch_config: article.branch_config
                  ? {
                      ...article.branch_config,
                      special_selling_price: specialSellingPrice,
                    }
                  : {
                      id: Date.now(),
                      pharmacy_branch_id: newPriceData.branch_id,
                      article_id: newPriceData.article_id,
                      special_selling_price: specialSellingPrice,
                      is_active: true,
                      default_storage_location_id: null,
                    },
              };
            }
            return article;
          });
        }
      );

      return { previousBranchArticlesQueries, previousBranchArticlesAllQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback automatique en cas d'échec de la requête
      if (context?.previousBranchArticlesQueries) {
        context.previousBranchArticlesQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousBranchArticlesAllQueries) {
        context.previousBranchArticlesAllQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Échec de la mise à jour du prix sur le serveur.");
    },
    onSettled: (_, __, variables) => {
      // Invalidation en arrière-plan pour garanties de synchronisation
      queryClient.invalidateQueries({
        queryKey: ["branchArticles", variables.branch_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["branchArticlesAll", variables.branch_id],
      });
    },
  });
};

export const useExportBranchArticlesExcel = () => {
  return useMutation({
    mutationFn: (branchId?: number | null) => branchArticleService.exportExcel(branchId),
  });
};

export const useExportBranchArticlesPdf = () => {
  return useMutation({
    mutationFn: (branchId?: number | null) => branchArticleService.exportPdf(branchId),
  });
};


