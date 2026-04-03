import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  // ── Types ──────────────────────────────────────────────────────────────────

  type EmployeeProfile = {
    id : Principal;
    name : Text;
    nip : Text;
    role : AccessControl.UserRole;
    desa : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
    kecamatan : Text;
    createdAt : Time.Time;
  };

  // V1: original type (kept for migration)
  type PerformanceRecordV1 = {
    id : Nat;
    employeeId : Principal;
    employeeName : Text;
    task : Text;
    target : Nat;
    realisasi : Nat;
    percentage : Float;
    score : Text;
    date : Text;
    fileBuktiUrl : ?Text;
    createdAt : Time.Time;
  };

  // V2: includes adminFeedback/adminRating and fileBuktiUrl
  type PerformanceRecord = {
    id : Nat;
    employeeId : Principal;
    employeeName : Text;
    task : Text;
    target : Nat;
    realisasi : Nat;
    percentage : Float;
    score : Text;
    date : Text;
    fileBuktiUrl : ?Text;
    createdAt : Time.Time;
    adminFeedback : ?Text;
    adminRating : ?Text;
  };

  public type UserProfile = {
    name : Text;
    nip : Text;
    desa : Text;
    kecamatan : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
  };

  module PerformanceRecord {
    public func compareById(a : PerformanceRecord, b : PerformanceRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // ── Stable state ───────────────────────────────────────────────────────────

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Keep V1 stable var to satisfy migration (explicit discard via postupgrade)
  let performanceRecords = Map.empty<Nat, PerformanceRecordV1>();
  let performanceRecordsV2 = Map.empty<Nat, PerformanceRecord>();

  let employeeProfiles = Map.empty<Principal, EmployeeProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextRecordId = 0;

  system func postupgrade() {
    // Migrate V1 records into V2 if V2 is empty
    if (performanceRecordsV2.size() == 0 and performanceRecords.size() > 0) {
      for ((id, rec) in performanceRecords.entries()) {
        performanceRecordsV2.add(
          id,
          {
            id = rec.id;
            employeeId = rec.employeeId;
            employeeName = rec.employeeName;
            task = rec.task;
            target = rec.target;
            realisasi = rec.realisasi;
            percentage = rec.percentage;
            score = rec.score;
            date = rec.date;
            fileBuktiUrl = rec.fileBuktiUrl;
            createdAt = rec.createdAt;
            adminFeedback = null;
            adminRating = null;
          },
        );
      };
    };
  };

  // ── User Profile functions ─────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Employee Profile functions ─────────────────────────────────────────────

  public shared ({ caller }) func createOrUpdateEmployeeProfile(profile : EmployeeProfile) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create or update employee profiles");
    };
    employeeProfiles.add(profile.id, { profile with createdAt = Time.now() });
  };

  public query ({ caller }) func getEmployeeProfile(id : Principal) : async ?EmployeeProfile {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);
    switch (employeeProfiles.get(id)) {
      case (null) { null };
      case (?profile) {
        if ((callerRole == #admin) or (caller == id)) { ?profile } else {
          Runtime.trap("Unauthorized to view this profile");
        };
      };
    };
  };

  // ── Performance Record functions ───────────────────────────────────────────

  public shared ({ caller }) func createPerformanceRecord(recordInput : {
    employeeId : Principal;
    employeeName : Text;
    task : Text;
    target : Nat;
    realisasi : Nat;
    score : Text;
    date : Text;
    fileBuktiUrl : ?Text;
  }) : async Nat {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);
    if (not (callerRole == #admin or caller == recordInput.employeeId)) {
      Runtime.trap("Unauthorized: Employees can only create their own performance records");
    };

    let hasUserProfile = switch (userProfiles.get(recordInput.employeeId)) {
      case (null) { false }; case (?_) { true };
    };
    let hasEmployeeProfile = switch (employeeProfiles.get(recordInput.employeeId)) {
      case (null) { false }; case (?_) { true };
    };
    if (not (hasUserProfile or hasEmployeeProfile)) {
      Runtime.trap("Profil pegawai tidak ditemukan. Silakan lengkapi profil terlebih dahulu.");
    };

    let percentage = if (recordInput.target != 0) {
      (recordInput.realisasi.toFloat()) / (recordInput.target.toFloat()) * 100.0 : Float;
    } else { 0.0 };

    let newRecord : PerformanceRecord = {
      id = nextRecordId;
      employeeId = recordInput.employeeId;
      employeeName = recordInput.employeeName;
      task = recordInput.task;
      target = recordInput.target;
      realisasi = recordInput.realisasi;
      score = recordInput.score;
      date = recordInput.date;
      fileBuktiUrl = recordInput.fileBuktiUrl;
      percentage;
      createdAt = Time.now();
      adminFeedback = null;
      adminRating = null;
    };

    performanceRecordsV2.add(nextRecordId, newRecord);
    nextRecordId += 1;
    newRecord.id;
  };

  public shared ({ caller }) func updatePerformanceRecord(
    recordId : Nat,
    task : Text,
    target : Nat,
    realisasi : Nat,
    score : Text,
    date : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can edit performance records");
    };
    switch (performanceRecordsV2.get(recordId)) {
      case (null) { Runtime.trap("Record not found") };
      case (?record) {
        let percentage = if (target != 0) {
          (realisasi.toFloat()) / (target.toFloat()) * 100.0 : Float;
        } else { 0.0 };
        performanceRecordsV2.add(recordId, {
          record with
          task;
          target;
          realisasi;
          score;
          date;
          percentage;
        });
      };
    };
  };

  public shared ({ caller }) func updateRecordFeedback(
    recordId : Nat,
    adminFeedback : ?Text,
    adminRating : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can provide feedback");
    };
    switch (performanceRecordsV2.get(recordId)) {
      case (null) { Runtime.trap("Record not found") };
      case (?record) {
        performanceRecordsV2.add(recordId, { record with adminFeedback; adminRating });
      };
    };
  };

  public query ({ caller }) func getPerformanceRecordsByEmployee(
    employeeId : Principal
  ) : async [PerformanceRecord] {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);
    if ((callerRole == #admin) or (caller == employeeId)) {
      performanceRecordsV2
        .values()
        .toArray()
        .sort(PerformanceRecord.compareById)
        .filter(func(r) { r.employeeId == employeeId });
    } else {
      Runtime.trap("Unauthorized to view these records");
    };
  };

  public query ({ caller }) func getAllPerformanceRecords() : async [PerformanceRecord] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all records");
    };
    performanceRecordsV2.values().toArray().sort(PerformanceRecord.compareById);
  };

  public query ({ caller }) func getAllEmployeeProfiles() : async [EmployeeProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all employee profiles");
    };
    employeeProfiles.values().toArray();
  };

  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all user profiles");
    };
    userProfiles.entries().toArray();
  };

  public shared ({ caller }) func deletePerformanceRecord(recordId : Nat) : async () {
    switch (performanceRecordsV2.get(recordId)) {
      case (null) { Runtime.trap("Record not found") };
      case (?record) {
        let callerRole = AccessControl.getUserRole(accessControlState, caller);
        if ((callerRole == #admin) or (caller == record.employeeId)) {
          performanceRecordsV2.remove(recordId);
        } else {
          Runtime.trap("Unauthorized to delete this record");
        };
      };
    };
  };

  public shared ({ caller }) func deleteEmployeeProfile(id : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete employee profiles");
    };
    employeeProfiles.remove(id);
  };

  public shared ({ caller }) func deleteUserProfile(id : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete user profiles");
    };
    userProfiles.remove(id);
  };

  public shared ({ caller }) func adminUpdateUserProfile(id : Principal, profile : UserProfile) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update user profiles");
    };
    userProfiles.add(id, profile);
  };
};
