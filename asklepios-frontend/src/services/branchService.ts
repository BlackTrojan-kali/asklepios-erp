import api from "../api/api";
import type { PharmacyBranchDto } from "../types/PharmTypes";

const getBranches = async (): Promise<PharmacyBranchDto[]> => {
  const response = await api.get<PharmacyBranchDto[]>("/admin/pharmacy-branches");
  return response.data;
};

// On regroupe tout dans un objet service
export const branchService = {
  getBranches,

};