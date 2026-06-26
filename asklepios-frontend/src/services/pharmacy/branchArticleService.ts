import api from "../../api/api";
import type { ArticleCategoryDto } from "../../types/PharmTypes";

// --- Types & Interfaces ---
export interface BatchStockDto {
  id: number;
  batch_number: string;
  expire_date: string | null;
  purchase_price: number;
  qty: number;
}

export interface BranchArticleDto {
  id: number;
  name: string;
  image_url: string | null;
  barcode: string | null;
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
  batches?: BatchStockDto[];
}

export interface UpdatePricePayload {
  branch_id: number;
  article_id: number;
  special_selling_price: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number; 
  all?: boolean;
}

// --- Fonctions de service internes ---

const get = async (
  id: number,
  page: number = 1,
  search: string = "",
  perPage: number = 15
) => {
  const response = await api.get<PaginatedResponse<BranchArticleDto>>(`/admin/branch/${id}/articles`, {
    params: { page, search, per_page: perPage }
  });
  return response.data;
};

const getAll = async (
  id: number,
  search: string = ""
) => {
  const response = await api.get<BranchArticleDto[]>(`/admin/branch/${id}/articles/all`, {
    params: { search }
  });
  return response.data;
};

const updatePrice = async (payload: UpdatePricePayload)=> {
  const response = await api.post("/admin/branch/articles/update-price", payload);
  return response.data;
};

const exportExcel = async (branchId?: number | null) => {
  const response = await api.get("/admin/branch/articles/export/excel", {
    params: branchId ? { branch_id: branchId } : {},
    responseType: "blob",
  });
  return response.data;
};

// --- Exportation du Service ---
export const branchArticleService = {
  get,
  getAll,
  updatePrice,
  exportExcel,
};