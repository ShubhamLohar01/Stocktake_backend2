# Lambda Handler Error - Complete Troubleshooting Guide

## Current Error
```
Runtime.ImportModuleError: Error: Cannot find module 'lambda'
```

This error means Lambda is trying to import a module called 'lambda' instead of loading the file `dist/lambda.js`.

## Step-by-Step Fix

### Step 1: Verify Handler in AWS Lambda Console

**CRITICAL:** The handler MUST be exactly: `dist/lambda.handler`

1. Go to AWS Lambda Console
2. Select your function
3. Go to **Configuration** → **Runtime settings**
4. Click **Edit**
5. **Handler field should be:** `dist/lambda.handler`
   - NOT `lambda.handler`
   - NOT `dist/lambda`
   - NOT `lambda.handler.handler`
6. Click **Save**

### Step 2: Verify Package Structure

Run the verification script:
```powershell
cd "d:\StockTake module\backend"
.\verify-lambda-package.ps1
```

This will check if:
- `dist/lambda.js` exists in your package
- The handler is exported correctly
- package.json has correct module type

### Step 3: Rebuild Package (If Needed)

If verification shows issues, rebuild:
```powershell
cd "d:\StockTake module\backend"
.\package-lambda.ps1
```

### Step 4: Re-upload Package

1. Go to Lambda Console → Your Function
2. **Code** tab → **Upload from** → **.zip file**
3. Select `backend-lambda.zip`
4. Click **Save**

### Step 5: Double-Check Handler After Upload

After uploading, verify the handler is still set to `dist/lambda.handler` (sometimes uploads reset it).

## Common Issues

### Issue 1: Handler Resets After Upload
**Solution:** Always verify handler after uploading new code.

### Issue 2: Package Doesn't Have dist/lambda.js
**Symptoms:** Verification script shows missing file
**Solution:** 
- Check that TypeScript compilation succeeded
- Verify `tsconfig.lambda.json` has `"outDir": "./dist"`
- Rebuild package

### Issue 3: ES Module Issues
**Symptoms:** "exports is not defined" or module resolution errors
**Solution:**
- Ensure `package.json` has `"type": "module"`
- Ensure `tsconfig.lambda.json` has `"module": "ES2020"`
- Handler should be `dist/lambda.handler` (not `dist/lambda.mjs.handler`)

### Issue 4: Wrong Runtime
**Solution:** Use Node.js 18.x or 20.x (not 16.x or below)

## Verification Checklist

Before testing, verify:
- [ ] Handler is set to `dist/lambda.handler` in Lambda Console
- [ ] Runtime is Node.js 18.x or 20.x
- [ ] Package contains `dist/lambda.js`
- [ ] `dist/lambda.js` exports `handler`
- [ ] `package.json` has `"type": "module"`
- [ ] Environment variables are set (DATABASE_URL, JWT_SECRET)

## Quick Test Commands

### Check Handler via AWS CLI (if configured):
```powershell
aws lambda get-function-configuration --function-name YOUR_FUNCTION_NAME --query Handler
```

### Update Handler via AWS CLI:
```powershell
aws lambda update-function-configuration --function-name YOUR_FUNCTION_NAME --handler "dist/lambda.handler"
```

## Still Not Working?

1. **Check CloudWatch Logs:**
   - Lambda Console → Monitor → View CloudWatch logs
   - Look for more detailed error messages

2. **Unzip and Inspect Package:**
   ```powershell
   Expand-Archive -Path "backend-lambda.zip" -DestinationPath "temp-check"
   # Check if dist/lambda.js exists
   Get-ChildItem -Recurse temp-check\dist
   ```

3. **Verify File Extension:**
   - With ES modules (`"type": "module"`), files should be `.js` (not `.mjs`)
   - Handler should reference `.js` file: `dist/lambda.handler`

4. **Test with Minimal Handler:**
   Create a test `dist/lambda.js`:
   ```javascript
   export const handler = async (event, context) => {
     return { statusCode: 200, body: JSON.stringify({ message: "test" }) };
   };
   ```

## Expected Success Response

When working correctly, test should return:
```json
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"message\":\"pong\"}"
}
```
