#!/bin/bash

echo "=========================================="
echo "CRM Backend - Structure Validation"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

echo "✓ Checking project structure..."

# Check main directories
for dir in src/main/java/com/crm/{controller,service,repository,entity,dto,security,exception}; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir exists"
    else
        echo "  ✗ $dir MISSING"
        exit 1
    fi
done

echo ""
echo "✓ Checking Java files..."

# Count files by package
echo "  Controllers: $(find src/main/java/com/crm/controller -name "*.java" 2>/dev/null | wc -l)"
echo "  Services: $(find src/main/java/com/crm/service -name "*.java" 2>/dev/null | wc -l)"
echo "  Repositories: $(find src/main/java/com/crm/repository -name "*.java" 2>/dev/null | wc -l)"
echo "  Entities: $(find src/main/java/com/crm/entity -name "*.java" 2>/dev/null | wc -l)"
echo "  DTOs: $(find src/main/java/com/crm/dto -name "*.java" 2>/dev/null | wc -l)"
echo "  Security: $(find src/main/java/com/crm/security -name "*.java" 2>/dev/null | wc -l)"
echo "  Total: $(find src/main/java -name "*.java" 2>/dev/null | wc -l)"

echo ""
echo "✓ Checking for duplicates..."

# Check for duplicate entity packages
if [ -d "src/main/java/com/crm/model/entity" ]; then
    echo "  ✗ DUPLICATE: model/entity package exists!"
    exit 1
else
    echo "  ✓ No duplicate entity packages"
fi

# Check for duplicate classes
DUPLICATES=$(find src/main/java -name "*.java" -exec basename {} \; | sort | uniq -d)
if [ -n "$DUPLICATES" ]; then
    echo "  ✗ DUPLICATE classes found:"
    echo "$DUPLICATES"
    exit 1
else
    echo "  ✓ No duplicate class names"
fi

echo ""
echo "✓ Checking critical files..."

CRITICAL_FILES=(
    "src/main/java/com/crm/CrmApplication.java"
    "src/main/java/com/crm/entity/User.java"
    "src/main/java/com/crm/dto/AuthDto.java"
    "src/main/java/com/crm/security/SecurityConfig.java"
    "src/main/java/com/crm/controller/AuthController.java"
    "src/main/resources/application.properties"
    "pom.xml"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ MISSING: $file"
        exit 1
    fi
done

echo ""
echo "✓ Validating Java syntax..."

# Check for common syntax issues in Java files
SYNTAX_ERRORS=0
while IFS= read -r file; do
    # Check for unmatched braces (basic check)
    OPEN=$(grep -o '{' "$file" | wc -l)
    CLOSE=$(grep -o '}' "$file" | wc -l)
    if [ "$OPEN" != "$CLOSE" ]; then
        echo "  ✗ Possible syntax error in $file (braces mismatch)"
        SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
    fi
done < <(find src/main/java -name "*.java")

if [ $SYNTAX_ERRORS -eq 0 ]; then
    echo "  ✓ No obvious syntax errors found"
else
    echo "  ✗ Found $SYNTAX_ERRORS files with potential issues"
fi

echo ""
echo "✓ Checking imports..."

# Check for problematic imports
BAD_IMPORTS=0
while IFS= read -r file; do
    if grep -q "import com.crm.model.entity" "$file"; then
        echo "  ✗ Old import in: $file"
        BAD_IMPORTS=$((BAD_IMPORTS + 1))
    fi
done < <(find src/main/java -name "*.java")

if [ $BAD_IMPORTS -eq 0 ]; then
    echo "  ✓ All imports are correct"
else
    echo "  ✗ Found $BAD_IMPORTS files with incorrect imports"
    exit 1
fi

echo ""
echo "=========================================="
echo "✓ VALIDATION COMPLETE"
echo "=========================================="
echo ""
echo "Project structure is clean and ready!"
echo ""
echo "Next steps:"
echo "1. Update application.properties (MySQL password, email config)"
echo "2. Run: mvn clean install"
echo "3. Run: mvn spring-boot:run"
echo "4. Test: curl http://localhost:8080/api/auth/login"
echo ""
