import type { ActorMethod } from "@icp-sdk/core/agent";
import { IDL as CandidIDL } from "@icp-sdk/core/candid";
import type { Principal } from "@icp-sdk/core/principal";

export interface DidFileReference {
  hash: string;
  path: string;
}

export type DidTime = bigint;

export interface DidUserProfile {
  name: string;
}

export type DidUserRole = { admin: null } | { user: null } | { guest: null };

export interface DidCaffeineStorageCreateCertificateResult {
  method: string;
  blob_hash: string;
}

export interface DidCaffeineStorageRefillInformation {
  proposed_top_up_amount: [] | [bigint];
}

export interface DidCaffeineStorageRefillResult {
  success: [] | [boolean];
  topped_up_amount: [] | [bigint];
}

export interface _SERVICE {
  _caffeineStorageBlobsToDelete: ActorMethod<[], Array<string>>;
  _caffeineStorageConfirmBlobDeletion: ActorMethod<[Array<string>], undefined>;
  _caffeineStorageCreateCertificate: ActorMethod<[string], DidCaffeineStorageCreateCertificateResult>;
  _caffeineStorageRefillCashier: ActorMethod<
    [[] | [DidCaffeineStorageRefillInformation]],
    DidCaffeineStorageRefillResult
  >;
  _caffeineStorageUpdateGatewayPrincipals: ActorMethod<[], undefined>;
  addProject: ActorMethod<[string, string], undefined>;
  assignCallerUserRole: ActorMethod<[Principal, DidUserRole], undefined>;
  deleteProject: ActorMethod<[string], undefined>;
  dropFileReference: ActorMethod<[string], undefined>;
  getCallerUserProfile: ActorMethod<[], [] | [DidUserProfile]>;
  getCallerUserRole: ActorMethod<[], DidUserRole>;
  getFileReference: ActorMethod<[string], DidFileReference>;
  getProjectRevisions: ActorMethod<[], [] | [Array<[string, string]>]>;
  getProjectTimestamps: ActorMethod<[], [] | [DidTime]>;
  getProjects: ActorMethod<[], Array<[string, string]>>;
  getStats: ActorMethod<[], Array<[string, string]>>;
  getUserProfile: ActorMethod<[Principal], [] | [DidUserProfile]>;
  initializeAccessControl: ActorMethod<[], undefined>;
  isCallerAdmin: ActorMethod<[], boolean>;
  listFileReferences: ActorMethod<[], Array<DidFileReference>>;
  redo: ActorMethod<[], undefined>;
  registerFileReference: ActorMethod<[string, string], undefined>;
  reorderProjects: ActorMethod<[Array<string>], undefined>;
  save: ActorMethod<[], undefined>;
  saveCallerUserProfile: ActorMethod<[DidUserProfile], undefined>;
  undo: ActorMethod<[], undefined>;
  updateProject: ActorMethod<[string, string], undefined>;
  updateStat: ActorMethod<[string, string], undefined>;
}

export const idlFactory = ({ IDL }: { IDL: typeof CandidIDL }) => {
  const CaffeineStorageCreateCertificateResult = IDL.Record({
    method: IDL.Text,
    blob_hash: IDL.Text,
  });
  const CaffeineStorageRefillInformation = IDL.Record({
    proposed_top_up_amount: IDL.Opt(IDL.Nat),
  });
  const CaffeineStorageRefillResult = IDL.Record({
    success: IDL.Opt(IDL.Bool),
    topped_up_amount: IDL.Opt(IDL.Nat),
  });
  const UserRole = IDL.Variant({
    admin: IDL.Null,
    user: IDL.Null,
    guest: IDL.Null,
  });
  const UserProfile = IDL.Record({ name: IDL.Text });
  const FileReference = IDL.Record({ hash: IDL.Text, path: IDL.Text });
  const Time = IDL.Int;

  return IDL.Service({
    _caffeineStorageBlobsToDelete: IDL.Func([], [IDL.Vec(IDL.Text)], ["query"]),
    _caffeineStorageConfirmBlobDeletion: IDL.Func([IDL.Vec(IDL.Text)], [], []),
    _caffeineStorageCreateCertificate: IDL.Func([IDL.Text], [CaffeineStorageCreateCertificateResult], []),
    _caffeineStorageRefillCashier: IDL.Func(
      [IDL.Opt(CaffeineStorageRefillInformation)],
      [CaffeineStorageRefillResult],
      [],
    ),
    _caffeineStorageUpdateGatewayPrincipals: IDL.Func([], [], []),
    addProject: IDL.Func([IDL.Text, IDL.Text], [], []),
    assignCallerUserRole: IDL.Func([IDL.Principal, UserRole], [], []),
    deleteProject: IDL.Func([IDL.Text], [], []),
    dropFileReference: IDL.Func([IDL.Text], [], []),
    getCallerUserProfile: IDL.Func([], [IDL.Opt(UserProfile)], ["query"]),
    getCallerUserRole: IDL.Func([], [UserRole], ["query"]),
    getFileReference: IDL.Func([IDL.Text], [FileReference], ["query"]),
    getProjectRevisions: IDL.Func([], [IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)))], ["query"]),
    getProjectTimestamps: IDL.Func([], [IDL.Opt(Time)], ["query"]),
    getProjects: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], ["query"]),
    getStats: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], ["query"]),
    getUserProfile: IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ["query"]),
    initializeAccessControl: IDL.Func([], [], []),
    isCallerAdmin: IDL.Func([], [IDL.Bool], ["query"]),
    listFileReferences: IDL.Func([], [IDL.Vec(FileReference)], ["query"]),
    redo: IDL.Func([], [], []),
    registerFileReference: IDL.Func([IDL.Text, IDL.Text], [], []),
    reorderProjects: IDL.Func([IDL.Vec(IDL.Text)], [], []),
    save: IDL.Func([], [], []),
    saveCallerUserProfile: IDL.Func([UserProfile], [], []),
    undo: IDL.Func([], [], []),
    updateProject: IDL.Func([IDL.Text, IDL.Text], [], []),
    updateStat: IDL.Func([IDL.Text, IDL.Text], [], []),
  });
};
