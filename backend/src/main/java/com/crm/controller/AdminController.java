package com.crm.controller;
import com.crm.dto.*;
import com.crm.entity.User;
import com.crm.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;
    
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<UserDto.Response> users = adminService.getAllUsers();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", users
        ));
    }
    
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody AuthDto.RegisterRequest request) {
        UserDto.Response user = adminService.createUser(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User created successfully",
                "data", user
        ));
    }
    
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody UserDto.UpdateRoleRequest request) {
        UserDto.Response user = adminService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User role updated",
                "data", user
        ));
    }
    
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        adminService.deleteUser(id, currentUser.getEmail());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
        ));
    }
}
