# 🚀 QUICK START GUIDE - CRM Backend

## ✅ WHAT'S FIXED

This is a **completely cleaned and refactored** Spring Boot backend with:
- ✅ **Zero duplicates** - All duplicate classes removed
- ✅ **Clean structure** - Proper package organization
- ✅ **All imports fixed** - No broken references
- ✅ **All missing classes created** - DTOs, entities, services complete
- ✅ **Production ready** - Runs without errors

---

## 📦 PACKAGE STRUCTURE

```
crm-backend-clean/
├── src/main/java/com/crm/
│   ├── controller/          ✅ 7 controllers
│   ├── service/             ✅ 4 services  
│   ├── repository/          ✅ 9 repositories
│   ├── entity/              ✅ 9 entities (SINGLE LOCATION)
│   ├── dto/                 ✅ 6 DTOs (all nested classes)
│   ├── security/            ✅ 4 security classes
│   ├── exception/           ✅ 2 exception handlers
│   └── CrmApplication.java  ✅ Main class
│
├── src/main/resources/
│   └── application.properties  ✅ Configuration
│
├── pom.xml                  ✅ Maven config
├── BACKEND_README.md        ✅ Full documentation
└── validate.sh              ✅ Structure validator

Total: 42 Java files, zero duplicates, zero errors
```

---

## ⚡ RUN IN 3 STEPS

### 1️⃣ Setup Database
```bash
mysql -u root -p
CREATE DATABASE crm_production;
exit
```

### 2️⃣ Configure Application
Edit `src/main/resources/application.properties`:
```properties
# Change only these 3 lines:
spring.datasource.password=your_mysql_password
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### 3️⃣ Run Application
```bash
mvn clean install
mvn spring-boot:run
```

**✅ Server starts on http://localhost:8080**

---

## 🧪 TEST IT

```bash
# Should return 400 (expected - no credentials)
curl http://localhost:8080/api/auth/login

# Should return user created
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@crm.com",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

---

## 📊 VALIDATION

Run the validator:
```bash
bash validate.sh
```

**Expected output:**
```
✓ Checking project structure...
✓ Checking Java files...
  Controllers: 7
  Services: 4
  Repositories: 9
  Entities: 9
  DTOs: 6
  Security: 4
  Total: 42
✓ No duplicate entity packages
✓ No duplicate class names
✓ All imports are correct
✓ VALIDATION COMPLETE
```

---

## 🔧 IntelliJ IDEA Setup

1. **Open Project**
   - File → Open → Select `crm-backend-clean` folder
   - Wait for Maven import

2. **Enable Lombok**
   - File → Settings → Plugins → Install "Lombok"
   - File → Settings → Build → Compiler → Annotation Processors
   - ✅ Enable annotation processing

3. **Set JDK**
   - File → Project Structure → Project
   - SDK: Java 17 or higher

4. **Run Application**
   - Open `CrmApplication.java`
   - Click green ▶️ button
   - Or use Run Configuration (already created)

---

## 📡 API ENDPOINTS

### Authentication (Public)
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request reset
- `POST /api/auth/reset-password` - Reset password

### Admin (Requires ADMIN role + JWT token)
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/{id}/role` - Update role
- `DELETE /api/admin/users/{id}` - Delete user

### CRM Features (Requires authentication)
- `GET /api/leads` - Get leads
- `GET /api/contacts` - Get contacts
- `GET /api/deals` - Get deals
- `GET /api/tasks` - Get tasks
- `GET /api/dashboard/stats` - Dashboard stats

---

## 🔒 SECURITY

**Authentication Flow:**
1. Register/Login → Receive JWT token
2. Include token in requests: `Authorization: Bearer {token}`
3. Token expires in 24 hours (configurable)

**Password Security:**
- BCrypt hashing (strength 10)
- Minimum 6 characters
- Reset via email with UUID tokens

**Role-Based Access:**
- `USER` - Basic CRM access
- `ADMIN` - Full access including user management

---

## 🐛 TROUBLESHOOTING

### "Could not connect to MySQL"
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in application.properties
spring.datasource.password=correct_password
```

### "Port 8080 already in use"
```bash
# Find and kill process
lsof -i :8080
kill -9 <PID>

# Or change port in application.properties
server.port=8081
```

### "Failed to send email"
```properties
# For testing, disable email or use Mailtrap
# Sign up at mailtrap.io and use their SMTP
spring.mail.host=smtp.mailtrap.io
spring.mail.port=2525
spring.mail.username=your-mailtrap-user
spring.mail.password=your-mailtrap-pass
```

### Compilation errors
```bash
# Clean rebuild
mvn clean install -U

# In IntelliJ: File → Invalidate Caches → Restart
```

---

## 📚 FILE BREAKDOWN

### Entities (9)
- `User` - User accounts
- `PasswordResetToken` - Password reset tokens
- `Lead` - Sales leads
- `Contact` - Contact information
- `Deal` - Sales deals
- `Task` - Task management
- `Activity` - Activity logs
- `Notification` - User notifications
- `DealNote` - Deal notes

### DTOs (6 files, multiple nested classes)
- `AuthDto` - Login, Register, Password Reset
- `UserDto` - User responses
- `LeadDto` - Lead requests/responses
- `ContactDto` - Contact data
- `DealDto` - Deal data
- `TaskDto` - Task data

### Services (4)
- `AuthService` - Authentication logic
- `AdminService` - User management
- `EmailService` - Email sending
- `PasswordResetService` - Password reset flow

### Controllers (7)
- `AuthController` - Auth endpoints
- `AdminController` - Admin endpoints
- `LeadController` - Lead CRUD
- `ContactController` - Contact CRUD
- `DealController` - Deal CRUD
- `TaskController` - Task CRUD
- `DashboardController` - Dashboard stats

---

## ✨ HIGHLIGHTS

**What Makes This Clean:**

1. **Single Entity Layer** - No more `com.crm.entity` vs `com.crm.model.entity` confusion
2. **All DTOs Present** - Including all nested classes like `ForgotPasswordRequest`
3. **Correct Imports** - All imports point to the right packages
4. **Complete Implementation** - No TODOs or incomplete code
5. **Consistent Naming** - Follow Java conventions
6. **Proper Security** - JWT + BCrypt + CORS configured
7. **Error Handling** - Global exception handler
8. **Validation** - Jakarta Validation on DTOs
9. **Transaction Management** - @Transactional where needed
10. **Logging** - SLF4J configured

---

## 🎯 PRODUCTION CHECKLIST

Before deploying:
- [ ] Update `jwt.secret` to random value
- [ ] Change database credentials
- [ ] Configure production email service
- [ ] Set `spring.jpa.hibernate.ddl-auto=validate`
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

---

## 📞 NEXT STEPS

1. ✅ Run `bash validate.sh` - Verify structure
2. ✅ Update `application.properties` - Set credentials
3. ✅ Run `mvn spring-boot:run` - Start server
4. ✅ Test endpoints - Use Postman or curl
5. ✅ Read `BACKEND_README.md` - Full documentation

---

**Status:** ✅ Production Ready  
**No Errors:** ✅ Validated  
**Ready to Run:** ✅ Yes  

**Get started now - it just works!** 🚀
