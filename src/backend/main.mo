import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  type EmployeeProfile = {
    id : Principal;
    name : Text;
    nip : Text;
    role : AccessControl.UserRole;
    desa : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
    createdAt : Time.Time;
  };

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
  };

  public type UserProfile = {
    name : Text;
    nip : Text;
    desa : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
  };

  module PerformanceRecord {
    public func compareById(a : PerformanceRecord, b : PerformanceRecord) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let performanceRecords = Map.empty<Nat, PerformanceRecord>();
  let employeeProfiles = Map.empty<Principal, EmployeeProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextRecordId = 0;

  // User Profile Functions (required by frontend)
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

  // Employee Profile Functions
  public shared ({ caller }) func createOrUpdateEmployeeProfile(profile : EmployeeProfile) : async () {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);

    // Only admins can create/update employee profiles
    // This prevents users from creating profiles with admin roles or modifying other users
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create or update employee profiles");
    };

    let updatedProfile : EmployeeProfile = {
      profile with
      createdAt = Time.now();
    };
    employeeProfiles.add(profile.id, updatedProfile);
  };

  public query ({ caller }) func getEmployeeProfile(id : Principal) : async ?EmployeeProfile {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);

    switch (employeeProfiles.get(id)) {
      case (null) { null };
      case (?profile) {
        if (
          (callerRole == #admin) or (caller == id)
        ) {
          ?profile;
        } else {
          Runtime.trap("Unauthorized to view this profile");
        };
      };
    };
  };

  // Performance Record Functions
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
    // Authorization: Only the employee themselves or an admin can create performance records
    let callerRole = AccessControl.getUserRole(accessControlState, caller);
    if (not (callerRole == #admin or caller == recordInput.employeeId)) {
      Runtime.trap("Unauthorized: Employees can only create their own performance records");
    };

    switch (employeeProfiles.get(recordInput.employeeId)) {
      case (null) { Runtime.trap("Employee profile does not exist") };
      case (?employeeProfile) {
        let percentage = if (recordInput.target != 0) {
          (recordInput.realisasi.toFloat()) / (recordInput.target.toFloat()) * 100.0 : Float;
        } else { 0.0 };

        let newRecord : PerformanceRecord = {
          recordInput with
          id = nextRecordId;
          percentage;
          createdAt = Time.now();
        };

        performanceRecords.add(nextRecordId, newRecord);
        nextRecordId += 1;
        newRecord.id;
      };
    };
  };

  public query ({ caller }) func getPerformanceRecordsByEmployee(employeeId : Principal) : async [PerformanceRecord] {
    let callerRole = AccessControl.getUserRole(accessControlState, caller);

    if (
      (callerRole == #admin) or (caller == employeeId)
    ) {
      let records = performanceRecords.values().toArray().sort(PerformanceRecord.compareById);
      records.filter(func(record) { record.employeeId == employeeId });
    } else {
      Runtime.trap("Unauthorized to view these records");
    };
  };

  public query ({ caller }) func getAllPerformanceRecords() : async [PerformanceRecord] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all records");
    };
    performanceRecords.values().toArray().sort(PerformanceRecord.compareById);
  };

  // Get all employee profiles (admin only)
  public query ({ caller }) func getAllEmployeeProfiles() : async [EmployeeProfile] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all employee profiles");
    };
    employeeProfiles.values().toArray();
  };

  // Delete Performance Record (admin or owner)
  public shared ({ caller }) func deletePerformanceRecord(recordId : Nat) : async () {
    switch (performanceRecords.get(recordId)) {
      case (null) { Runtime.trap("Record not found") };
      case (?record) {
        let callerRole = AccessControl.getUserRole(accessControlState, caller);
        if (
          (callerRole == #admin) or (caller == record.employeeId)
        ) {
          performanceRecords.remove(recordId);
        } else {
          Runtime.trap("Unauthorized to delete this record");
        };
      };
    };
  };

};
