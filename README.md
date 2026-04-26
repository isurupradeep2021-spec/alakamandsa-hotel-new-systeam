# Hotel Payroll Management System (Spring Boot + React)

Full-stack project with:
- Role-based login (`SUPER_ADMIN`, `MANAGER`, `STAFF_MEMBER`, `CUSTOMER`, `RESTAURANT_MANAGER`, `EVENT_MANAGER`)
- Staff/User management (CRUD + soft delete)
- Payroll auto calculation
- Dashboard summary
- Audit logging
- Search/filter + pagination
- CSV export for payroll report
- PDF export for payroll report
- Profile management + password change
- Attendance calendar preview

## Project Structure
- `/Users/isurupradeep/Documents/hotel-payroll-system/backend` - Spring Boot API + MySQL
- `/Users/isurupradeep/Documents/hotel-payroll-system/frontend` - React UI (Vite)

## Backend Run
1. Open `/Users/isurupradeep/Documents/hotel-payroll-system/backend` in IntelliJ.
2. Ensure MySQL is running.
3. Check DB config in `/Users/isurupradeep/Documents/hotel-payroll-system/backend/src/main/resources/application.properties`.
4. Run app from `HotelPayrollApplication`.

Or terminal:
```bash
cd /Users/isurupradeep/Documents/hotel-payroll-system/backend
mvn spring-boot:run
```

Backend URL: `http://localhost:8088`

## Frontend Run
```bash
cd /Users/isurupradeep/Documents/hotel-payroll-system/frontend
npm install
npm run dev
```
Frontend URL: `http://localhost:5174`

## Default Login Accounts
Password for all seeded users: `Password@123`
- `superadmin` -> `SUPER_ADMIN`
- `manager` -> `MANAGER`
- `staff` -> `STAFF_MEMBER`
- `customer` -> `CUSTOMER`
- `restaurant-manager` -> `RESTAURANT_MANAGER`
- `event-manager` -> `EVENT_MANAGER`

## Payroll Logic
- `OvertimePay = overtimeHours * overtimeRate`
- `Deductions = (absentDays * dailyRate) + tax(10% of (basic + overtime))`
- `NetSalary = basicSalary + overtimePay - deductions`

## Key API Endpoints
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/dashboard/summary`
- `GET /api/staff?name=&page=0&size=10`
- `POST /api/staff`
- `PUT /api/staff/{id}`
- `DELETE /api/staff/{id}` (soft delete)
- `POST /api/payroll/calculate`
- `GET /api/payroll`
- `GET /api/payroll/my`
- `GET /api/payroll/export/csv`
- `GET /api/payroll/export/pdf`
- `GET /api/users/me`
- `PUT /api/users/me`
- `POST /api/users/me/change-password`






npm init -y
npm install express mongoose cors dotenv
install nodemon --save-dev
Nom run dev  
npm install mongodb 
npm run dev  
npm create vite@latest
