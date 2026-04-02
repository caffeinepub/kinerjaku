import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type OldEmployeeProfile = {
    id : Principal;
    name : Text;
    nip : Text;
    role : {
      #admin;
      #user;
      #guest;
    };
    desa : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
    createdAt : Time.Time;
  };

  type OldUserProfile = {
    name : Text;
    nip : Text;
    desa : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
  };

  type OldActor = {
    employeeProfiles : Map.Map<Principal, OldEmployeeProfile>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewEmployeeProfile = {
    id : Principal;
    name : Text;
    nip : Text;
    role : {
      #admin;
      #user;
      #guest;
    };
    desa : Text;
    kecamatan : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
    createdAt : Time.Time;
  };

  type NewUserProfile = {
    name : Text;
    nip : Text;
    desa : Text;
    kecamatan : Text;
    latitude : Float;
    longitude : Float;
    address : Text;
  };

  type NewActor = {
    employeeProfiles : Map.Map<Principal, NewEmployeeProfile>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newEmployeeProfiles = old.employeeProfiles.map<Principal, OldEmployeeProfile, NewEmployeeProfile>(
      func(_id, oldProfile) {
        {
          oldProfile with
          kecamatan = "Kecamatan default";
        };
      }
    );

    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_id, oldProfile) {
        {
          oldProfile with
          kecamatan = "Kecamatan default";
        };
      }
    );

    {
      employeeProfiles = newEmployeeProfiles;
      userProfiles = newUserProfiles;
    };
  };
};
