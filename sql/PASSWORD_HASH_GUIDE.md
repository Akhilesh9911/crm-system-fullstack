# PASSWORD HASH GENERATION

## The schema.sql file includes placeholder password hashes.
## You have TWO options to fix this:

### OPTION 1: Use the application to create users (RECOMMENDED)
1. Start the backend application
2. Use the register endpoint or admin panel to create users
3. The application will automatically hash passwords correctly

### OPTION 2: Generate hashes manually and update SQL
Run this from your backend directory after mvn install:

```bash
# Create a simple Java class to generate hashes
cat > GenerateHash.java << 'EOF'
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        System.out.println("=== Password Hashes ===");
        System.out.println("admin123: " + encoder.encode("admin123"));
        System.out.println("user123: " + encoder.encode("user123"));
    }
}
EOF

# Compile and run (you'll need Spring Security on classpath)
# OR just use the app registration endpoint
```

### OPTION 3: Quick Fix - Create users via API after starting
After starting the application, run these curl commands:

```bash
# Create admin user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@crm.com",
    "password": "admin123",
    "role": "ADMIN"
  }'

# Create test user  
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "user@crm.com",
    "password": "user123",
    "role": "USER"
  }'
```

## RECOMMENDED APPROACH:
1. Run the schema.sql WITHOUT the INSERT statements for users
2. Start your application
3. Register users through the UI or API
4. Passwords will be correctly hashed automatically
