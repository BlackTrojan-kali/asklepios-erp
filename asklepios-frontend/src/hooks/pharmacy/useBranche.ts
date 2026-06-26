import { useQuery } from "@tanstack/react-query";
import { branchService } from "../../services/branchService";

export const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: branchService.getBranches,
  });
};
