# Push to Backup Repository

To push code to `ShubhamLohar01/Stocktake_backend2.git`:

## Method 1: Using Personal Access Token

1. Create a token from: https://github.com/settings/tokens
   - Select "repo" permissions
   - Copy the token

2. Push with token:
```bash
cd "D:\StockTake module\backend"
git push backup main
# Username: ShubhamLohar01
# Password: [your-personal-access-token]
```

## Method 2: Using Token in URL (One-time)

```bash
git push https://[YOUR_TOKEN]@github.com/ShubhamLohar01/Stocktake_backend2.git main
```

## Method 3: Update Remote URL with Token

```bash
git remote set-url backup https://[YOUR_TOKEN]@github.com/ShubhamLohar01/Stocktake_backend2.git
git push backup main
```

---

**Note:** After successful push, you can remove the token from the URL for security:
```bash
git remote set-url backup https://github.com/ShubhamLohar01/Stocktake_backend2.git
```
