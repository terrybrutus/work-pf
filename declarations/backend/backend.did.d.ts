import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface FileReference { 'hash' : string, 'path' : string }
export type Time = bigint;
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  'addProject' : ActorMethod<[string, string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'deleteProject' : ActorMethod<[string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getProjectRevisions' : ActorMethod<[], [] | [Array<[string, string]>]>,
  'getProjectTimestamps' : ActorMethod<[], [] | [Time]>,
  'getProjects' : ActorMethod<[], Array<[string, string]>>,
  'getStats' : ActorMethod<[], Array<[string, string]>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'redo' : ActorMethod<[], undefined>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'reorderProjects' : ActorMethod<[Array<string>], undefined>,
  'save' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'undo' : ActorMethod<[], undefined>,
  'updateProject' : ActorMethod<[string, string], undefined>,
  'updateStat' : ActorMethod<[string, string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
