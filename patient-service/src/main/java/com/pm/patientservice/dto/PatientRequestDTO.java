package com.pm.patientservice.dto;

import com.pm.patientservice.dto.validators.CreatePatientValidationGroup;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PatientRequestDTO {
   @NotBlank(message = "Name is required")
   @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

   @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

   @NotBlank(message = "Address is required")
   @Size(max = 255, message = "Address cannot exceed 255 characters")
    private String address;

   @NotBlank(message = "Date of Birth is required")
   @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Date of Birth must be in ISO format (YYYY-MM-DD)")
    private String dateOfBirth;

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRegisteredDate() {
        return registeredDate;
    }

    public void setRegisteredDate(String registeredDate) {
        this.registeredDate = registeredDate;
    }

    @NotBlank(groups = CreatePatientValidationGroup.class, message = "Registered Date is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Registered Date must be in ISO format (YYYY-MM-DD)", groups = CreatePatientValidationGroup.class)
    private String registeredDate;


}
