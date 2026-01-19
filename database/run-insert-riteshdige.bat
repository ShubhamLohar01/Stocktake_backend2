@echo off
REM Run this batch file to insert riteshdige user into database

psql -h wms-postgres-db.cpis084golp7.ap-south-1.rds.amazonaws.com -p 5432 -U wmsadmin -d warehouse_db -f database\insert_riteshdige_user.sql

pause
