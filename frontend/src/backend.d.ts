import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface FileReference {
    hash: string;
    path: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProject(id: string, content: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProject(id: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileReference(path: string): Promise<FileReference>;
    getProjectRevisions(): Promise<Array<[string, string]> | null>;
    getProjectTimestamps(): Promise<Time | null>;
    getProjects(): Promise<Array<[string, string]>>;
    getStats(): Promise<Array<[string, string]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listFileReferences(): Promise<Array<FileReference>>;
    redo(): Promise<void>;
    registerFileReference(path: string, hash: string): Promise<void>;
    reorderProjects(newOrder: Array<string>): Promise<void>;
    save(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    undo(): Promise<void>;
    updateProject(id: string, content: string): Promise<void>;
    updateStat(key: string, value: string): Promise<void>;
}