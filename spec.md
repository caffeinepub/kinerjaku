# KinerjaKu

## Current State
Backend `EmployeeProfile` and `UserProfile` do NOT have a `kecamatan` field. The registration form collects kecamatan but never saves it to the backend. The map geocodes using only `desa` name which often fails, resulting in 0 markers visible.

## Requested Changes (Diff)

### Add
- `kecamatan` field (Text) to `EmployeeProfile` type
- `kecamatan` field (Text) to `UserProfile` type  
- Map now groups/filters by kecamatan AND desa
- Geocoding uses `desa + kecamatan + Indonesia` for better accuracy

### Modify
- `createOrUpdateEmployeeProfile` accepts kecamatan
- `saveCallerUserProfile` accepts kecamatan in UserProfile
- `adminUpdateUserProfile` accepts kecamatan
- Frontend registration saves kecamatan to backend
- Admin panel shows kecamatan column
- LeafletMap uses kecamatan for geocoding query and filter dropdown

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend with kecamatan in EmployeeProfile and UserProfile
2. Update IDL bindings (backend.d.ts, declarations)
3. Update LeafletMap to use kecamatan for geocoding and filtering
4. Update AdminPage to show kecamatan in employee table
5. Update RegisterPage to save kecamatan to backend
6. Update DashboardPage to save kecamatan in user profile
