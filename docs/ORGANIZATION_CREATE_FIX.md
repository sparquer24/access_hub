# Organization Create API Fix

## Issue
When creating a new organization through `/super-admin/organizations/create`, the API was returning a 400 BAD REQUEST error:

```json
{
  "errors": {
    "is_active": ["Unknown field."],
    "subscription_tier": ["Unknown field."]
  },
  "message": "Validation failed",
  "success": false
}
```

## Root Cause
The frontend was sending `is_active` and `subscription_tier` fields in the create request, but the backend's `OrganizationCreateSchema` doesn't accept these fields during creation.

### Backend Schema Differences

**OrganizationCreateSchema** (for POST /api/v2/organizations):
- Does NOT include: `is_active`, `subscription_tier`
- Organizations are created as active by default with free tier

**OrganizationUpdateSchema** (for PUT /api/v2/organizations/{id}):
- DOES include: `is_active`, `subscription_tier`
- These fields can be modified after creation

## Fix Applied

### 1. Frontend Service (`src/services/organizationsService.js`)
- Modified the `create()` method to strip out `is_active` and `subscription_tier` before sending to API
- Updated JSDoc comments to clarify these fields are not supported on create

```javascript
create: async (payload) => {
  try {
    // Remove fields not supported by the create endpoint
    const { is_active, subscription_tier, ...createPayload } = payload;
    const response = await api.post('/api/v2/organizations', createPayload);
    return response.data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}
```

### 2. Organization Form (`src/components/organizations/OrganizationForm.jsx`)
- Removed `subscription_tier` select field from the create form
- Removed `is_active` checkbox from the create form
- Updated initial form state to exclude these fields
- Added comment explaining why these fields are not included

## Result
✅ Organizations can now be created successfully  
✅ New organizations are created as active by default  
✅ Subscription tier and active status can be modified via the edit/update functionality  

## Testing
To test the fix:
1. Navigate to `/super-admin/organizations/create`
2. Fill in the form with:
   - Name: Test Organization
   - Code: TEST001
   - Organization Type: Office
   - Contact details (optional)
3. Submit the form
4. Should successfully create the organization
5. Use the edit functionality to modify `is_active` or `subscription_tier` if needed

## Files Modified
- `src/services/organizationsService.js` - Updated create method
- `src/components/organizations/OrganizationForm.jsx` - Removed unsupported fields from UI
