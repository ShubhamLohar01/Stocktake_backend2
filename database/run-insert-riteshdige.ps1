# PowerShell script to insert riteshdige user
# Run this in PowerShell: .\run-insert-riteshdige.ps1

$env:PGPASSWORD = "Candorfoods"
psql -h wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com -p 5432 -U wmsadmin -d warehouse_db -f database\insert_riteshdige_user.sql
