interface WorkExperienceData {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  project: string;
  impact: string;
  responsibility: string;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'logic' | 'length';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class WorkExperienceValidator {
  
  /**
   * Validates a complete work experience entry
   */
  static validateComplete(data: WorkExperienceData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required field validations
    if (!data.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Vui lòng nhập chức danh công việc',
        type: 'required'
      });
    }

    if (!data.company?.trim()) {
      errors.push({
        field: 'company',
        message: 'Vui lòng nhập tên công ty',
        type: 'required'
      });
    }

    if (!data.startDate?.trim()) {
      errors.push({
        field: 'startDate',
        message: 'Vui lòng nhập ngày bắt đầu',
        type: 'required'
      });
    }

    if (!data.current && !data.endDate?.trim()) {
      errors.push({
        field: 'endDate',
        message: 'Vui lòng nhập ngày kết thúc hoặc chọn "Công việc hiện tại"',
        type: 'required'
      });
    }

    // Date format and logic validations
    const dateValidation = this.validateDates(data.startDate, data.endDate, data.current);
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // Content length validations
    const lengthValidation = this.validateContentLength(data);
    warnings.push(...lengthValidation.warnings);

    // AI wizard specific validations (for steps 5-7)
    if (data.project && !data.project.trim()) {
      errors.push({
        field: 'project',
        message: 'Vui lòng mô tả dự án hoặc trách nhiệm chính',
        type: 'required'
      });
    }

    if (data.impact && !data.impact.trim()) {
      errors.push({
        field: 'impact',
        message: 'Vui lòng mô tả kết quả hoặc tác động',
        type: 'required'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates a specific step in the wizard
   */
  static validateStep(stepNumber: number, data: Partial<WorkExperienceData>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (stepNumber) {
      case 1: // Job Title
        if (!data.title?.trim()) {
          errors.push({
            field: 'title',
            message: 'Vui lòng nhập chức danh công việc',
            type: 'required'
          });
        }
        break;

      case 2: // Company
        if (!data.company?.trim()) {
          errors.push({
            field: 'company',
            message: 'Vui lòng nhập tên công ty',
            type: 'required'
          });
        }
        break;

      case 3: // Dates
        if (!data.startDate?.trim()) {
          errors.push({
            field: 'startDate',
            message: 'Vui lòng nhập ngày bắt đầu',
            type: 'required'
          });
        }

        if (!data.current && !data.endDate?.trim()) {
          errors.push({
            field: 'endDate',
            message: 'Vui lòng nhập ngày kết thúc hoặc chọn "Công việc hiện tại"',
            type: 'required'
          });
        }

        // Date logic validation
        if (data.startDate && data.endDate && !data.current) {
          const dateValidation = this.validateDates(data.startDate, data.endDate, data.current || false);
          errors.push(...dateValidation.errors);
          warnings.push(...dateValidation.warnings);
        }
        break;

      case 4: // Location (optional - no validation needed)
        break;

      case 5: // Project/Responsibility
        if (!data.project?.trim()) {
          errors.push({
            field: 'project',
            message: 'Vui lòng mô tả dự án hoặc trách nhiệm chính',
            type: 'required'
          });
        }
        break;

      case 6: // Result/Impact
        if (!data.impact?.trim()) {
          errors.push({
            field: 'impact',
            message: 'Vui lòng mô tả kết quả hoặc tác động',
            type: 'required'
          });
        }
        break;

      case 7: // Role Context (optional - no validation needed)
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates date fields and logic
   */
  static validateDates(startDate: string, endDate: string, current: boolean): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!startDate?.trim()) {
      return { isValid: false, errors, warnings };
    }

    // Parse dates - support both MM/YYYY and YYYY formats
    const startYear = this.parseYear(startDate);
    const endYear = current ? new Date().getFullYear() : this.parseYear(endDate);

    if (startYear === null) {
      errors.push({
        field: 'startDate',
        message: 'Định dạng ngày bắt đầu không hợp lệ (sử dụng MM/YYYY hoặc YYYY)',
        type: 'format'
      });
    }

    if (!current && endDate && endYear === null) {
      errors.push({
        field: 'endDate',
        message: 'Định dạng ngày kết thúc không hợp lệ (sử dụng MM/YYYY hoặc YYYY)',
        type: 'format'
      });
    }

    // Date logic validations
    if (startYear !== null && endYear !== null) {
      if (endYear < startYear) {
        errors.push({
          field: 'endDate',
          message: 'Ngày kết thúc phải sau ngày bắt đầu',
          type: 'logic'
        });
      }

      // Check for unrealistic date ranges
      const currentYear = new Date().getFullYear();
      
      if (startYear > currentYear + 1) {
        warnings.push({
          field: 'startDate',
          message: 'Ngày bắt đầu trong tương lai có vẻ không hợp lý',
          type: 'logic'
        });
      }

      if (!current && endYear > currentYear + 5) {
        warnings.push({
          field: 'endDate',
          message: 'Ngày kết thúc quá xa trong tương lai',
          type: 'logic'
        });
      }

      // Check for very long employment periods (warning only)
      if (endYear - startYear > 20) {
        warnings.push({
          field: 'endDate',
          message: 'Thời gian làm việc rất dài (hơn 20 năm), vui lòng kiểm tra lại',
          type: 'logic'
        });
      }

      // Check for very short employment periods (warning only)
      if (endYear === startYear) {
        warnings.push({
          field: 'endDate',
          message: 'Thời gian làm việc ngắn (dưới 1 năm), có thể ảnh hưởng đến đánh giá của nhà tuyển dụng',
          type: 'logic'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates content length for optimal CV presentation
   */
  static validateContentLength(data: Partial<WorkExperienceData>): ValidationResult {
    const warnings: ValidationError[] = [];

    // Job title length
    if (data.title && data.title.length > 60) {
      warnings.push({
        field: 'title',
        message: 'Chức danh khá dài, có thể rút gọn để CV dễ đọc hơn',
        type: 'length'
      });
    }

    // Company name length
    if (data.company && data.company.length > 50) {
      warnings.push({
        field: 'company',
        message: 'Tên công ty khá dài, có thể rút gọn để CV gọn gàng hơn',
        type: 'length'
      });
    }

    // Location length
    if (data.location && data.location.length > 30) {
      warnings.push({
        field: 'location',
        message: 'Địa điểm có thể rút gọn hơn (ví dụ: "HCM" thay vì "Thành phố Hồ Chí Minh")',
        type: 'length'
      });
    }

    // Project description length
    if (data.project && data.project.length > 200) {
      warnings.push({
        field: 'project',
        message: 'Mô tả dự án khá dài, AI có thể tạo ra bullet point dài hơn mức khuyến nghị',
        type: 'length'
      });
    }

    // Impact description length
    if (data.impact && data.impact.length > 150) {
      warnings.push({
        field: 'impact',
        message: 'Mô tả tác động khá dài, hãy tập trung vào những con số quan trọng nhất',
        type: 'length'
      });
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  /**
   * Parses year from date string (supports MM/YYYY and YYYY formats)
   */
  private static parseYear(dateString: string): number | null {
    if (!dateString?.trim()) return null;

    // Try YYYY format first
    const yearOnly = parseInt(dateString.trim());
    if (!isNaN(yearOnly) && yearOnly >= 1950 && yearOnly <= 2050) {
      return yearOnly;
    }

    // Try MM/YYYY format
    const parts = dateString.split('/');
    if (parts.length === 2) {
      const year = parseInt(parts[1]);
      const month = parseInt(parts[0]);
      
      if (!isNaN(year) && !isNaN(month) && 
          year >= 1950 && year <= 2050 && 
          month >= 1 && month <= 12) {
        return year;
      }
    }

    return null;
  }

  /**
   * Checks if the provided data is sufficient to proceed to AI generation
   */
  static canProceedToAI(data: Partial<WorkExperienceData>): boolean {
    return !!(
      data.title?.trim() &&
      data.company?.trim() &&
      data.startDate?.trim() &&
      (data.current || data.endDate?.trim()) &&
      data.project?.trim() &&
      data.impact?.trim()
    );
  }

  /**
   * Formats validation errors for display
   */
  static formatErrorsForDisplay(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0].message;
    }

    return errors.map((error, index) => `${index + 1}. ${error.message}`).join('\n');
  }

  /**
   * Gets user-friendly field names in Vietnamese
   */
  static getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
      title: 'Chức danh',
      company: 'Công ty',
      startDate: 'Ngày bắt đầu',
      endDate: 'Ngày kết thúc',
      location: 'Địa điểm',
      project: 'Dự án/Trách nhiệm',
      impact: 'Tác động/Kết quả',
      responsibility: 'Vai trò'
    };

    return fieldNames[field] || field;
  }
}

export default WorkExperienceValidator; 