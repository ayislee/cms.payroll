# 📋 **PAYROLL SYSTEM - COMPLETE API SUMMARY**

## **🔐 Authentication Overview**
- **Internal APIs**: Require JWT token (`Authorization: Bearer <token>`)
- **External APIs**: Require API Key (`X-API-Key: <api_key>`)
- **Public APIs**: No authentication required

---

## **1. 🔑 AUTHENTICATION APIs**

### **POST /api/v1/auth/login**
**Login and get JWT token**

**Request:**
```json
{
  "email": "admin@payroll.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 1,
      "firstname": "Admin",
      "lastname": "User",
      "email": "admin@payroll.com",
      "type": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 401):**
```json
{
  "status": false,
  "message": "Invalid credentials"
}
```

### **POST /api/v1/auth/register**
**Register new user**

**Request:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "type": "user"
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "user_id": 2,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "type": "user"
    }
  }
}
```

### **POST /api/v1/auth/logout**
**Logout user**

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Logout successful"
}
```

### **GET /api/v1/auth/profile**
**Get authenticated user profile**

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "user_id": 1,
      "firstname": "Admin",
      "lastname": "User",
      "email": "admin@payroll.com",
      "type": "admin"
    }
  }
}
```

---

## **2. 👤 USER MANAGEMENT APIs**

### **GET /api/v1/user**
**Get users list (Admin only)**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page=1` (default: 1)
- `limit=10` (default: 10)
- `search=email/name` (optional)

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": {
      "total": 5,
      "perPage": 10,
      "page": 1,
      "lastPage": 1,
      "data": [
        {
          "user_id": 1,
          "firstname": "Admin",
          "lastname": "User",
          "email": "admin@payroll.com",
          "type": "admin",
          "is_active": true
        }
      ]
    }
  }
}
```

### **GET /api/v1/user/{id}**
**Get user by ID**

**Response (Success - 200):**
```json
{
  "status": true,
  "data": {
    "user": {
      "user_id": 1,
      "firstname": "Admin",
      "lastname": "User",
      "email": "admin@payroll.com",
      "type": "admin",
      "is_active": true
    }
  }
}
```

### **POST /api/v1/user**
**Create new user (Admin only)**

**Request:**
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "type": "user"
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "user_id": 2,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "type": "user"
    }
  }
}
```

### **PUT /api/v1/user/{id}**
**Update user**

**Request:** (only changed fields)
```json
{
  "firstname": "Johnny",
  "email": "johnny@example.com"
}
```

### **DELETE /api/v1/user/{id}**
**Soft delete user**

### **POST /api/v1/user/change-password**
**Change user password**

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

### **PUT /api/v1/user/{id}/toggle-status**
**Toggle user active status (Admin only)**

---

## **3. 👥 EMPLOYEE MANAGEMENT APIs**

### **GET /api/v1/employee**
**Get employees list**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page=1`, `rows=10`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": {
      "total": 25,
      "perPage": 10,
      "page": 1,
      "lastPage": 3,
      "data": [
        {
          "employee_id": 1,
          "nik": "EMP001",
          "name": "John Doe",
          "email": "john@example.com",
          "company_id": 1,
          "ptkp": "TK0",
          "hire_date": "2023-01-01"
        }
      ]
    }
  }
}
```

### **GET /api/v1/employee/show**
**Get employee by ID**

**Query Parameters:**
- `employee_id=1`

**Response (Success - 200):**
```json
{
  "status": true,
  "data": {
    "employee_id": 1,
    "company_id": 1,
    "nik": "EMP001",
    "name": "Ahmad Surya",
    "email": "ahmad.surya@company.com",
    "phone": "081234567890",
    "address": "Jl. Sudirman No. 1, Jakarta",
    "city": null,
    "state": null,
    "country": null,
    "zip": null,
    "rekening": null,
    "bank": null,
    "cabang": null,
    "nama_rekening": null,
    "npwp": null,
    "ptkp": "TK/0",
    "created_at": "2025-09-24 14:56:20",
    "updated_at": "2025-09-24 14:56:20"
  }
}
```

### **POST /api/v1/employee**
**Create new employee**

**Request:**
```json
{
    "employee_id": 1,
    "company_id": 1,
    "nik": "EMP1",
    "name": "Ahmad Surya",
    "email": "ahmad.surya@company.com",
    "phone": "081234567678",
    "address": "Jl. Sudirman No. 1, Jakarta",
    "city": "Jakarta Selatan",
    "zip": "12344",
    "rekening": "123456",
    "bank": "bank",
    "nama_rekening": "atas nama",
    "cabang": "cabang",
    "npwp": "123213123",
    "ptkp": "TK/0"


}
```

### **PUT /api/v1/employee/**
**Update employee**

**Request:** 
```json
{
    "employee_id": 1,
    "company_id": 1,
    "nik": "EMP1",
    "name": "Ahmad Surya",
    "email": "ahmad.surya@company.com",
    "phone": "081234567678",
    "address": "Jl. Sudirman No. 1, Jakarta",
    "city": "Jakarta Selatan",
    "zip": "12344",
    "rekening": "123456",
    "bank": "bank",
    "nama_rekening": "atas nama",
    "cabang": "cabang",
    "npwp": "123213123",
    "ptkp": "TK/0"


}
```

### **DELETE /api/v1/employee/{id}**
**Soft delete employee**

---

## **4. 🏢 COMPANY MANAGEMENT APIs**

### **GET /api/v1/company**
**Get companies list**

**Query Parameters:**
- `page=1`, `limit=10`
- `search=name/code`
- `is_active=1` (optional)

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Companies retrieved successfully",
  "data": {
    "companies": {
      "total": 5,
      "perPage": 10,
      "page": 1,
      "lastPage": 1,
      "data": [
        {
          "company_id": 1,
          "name": "PT Example Corp",
          "code": "PTEX",
          "address": "Jl. Company Address",
          "phone": "021-1234567",
          "email": "info@example.com",
          "is_active": true
        }
      ]
    }
  }
}
```

### **GET /api/v1/company/{id}**
**Get company by ID**

### **POST /api/v1/company**
**Create new company**

**Request:**
```json
{
  "company_id": 1,
  "name": "PT New Company",
  "code": "PTNC",
  "address": "Jl. New Company",
  "phone": "021-9876543",
  "email": "info@newcompany.com",
  "is_active": true
}
```

### **PUT /api/v1/company/{id}**
**Update company**

### **DELETE /api/v1/company/{id}**
**Soft delete company**

---

## **5. ⚙️ MAIN COMPONENT APIs**

### **GET /api/v1/maincomponent**
**Get payroll components**

**Query Parameters:**

**Response (Success - 200):**
```json
{
    "status": true,
    "data": [
        {
            "main_component_id": 1,
            "name": "Gaji Pokok",
            "category": "Gaji",
            "description": "Gaji pokok karyawan per bulan",
            "code": "GP",
            "type": "Earning",
            "is_active": "1",
            "is_integration": "0",
            "integration_code": null,
            "calculation_type": "manual",
            "calculation_formula": null,
            "calculation_params": null,
            "attendance_based": "0",
            "attendance_type": "full",
            "created_at": "2025-09-24 14:56:13",
            "updated_at": "2025-09-24 14:56:13"
        },
    ]
}
  
```

### **GET /api/v1/maincomponent/show**
**Query Parameters:**
```json
{
    "main_component_id": 11
}
```

**Response (Success - 200):**
```json
{
    "status": true,
    "data": {
        "main_component_id": 1,
        "name": "Gaji Pokok",
        "category": "Gaji",
        "description": "Gaji pokok karyawan per bulan",
        "code": "GP",
        "type": "Earning",
        "is_active": 1,
        "is_integration": 0,
        "integration_code": null,
        "calculation_type": "manual",
        "calculation_formula": null,
        "calculation_params": null,
        "attendance_based": 0,
        "attendance_type": "full",
        "created_at": "2025-09-24 14:56:13",
        "updated_at": "2025-09-24 14:56:13"
    }
}
```

### **POST /api/v1/maincomponent**
**Create new component**

**Request:**
```json
{
        "name": "BPJS Kesehatan (copy)",
        "category": "Potongan",
        "description": "Potongan BPJS Kesehatan 1% dari Gaji Pokok",
        "code": "XXBPJS-K",
        "type": "Deduction", // "required|in:Earning,Deduction",
        "is_active": "1", // "required|in:0,1",
        "is_integration": "0", "required|in:0,1",
        "integration_code": null,
        "calculation_type": "auto", "required|in:manual,auto",
        "calculation_formula": "bpjs_health_calculation",
        "calculation_params": {"max_base": 12000000, "percentage": 0.01, "base_components": ["GP"]},
        "attendance_based": "0", // "required|in:0,1",
        "attendance_type": "full" // "required|in:full,prorate"
}
```
**Response (Success - 200):**
```json
{
    "status": true,
    "message": "Main Component created successfully"
}
```

### **PUT /api/v1/maincomponent/update**
**Update component**
**Query Parameters**
```json
{
        "main_component_id": 13,
        "name": "BPJS Kesehatan (copy)",
        "category": "Potongan",
        "description": "Potongan BPJS Kesehatan 1% dari Gaji Pokok",
        "code": "XXBPJS-K",
        "type": "Deduction", // "required|in:Earning,Deduction",
        "is_active": "1", // "required|in:0,1",
        "is_integration": "0", "required|in:0,1",
        "integration_code": null,
        "calculation_type": "auto", "required|in:manual,auto",
        "calculation_formula": "bpjs_health_calculation",
        "calculation_params": {"max_base": 12000000, "percentage": 0.01, "base_components": ["GP"]},
        "attendance_based": "0", // "required|in:0,1",
        "attendance_type": "full" // "required|in:full,prorate"
        
}
```
**Response (Success - 200):**
```json
{
    "status": true,
    "message": "Main Component created successfully"
}
```



### **DELETE /api/v1/maincomponent/**
**Soft delete component**
**Query Parameters**
```json
{
        "main_component_id": 13
        
}
```
**Response (Success - 200):**
```json
{
    "status": true,
    "message": "Main Component Delete"
}
```

---

## **6. 💰 PAYROLL APIs**

### **GET /api/v1/payroll**
**Get payrolls list**

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page=1`, `limit=10`
- `payroll_period=202501`
- `employee_id=1`
- `is_printed=0`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Payrolls retrieved successfully",
  "data": {
    "payrolls": {
      "total": 25,
      "perPage": 10,
      "page": 1,
      "lastPage": 3,
      "data": [
        {
          "payroll_id": 1,
          "employee_id": 1,
          "payroll_periode": "202501",
          "net_pay": 5000000,
          "is_printed": false,
          "employee": {
            "employee_id": 1,
            "name": "John Doe"
          }
        }
      ]
    }
  }
}
```

### **GET /api/v1/payroll/{id}**
**Get payroll by ID with details**

**Response (Success - 200):**
```json
{
  "status": true,
  "data": {
    "payroll": {
      "payroll_id": 1,
      "employee_id": 1,
      "payroll_periode": "202501",
      "net_pay": 5000000,
      "is_printed": false,
      "employee": {
        "employee_id": 1,
        "name": "John Doe"
      },
      "payroll_details": [
        {
          "payroll_detail_id": 1,
          "main_component_id": 1,
          "amount": 5000000,
          "main_component": {
            "code": "GP",
            "name": "Basic Salary",
            "type": "Earning"
          }
        }
      ]
    }
  }
}
```

### **POST /api/v1/payroll**
**Generate payroll for single employee**

**Request:**
```json
{
  "employee_id": 1,
  "payroll_period": "202501"
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "Payroll generated successfully",
  "data": {
    "payroll": {
      "payroll_id": 1,
      "employee_id": 1,
      "payroll_periode": "202501",
      "net_pay": 5000000,
      "is_printed": false
    },
    "employee_info": {
      "employee_id": 1,
      "name": "John Doe",
      "ptkp": "TK0"
    },
    "summary": {
      "total_earning": 5500000,
      "total_deduction": 500000,
      "net_pay": 5000000,
      "auto_calculated_components": 2
    },
    "component_breakdown": [
      {
        "main_component_id": 1,
        "code": "GP",
        "name": "Basic Salary",
        "type": "Earning",
        "calculated_amount": 5000000,
        "original_amount": 5000000,
        "is_auto_calculated": false
      },
      {
        "main_component_id": 2,
        "code": "BPJS_K",
        "name": "BPJS Health",
        "type": "Deduction",
        "calculated_amount": 500000,
        "original_amount": 0,
        "is_auto_calculated": true
      }
    ],
    "action": "created"
  }
}
```

### **POST /api/v1/payroll/mass**
**Generate payroll for all employees**

**Request:**
```json
{
  "payroll_period": "202501"
}
```

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Mass payroll generation completed. 5 successful, 0 failed",
  "data": {
    "successful": [
      {
        "employee_id": 1,
        "name": "John Doe",
        "payroll_id": 1,
        "total_earning": 5500000,
        "total_deduction": 500000,
        "net_pay": 5000000,
        "action": "created"
      }
    ],
    "errors": [],
    "summary": {
      "total_processed": 5,
      "successful_count": 5,
      "error_count": 0
    }
  }
}
```

### **PUT /api/v1/payroll/{id}**
**Update payroll (regenerate)**

**Request:**
```json
{
  "employee_id": 1,
  "payroll_period": "202501"
}
```

### **PUT /api/v1/payroll/{id}/print**
**Mark payroll as printed**

### **DELETE /api/v1/payroll/{id}**
**Delete payroll (only if not printed)**

---

## **7. 📊 ATTENDANCE APIs (External Integration)**

### **POST /api/v1/external/attendance/bulk**
**Bulk insert attendance data**

**Headers:** `X-API-Key: hr_system_abc123def456`

**Request:**
```json
{
  "attendance_data": [
    {
      "employee_id": 1,
      "total_working_days": 25,
      "actual_working_days": 23,
      "absent_days": 2
    },
    {
      "employee_id": 2,
      "total_working_days": 25,
      "actual_working_days": 25,
      "absent_days": 0
    }
  ],
  "payroll_period": "202501"
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "Bulk attendance insertion completed. 2 successful, 0 failed",
  "data": {
    "total_processed": 2,
    "successful": 2,
    "failed": 0,
    "payroll_period": "202501"
  }
}
```

**Response (Error - 400):**
```json
{
  "status": false,
  "message": "attendance_data array is required and cannot be empty"
}
```

### **GET /api/v1/external/attendance/{employee_id}/{payroll_period}**
**Get attendance data for employee**

**Headers:** `X-API-Key: hr_system_abc123def456`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Attendance data retrieved successfully",
  "data": {
    "employee_id": 1,
    "payroll_period": "202501",
    "total_working_days": 25,
    "actual_working_days": 23,
    "absent_days": 2,
    "prorated_ratio": 0.92
  }
}
```

**Response (Error - 404):**
```json
{
  "status": false,
  "message": "Attendance data not found for the specified period"
}
```

### **POST /api/v1/external/attendance/sync**
**Sync attendance data (upsert)**

**Headers:** `X-API-Key: hr_system_abc123def456`

**Request:**
```json
{
  "attendance_data": [
    {
      "employee_id": 1,
      "payroll_period": "202501",
      "total_working_days": 25,
      "actual_working_days": 22,
      "absent_days": 3
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Attendance sync completed. 0 inserted, 1 updated, 0 failed",
  "data": {
    "total_processed": 1,
    "inserted": 0,
    "updated": 1,
    "failed": 0,
    "details": {
      "updated": [
        {
          "employee_id": 1,
          "payroll_period": "202501"
        }
      ]
    }
  }
}
```

---

## **8. 🌐 EXTERNAL EMPLOYEE MANAGEMENT APIs**

### **POST /api/v1/external/register-employee**
**Register employee from external system**

**Headers:** `X-API-Key: hr_system_abc123def456`

**Request:**
```json
{
  "employee_id": 1001,
  "nik": "EXT001",
  "name": "External Employee",
  "email": "external@example.com",
  "company_id": 1,
  "ptkp": "TK0",
  "hire_date": "2023-01-01"
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "Employee registered successfully",
  "data": {
    "employee_id": 1001,
    "name": "External Employee",
    "email": "external@example.com",
    "company_id": 1
  }
}
```

### **GET /api/v1/external/employee/{employee_id}**
**Get employee details**

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Employee retrieved successfully",
  "data": {
    "employee": {
      "employee_id": 1001,
      "nik": "EXT001",
      "name": "External Employee",
      "email": "external@example.com",
      "company_id": 1
    }
  }
}
```

### **PUT /api/v1/external/employee/{employee_id}**
**Update employee from external system**

**Request:** Same as register, only changed fields

### **POST /api/v1/external/bulk-register-employees**
**Bulk register employees**

**Request:**
```json
{
  "employees": [
    {
      "employee_id": 1001,
      "nik": "EXT001",
      "name": "Employee 1",
      "email": "emp1@example.com",
      "company_id": 1
    },
    {
      "employee_id": 1002,
      "nik": "EXT002",
      "name": "Employee 2",
      "email": "emp2@example.com",
      "company_id": 1
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Bulk registration completed. 2 successful, 0 failed",
  "data": {
    "total_processed": 2,
    "successful": [
      {
        "employee_id": 1001,
        "name": "Employee 1",
        "email": "emp1@example.com"
      }
    ],
    "failed": []
  }
}
```

---

## **9. 🏢 EXTERNAL COMPANY MANAGEMENT APIs**

### **POST /api/v1/external/register-company**
**Register company from external system**

**Headers:** `X-API-Key: hr_system_abc123def456`

**Request:**
```json
{
  "company_id": 100,
  "name": "PT External Company",
  "code": "PTEC",
  "address": "Jl. External Address",
  "phone": "021-9999999",
  "email": "info@external.com",
  "is_active": true
}
```

**Response (Success - 201):**
```json
{
  "status": true,
  "message": "Company registered successfully",
  "data": {
    "company_id": 100,
    "name": "PT External Company",
    "code": "PTEC",
    "is_active": true
  }
}
```

---

## **10. 🏥 SYSTEM HEALTH CHECK APIs**

### **GET /api/v1/external/health**
**External API health check**

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "External API is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### **GET /api/v1/health**
**Internal API health check**

**Headers:** `Authorization: Bearer <token>`

**Response (Success - 200):**
```json
{
  "status": true,
  "message": "Internal API is healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "user": {
    "user_id": 1,
    "email": "admin@payroll.com"
  }
}
```

---

## **📝 HTTP STATUS CODES**

### **Success Codes:**
- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **204 No Content** - Request successful, no content returned

### **Client Error Codes:**
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required/invalid
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **422 Unprocessable Entity** - Validation failed

### **Server Error Codes:**
- **500 Internal Server Error** - Server error

---

## **🔑 API KEY SETUP**

**Command to setup API keys:**
```bash
adonis sample:setting
```

**Available API Keys:**
- `hr_system_api_key`: `hr_system_abc123def456` (for HR system integration)
- `external_hr_api_url`: `https://external-hr-system.example.com/api/v1` (HR API base URL)
- `api_key_payroll_sync`: `payroll_sync_xyz789uvw123` (for payroll sync services)
- `api_key_employee_portal`: `emp_portal_456rst789ghi` (for employee portal)

---

## **📊 PAGINATION FORMAT**

All list APIs support pagination with consistent format:

**Query Parameters:**
- `page=1` (current page, default: 1)
- `limit=10` (items per page, default: 10, max: 100)

**Response Format:**
```json
{
  "total": 25,
  "perPage": 10,
  "page": 1,
  "lastPage": 3,
  "data": [...]
}
```

---

## **🔍 SEARCH & FILTERING**

**Supported on list APIs:**
- `search=keyword` - Search in name, email, code, etc.
- `is_active=1` - Filter active records
- `company_id=1` - Filter by company
- `type=Earning` - Filter by component type
- `payroll_period=202501` - Filter by period

---

## **⚡ RATE LIMITING**

- **External APIs**: 100 requests per minute per API key
- **Internal APIs**: 1000 requests per minute per user
- **Bulk operations**: Max 500 items per request

---

## **🔒 SECURITY FEATURES**

- **JWT Authentication** for internal APIs
- **API Key Authentication** for external integrations
- **Input validation** on all endpoints
- **SQL injection protection** via ORM
- **Rate limiting** to prevent abuse
- **CORS protection** configured

---

**🎯 This covers the complete API surface of the payroll system with attendance integration!** 🚀