export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const Time = IDL.Int;
  return IDL.Service({
    'addProject' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'deleteProject' : IDL.Func([IDL.Text], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getProjectRevisions' : IDL.Func(
        [],
        [IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)))],
        ['query'],
      ),
    'getProjectTimestamps' : IDL.Func([], [IDL.Opt(Time)], ['query']),
    'getProjects' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getStats' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'redo' : IDL.Func([], [], []),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'reorderProjects' : IDL.Func([IDL.Vec(IDL.Text)], [], []),
    'save' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'undo' : IDL.Func([], [], []),
    'updateProject' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateStat' : IDL.Func([IDL.Text, IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
