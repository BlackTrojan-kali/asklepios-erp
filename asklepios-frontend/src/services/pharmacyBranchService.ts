import api from "../api/api";
import type { PharmacyBranchDto, ArticleCategoryDto } from "../types/PharmTypes";

export interface BranchArticleDto {
  id: number;
  name: string;
  image_url: string | null;
  track_batches: boolean;
  is_prescripted: boolean;
  category: ArticleCategoryDto | null;
  default_selling_price: number;
  branch_config: {
    id: number;
    special_selling_price: number | null;
    is_active: boolean;
    default_storage_location_id: number | null;
  } | null;
  selling_price: number;
  is_active: boolean;
  default_storage_location: {
    id: number;
    aisle: string;
    shelf: string;
    code: string;
  } | null;
  stock_qty: number;
}

export const getPharmacyBranches = async (): Promise<PharmacyBranchDto[]> => {
  const response = await api.get<PharmacyBranchDto[]>("/admin/pharmacy-branches");
  return response.data;
};

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const getPharmacyBranchesById = async (
  id: number,
  page: number = 1,
  search: string = "",
  perPage: number = 15
): Promise<PaginatedResponse<BranchArticleDto>> => {
  const response = await api.get<PaginatedResponse<BranchArticleDto>>(`/admin/branch/${id}/articles`, {
    params: { page, search, per_page: perPage }
  });
  return response.data;
};

export interface UpdatePricePayload {
  pharmacy_branch_id: number;
  article_id: number;
  special_selling_price: number | null;
}

export const updatePharmacyBranchArticlePrice = async (payload: UpdatePricePayload): Promise<any> => {
  const response = await api.post("/admin/branch/articles/update-price", payload);
  return response.data;
};

export const exportBranchArticlesExcel = async (branchId?: number | null): Promise<Blob> => {
  const response = await api.get("/admin/branch/articles/export/excel", {
    params: branchId ? { branch_id: branchId } : {},
    responseType: "blob",
  });
  return response.data;
};

