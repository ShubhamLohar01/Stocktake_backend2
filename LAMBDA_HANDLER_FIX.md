# Lambda Handler Error Fix

## Error
```
Runtime.ImportModuleError: Error: Cannot find module 'lambda'
```

## Root Cause
The Lambda handler is configured incorrectly. When Lambda tries to load the handler, it's looking for a module called 'lambda' instead of the file `dist/lambda.js`.

## Solution

### Step 1: Verify Handler Configuration
1. Go to AWS Lambda Console
2. Select your Lambda function
3. Go to **Configuration** → **Runtime settings**
4. Click **Edit**
5. Check the **Handler** field

### Step 2: Set Correct Handler
The handler MUST be set to:
```
dist/lambda.handler
```

**NOT:**
- ❌ `lambda.handler`
- ❌ `lambda.handler.handler`
- ❌ `index.handler`
- ❌ `dist/lambda`

### Step 3: Verify Package Structure
Your `backend-lambda.zip` should contain:
```
backend-lambda.zip
├── dist/
│   ├── lambda.js          ← Handler file must be here
│   ├── index.js
│   └── ...
├── node_modules/
├── prisma/
└── package.json
```

### Step 4: Rebuild Package (If Needed)
If your package doesn't have `dist/lambda.js`, rebuild it:

```powershell
cd "d:\StockTake module\backend"
.\package-lambda.ps1
```

Then upload the new `backend-lambda.zip` to Lambda.

### Step 5: Test Again
After setting the handler correctly, test your Lambda function with a simple health check event.

## Why This Happens

When you set the handler to `lambda.handler`, Lambda tries to:
1. Load a module called `lambda` (which doesn't exist)
2. This causes the "Cannot find module 'lambda'" error

When you set it to `dist/lambda.handler`, Lambda:
1. Loads the file `dist/lambda.js`
2. Accesses the exported `handler` function
3. This works correctly ✅

## Additional Checks

### Verify ES Module Configuration
Your `package.json` should have:
```json
{
  "type": "module"
}
```

And `tsconfig.lambda.json` should have:
```json
{
  "compilerOptions": {
    "module": "ES2020"
  }
}
```

### Check Compiled Output
After building, verify `dist/lambda.js` exists and exports:
```javascript
export const handler = serverless(app, {...});
```

## Still Having Issues?

1. **Check CloudWatch Logs** - Look for more detailed error messages
2. **Verify File Structure** - Unzip your package and check `dist/lambda.js` exists
3. **Check Runtime** - Use Node.js 18.x or 20.x
4. **Verify Environment Variables** - Ensure DATABASE_URL and JWT_SECRET are set
