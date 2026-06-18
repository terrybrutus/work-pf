import Cycles "mo:base/ExperimentalCycles";
import Nat "mo:base/Nat";
import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Registry "blob-storage/registry";
import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import List "mo:base/List";
import Array "mo:base/Array";

actor Main {
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var projects = textMap.empty<Text>();
  var revisions = textMap.empty<[(Text, Text)]>();
  var timestamps = textMap.empty<Time.Time>();
  var undoStack = List.nil<[(Text, Text)]>();
  var redoStack = List.nil<[(Text, Text)]>();
  var userProfiles = principalMap.empty<UserProfile>();

  let registry = Registry.new();
  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query func getProjects() : async [(Text, Text)] {
    Iter.toArray(textMap.entries(projects));
  };

  public shared ({ caller }) func addProject(id : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add projects");
    };

    let currentTime = Time.now();
    let currentProjects = Iter.toArray(textMap.entries(projects));

    projects := textMap.put(projects, id, content);
    revisions := textMap.put(revisions, "projects", currentProjects);
    timestamps := textMap.put(timestamps, "projects", currentTime);

    undoStack := List.push(currentProjects, undoStack);
    redoStack := List.nil();
  };

  public shared ({ caller }) func updateProject(id : Text, content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update projects");
    };

    let currentTime = Time.now();
    let currentProjects = Iter.toArray(textMap.entries(projects));

    projects := textMap.put(projects, id, content);
    revisions := textMap.put(revisions, "projects", currentProjects);
    timestamps := textMap.put(timestamps, "projects", currentTime);

    undoStack := List.push(currentProjects, undoStack);
    redoStack := List.nil();
  };

  public shared ({ caller }) func deleteProject(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete projects");
    };

    let currentTime = Time.now();
    let currentProjects = Iter.toArray(textMap.entries(projects));

    projects := textMap.delete(projects, id);
    revisions := textMap.put(revisions, "projects", currentProjects);
    timestamps := textMap.put(timestamps, "projects", currentTime);

    undoStack := List.push(currentProjects, undoStack);
    redoStack := List.nil();
  };

  public shared ({ caller }) func reorderProjects(newOrder : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can reorder projects");
    };

    let currentTime = Time.now();
    let currentProjects = Iter.toArray(textMap.entries(projects));

    let reorderedProjects = Array.map<(Text, Text), (Text, Text)>(
      Array.map<Text, (Text, Text)>(
        newOrder,
        func(id) {
          switch (textMap.get(projects, id)) {
            case (?content) { (id, content) };
            case null { (id, "") };
          };
        },
      ),
      func(entry) { entry },
    );

    projects := textMap.fromIter(Iter.fromArray(reorderedProjects));
    revisions := textMap.put(revisions, "projects", currentProjects);
    timestamps := textMap.put(timestamps, "projects", currentTime);

    undoStack := List.push(currentProjects, undoStack);
    redoStack := List.nil();
  };

  public query func getProjectRevisions() : async ?[(Text, Text)] {
    textMap.get(revisions, "projects");
  };

  public query func getProjectTimestamps() : async ?Time.Time {
    textMap.get(timestamps, "projects");
  };

  public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can register file references");
    };
    Registry.add(registry, path, hash);
  };

  public query func getFileReference(path : Text) : async Registry.FileReference {
    Registry.get(registry, path);
  };

  public query func listFileReferences() : async [Registry.FileReference] {
    Registry.list(registry);
  };

  public shared ({ caller }) func dropFileReference(path : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can drop file references");
    };
    Registry.remove(registry, path);
  };

  public shared ({ caller }) func undo() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can undo changes");
    };

    switch (List.pop(undoStack)) {
      case (null, _) {
        Debug.trap("Nothing to undo");
      };
      case (?previousState, remainingUndoStack) {
        let currentState = Iter.toArray(textMap.entries(projects));
        projects := textMap.fromIter(Iter.fromArray(previousState));
        undoStack := remainingUndoStack;
        redoStack := List.push(currentState, redoStack);
      };
    };
  };

  public shared ({ caller }) func redo() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can redo changes");
    };

    switch (List.pop(redoStack)) {
      case (null, _) {
        Debug.trap("Nothing to redo");
      };
      case (?nextState, remainingRedoStack) {
        let currentState = Iter.toArray(textMap.entries(projects));
        projects := textMap.fromIter(Iter.fromArray(nextState));
        redoStack := remainingRedoStack;
        undoStack := List.push(currentState, undoStack);
      };
    };
  };

  public shared ({ caller }) func save() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can save changes");
    };

    let currentTime = Time.now();
    let currentProjects = Iter.toArray(textMap.entries(projects));

    revisions := textMap.put(revisions, "projects", currentProjects);
    timestamps := textMap.put(timestamps, "projects", currentTime);

    undoStack := List.nil();
    redoStack := List.nil();
  };

  public type UserProfile = {
    name : Text;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    principalMap.get(userProfiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    principalMap.get(userProfiles, user);
  };

type __CAFFEINE_STORAGE_RefillInformation = {
    proposed_top_up_amount: ?Nat;
};

type __CAFFEINE_STORAGE_RefillResult = {
    success: ?Bool;
    topped_up_amount: ?Nat;
};

    public shared (msg) func __CAFFEINE_STORAGE_refillCashier(refill_information: ?__CAFFEINE_STORAGE_RefillInformation) : async __CAFFEINE_STORAGE_RefillResult {
    let cashier = Principal.fromText("72ch2-fiaaa-aaaar-qbsvq-cai");
    
    assert (cashier == msg.caller);
    
    let current_balance = Cycles.balance();
    let reserved_cycles : Nat = 400_000_000_000;
    
    let current_free_cycles_count : Nat = Nat.sub(current_balance, reserved_cycles);
    
    let cycles_to_send : Nat = switch (refill_information) {
        case null { current_free_cycles_count };
        case (?info) {
            switch (info.proposed_top_up_amount) {
                case null { current_free_cycles_count };
                case (?proposed) { Nat.min(proposed, current_free_cycles_count) };
            }
        };
    };

    let target_canister = actor(Principal.toText(cashier)) : actor {
        account_top_up_v1 : ({ account : Principal }) -> async ();
    };
    
    let current_principal = Principal.fromActor(Main);
    
    await (with cycles = cycles_to_send) target_canister.account_top_up_v1({ account = current_principal });
    
    return {
        success = ?true;
        topped_up_amount = ?cycles_to_send;
    };
};
    public shared (msg) func __CAFFEINE_STORAGE_blobsToRemove() : async [Text] {
    await Registry.requireAuthorized(registry, msg.caller, "72ch2-fiaaa-aaaar-qbsvq-cai");
    
    Registry.getBlobsToRemove(registry);
};
    public shared (msg) func __CAFFEINE_STORAGE_blobsRemoved(hashes : [Text]) : async Nat {
    await Registry.requireAuthorized(registry, msg.caller, "72ch2-fiaaa-aaaar-qbsvq-cai");
    
    Registry.clearBlobsRemoved(registry, hashes);
};
    public shared (msg) func __CAFFEINE_STORAGE_updateGatewayPrincipals() : async () {
    await Registry.requireAuthorized(registry, msg.caller, "72ch2-fiaaa-aaaar-qbsvq-cai");
    await Registry.updateGatewayPrincipals(registry, "72ch2-fiaaa-aaaar-qbsvq-cai");
};
};

