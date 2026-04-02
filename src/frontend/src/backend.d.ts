import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PerformanceRecord {
    id: bigint;
    adminRating?: string;
    employeeName: string;
    realisasi: bigint;
    date: string;
    createdAt: Time;
    task: string;
    score: string;
    target: bigint;
    employeeId: Principal;
    adminFeedback?: string;
    percentage: number;
    fileBuktiUrl?: string;
}
export interface EmployeeProfile {
    id: Principal;
    nip: string;
    latitude: number;
    desa: string;
    name: string;
    createdAt: Time;
    role: UserRole;
    longitude: number;
    kecamatan: string;
    address: string;
}
export type Time = bigint;
export interface UserProfile {
    nip: string;
    latitude: number;
    desa: string;
    name: string;
    longitude: number;
    kecamatan: string;
    address: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminUpdateUserProfile(id: Principal, profile: UserProfile): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateEmployeeProfile(profile: EmployeeProfile): Promise<void>;
    createPerformanceRecord(recordInput: {
        employeeName: string;
        realisasi: bigint;
        date: string;
        task: string;
        score: string;
        target: bigint;
        employeeId: Principal;
        fileBuktiUrl?: string;
    }): Promise<bigint>;
    deleteEmployeeProfile(id: Principal): Promise<void>;
    deletePerformanceRecord(recordId: bigint): Promise<void>;
    deleteUserProfile(id: Principal): Promise<void>;
    getAllEmployeeProfiles(): Promise<Array<EmployeeProfile>>;
    getAllPerformanceRecords(): Promise<Array<PerformanceRecord>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmployeeProfile(id: Principal): Promise<EmployeeProfile | null>;
    getPerformanceRecordsByEmployee(employeeId: Principal): Promise<Array<PerformanceRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePerformanceRecord(recordId: bigint, task: string, target: bigint, realisasi: bigint, score: string, date: string): Promise<void>;
    updateRecordFeedback(recordId: bigint, adminFeedback: string | null, adminRating: string | null): Promise<void>;
}
