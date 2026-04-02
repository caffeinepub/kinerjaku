import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRole } from "../backend";
import type {
  EmployeeProfile,
  PerformanceRecord,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ["callerUserRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllEmployeeProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<EmployeeProfile[]>({
    queryKey: ["allEmployeeProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEmployeeProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ["allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPerformanceRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<PerformanceRecord[]>({
    queryKey: ["allPerformanceRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPerformanceRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePerformanceRecordsByEmployee(employeeId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<PerformanceRecord[]>({
    queryKey: ["performanceRecords", employeeId?.toString()],
    queryFn: async () => {
      if (!actor || !employeeId) return [];
      return actor.getPerformanceRecordsByEmployee(employeeId);
    },
    enabled: !!actor && !isFetching && !!employeeId,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

export function useCreatePerformanceRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      employeeName: string;
      realisasi: bigint;
      date: string;
      task: string;
      score: string;
      target: bigint;
      employeeId: Principal;
      fileBuktiUrl?: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createPerformanceRecord(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["performanceRecords"] });
      qc.invalidateQueries({ queryKey: ["allPerformanceRecords"] });
    },
  });
}

export function useDeletePerformanceRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recordId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deletePerformanceRecord(recordId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["performanceRecords"] });
      qc.invalidateQueries({ queryKey: ["allPerformanceRecords"] });
    },
  });
}

export { UserRole };
export type { UserProfile, EmployeeProfile, PerformanceRecord };
