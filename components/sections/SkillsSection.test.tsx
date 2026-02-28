import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillsSection } from './SkillsSection';
import { vi } from 'vitest';

// Mock the CVWorkflowContext
vi.mock('../../shared/contexts/CVWorkflowContext', () => ({
  useCVWorkflow: () => ({
    cvContent: {
      summary: 'Sample CV summary',
      workExperience: [
        {
          title: 'Software Engineer',
          company: 'Tech Company',
          bullets: ['Developed applications', 'Worked with team']
        }
      ],
      education: [
        {
          degree: 'Computer Science',
          institution: 'University'
        }
      ]
    },
    targetJob: 'Senior Software Engineer'
  })
}));

// Mock the AI service
vi.mock('../../utils/aiService', () => ({
  aiService: {
    suggestSkills: vi.fn()
  }
}));

const mockOnUpdate = vi.fn();

const mockSkillsData = {
  items: ['JavaScript', 'React', 'Node.js', 'TypeScript']
};

describe('SkillsSection Component', () => {
  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  it('renders skills section with data', () => {
    render(<SkillsSection 
      data={mockSkillsData} 
      onUpdate={mockOnUpdate} 
      isActive={true} 
    />);
    
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('allows adding new skill', () => {
    render(<SkillsSection 
      data={{ items: [] }} 
      onUpdate={mockOnUpdate} 
      isActive={true} 
    />);
    
    const skillInput = screen.getByPlaceholderText(/thêm kỹ năng/i);
    fireEvent.change(skillInput, { target: { value: 'Python' } });
    
    const addButton = screen.getByText('Thêm');
    fireEvent.click(addButton);
    
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('allows removing skill', () => {
    const { container } = render(<SkillsSection 
      data={mockSkillsData} 
      onUpdate={mockOnUpdate} 
      isActive={true} 
    />);
    
    const removeButtons = container.querySelectorAll('.text-blue-600');
    if (removeButtons[0]) {
      fireEvent.click(removeButtons[0]);
    }
    
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('handles skill input changes', () => {
    render(<SkillsSection 
      data={mockSkillsData} 
      onUpdate={mockOnUpdate} 
      isActive={true} 
    />);
    
    const skillInput = screen.getByPlaceholderText(/thêm kỹ năng/i);
    fireEvent.change(skillInput, { target: { value: 'Python' } });
    
    expect(skillInput).toHaveValue('Python');
  });
});

describe('SkillsSection Validation', () => {
  const mockOnUpdate = vi.fn();
  const defaultProps = {
    data: {
      items: []
    },
    onUpdate: mockOnUpdate,
    isActive: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Skill Addition', () => {
    it('should add a valid skill', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const addButton = screen.getByText('Thêm');
      
      fireEvent.change(input, { target: { value: 'JavaScript' } });
      fireEvent.click(addButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        items: ['JavaScript']
      });
    });

    it('should add skill on Enter key press', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnUpdate).toHaveBeenCalledWith({
        items: ['React']
      });
    });

    it('should not add empty skill', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const addButton = screen.getByText('Thêm');
      fireEvent.click(addButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('should trim whitespace from skills', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const addButton = screen.getByText('Thêm');
      
      fireEvent.change(input, { target: { value: '  Python  ' } });
      fireEvent.click(addButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        items: ['Python']
      });
    });
  });

  describe('Duplicate Prevention', () => {
    const propsWithSkills = {
      ...defaultProps,
      data: {
        items: ['JavaScript', 'React', 'Node.js']
      }
    };

    it('should show error for exact duplicate skill', async () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      fireEvent.change(input, { target: { value: 'JavaScript' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Kỹ năng này đã được thêm')).toBeInTheDocument();
      });
    });

    it('should show error for case-insensitive duplicate skill', async () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      fireEvent.change(input, { target: { value: 'javascript' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Kỹ năng này đã được thêm')).toBeInTheDocument();
      });
    });

    it('should prevent adding duplicate skill', async () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const addButton = screen.getByText('Thêm');
      
      fireEvent.change(input, { target: { value: 'JavaScript' } });
      fireEvent.click(addButton);

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it('should disable add button when duplicate detected', async () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const addButton = screen.getByText('Thêm');
      
      fireEvent.change(input, { target: { value: 'JavaScript' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('Length Validation', () => {
    it('should show error for skill longer than 50 characters', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const longSkill = 'A'.repeat(51);
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/Kỹ năng quá dài/)).toBeInTheDocument();
      });
    });

    it('should show warning for skill longer than 30 characters', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const longSkill = 'A'.repeat(35);
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/hơi dài/)).toBeInTheDocument();
      });
    });

    it('should show character count for non-empty input', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      fireEvent.change(input, { target: { value: 'JavaScript' } });

      await waitFor(() => {
        expect(screen.getByText('10/50 ký tự')).toBeInTheDocument();
      });
    });

    it('should enforce maxLength attribute on input', () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      expect(input).toHaveAttribute('maxLength', '60');
    });
  });

  describe('Skill Removal', () => {
    const propsWithSkills = {
      ...defaultProps,
      data: {
        items: ['JavaScript', 'React', 'Node.js']
      }
    };

    it('should remove skill when X button is clicked', async () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      const removeButtons = screen.getAllByTitle('Xóa kỹ năng này');
      fireEvent.click(removeButtons[0]);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        items: ['React', 'Node.js']
      });
    });

    it('should display skills as chips', () => {
      render(<SkillsSection {...propsWithSkills} />);
      
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  describe('Visual Feedback and Styling', () => {
    it('should apply error styling for validation errors', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const longSkill = 'A'.repeat(51);
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveClass('border-red-300', 'bg-red-50');
      });
    });

    it('should apply warning styling for length warnings', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const longSkill = 'A'.repeat(35);
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveClass('border-yellow-300', 'bg-yellow-50');
      });
    });

    it('should have proper aria-invalid attribute', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const longSkill = 'A'.repeat(51);
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Skills Count Guidance', () => {
    it('should show basic guidance text for few skills', () => {
      const propsWithFewSkills = {
        ...defaultProps,
        data: { items: ['JavaScript', 'React'] }
      };
      
      render(<SkillsSection {...propsWithFewSkills} />);
      
      // Only basic guidance text is shown, no specific count messages
      expect(screen.getByText(/Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển/)).toBeInTheDocument();
      expect(screen.queryByText(/Thêm.*kỹ năng nữa/)).not.toBeInTheDocument();
    });

    it('should show basic guidance text for optimal skill count', () => {
      const propsWithOptimalSkills = {
        ...defaultProps,
        data: { items: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Docker'] }
      };
      
      render(<SkillsSection {...propsWithOptimalSkills} />);
      
      // Only basic guidance text is shown, no specific success messages
      expect(screen.getByText(/Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển/)).toBeInTheDocument();
      expect(screen.queryByText(/Số lượng kỹ năng phù hợp/)).not.toBeInTheDocument();
    });

    it('should show basic guidance text for many skills', () => {
      const propsWithManySkills = {
        ...defaultProps,
        data: { 
          items: Array.from({ length: 12 }, (_, i) => `Skill ${i + 1}`)
        }
      };
      
      render(<SkillsSection {...propsWithManySkills} />);
      
      // Only basic guidance text is shown, no specific warning messages
      expect(screen.getByText(/Chọn 5-10 kỹ năng phù hợp nhất với vị trí ứng tuyển/)).toBeInTheDocument();
      expect(screen.queryByText(/Quá nhiều kỹ năng/)).not.toBeInTheDocument();
    });

    it('should not show guidance when no skills are present', () => {
      render(<SkillsSection {...defaultProps} />);
      
      // The description text should be there
      expect(screen.getByText(/Chọn 5-10 kỹ năng phù hợp nhất/)).toBeInTheDocument();
      // But no specific count guidance should appear
      expect(screen.queryByText(/Thêm.*kỹ năng nữa/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Số lượng kỹ năng phù hợp/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Quá nhiều kỹ năng/)).not.toBeInTheDocument();
    });
  });

  describe('AI Skills Generation', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    it('should generate new skills that are not duplicates', async () => {
      const { aiService } = await import('../../utils/aiService');
      
      // Mock successful AI response
      (aiService.suggestSkills as any).mockResolvedValue({
        success: true,
        data: ['React', 'TypeScript', 'Node.js']
      });
      
      const propsWithSomeSkills = {
        ...defaultProps,
        data: { items: ['JavaScript'] }
      };
      
      render(<SkillsSection {...propsWithSomeSkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          items: ['JavaScript', 'React', 'TypeScript', 'Node.js']
        });
      });
      
      // Verify AI service was called with correct parameters including language detection
      expect(aiService.suggestSkills).toHaveBeenCalledWith(
        expect.objectContaining({
          currentSkills: ['JavaScript'],
          maxSkillsToSuggest: 7,
          language: 'en' // Should detect English from context
        })
      );
    });

    it('should detect Vietnamese language and use appropriate prompts', async () => {
      const { aiService } = await import('../../utils/aiService');
      
      // Mock successful AI response with Vietnamese skills
      (aiService.suggestSkills as any).mockResolvedValue({
        success: true,
        data: ['Quản lý dự án', 'Kỹ năng thuyết trình', 'Làm việc nhóm']
      });
      
      const propsWithVietnameseSkills = {
        ...defaultProps,
        data: { items: ['Kỹ năng bán hàng'] }
      };
      
      render(<SkillsSection {...propsWithVietnameseSkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          items: ['Kỹ năng bán hàng', 'Quản lý dự án', 'Kỹ năng thuyết trình', 'Làm việc nhóm']
        });
      });
      
      // Verify Vietnamese language was detected
      expect(aiService.suggestSkills).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'vi'
        })
      );
    });

    it('should respect maximum skills limit', async () => {
      const { aiService } = await import('../../utils/aiService');
      
      // Mock AI response with more skills than allowed
      (aiService.suggestSkills as any).mockResolvedValue({
        success: true,
        data: ['Skill1', 'Skill2', 'Skill3', 'Skill4', 'Skill5']
      });
      
      const propsWithManySkills = {
        ...defaultProps,
        data: { items: ['Skill A', 'Skill B', 'Skill C', 'Skill D', 'Skill E', 'Skill F'] } // 6 skills
      };
      
      render(<SkillsSection {...propsWithManySkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(aiService.suggestSkills).toHaveBeenCalledWith(
          expect.objectContaining({
            maxSkillsToSuggest: 2 // 8 max - 6 existing = 2 allowed
          })
        );
      });
    });

    it('should show warning when at maximum skills', async () => {
      const propsWithMaxSkills = {
        ...defaultProps,
        data: { 
          items: Array.from({ length: 8 }, (_, i) => `Skill ${i + 1}`) // 8 skills (max)
        }
      };
      
      render(<SkillsSection {...propsWithMaxSkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Đã đạt giới hạn 8 kỹ năng/)).toBeInTheDocument();
      });
    });

    it('should show warning when AI returns no new skills', async () => {
      const { aiService } = await import('../../utils/aiService');
      
      // Mock AI response that returns skills already in the list
      (aiService.suggestSkills as any).mockResolvedValue({
        success: true,
        data: ['JavaScript', 'React'] // Skills already in list
      });
      
      const propsWithSomeSkills = {
        ...defaultProps,
        data: { items: ['JavaScript', 'React', 'Node.js'] }
      };
      
      render(<SkillsSection {...propsWithSomeSkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText(/Tất cả kỹ năng gợi ý đã có trong danh sách/)).toBeInTheDocument();
      });
    });

    it('should handle AI service errors gracefully', async () => {
      const { aiService } = await import('../../utils/aiService');
      
      // Mock AI service error
      (aiService.suggestSkills as any).mockRejectedValue(new Error('API Error'));
      
      // Mock alert function to capture error messages
      const alertMock = vi.fn();
      global.alert = alertMock;
      
      const propsWithSomeSkills = {
        ...defaultProps,
        data: { items: ['JavaScript'] }
      };
      
      render(<SkillsSection {...propsWithSomeSkills} />);
      
      const generateButton = screen.getByText(/Gợi ý kỹ năng/);
      fireEvent.click(generateButton);

      await waitFor(() => {
        // Should show error message via alert
        expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Có lỗi xảy ra khi tạo gợi ý kỹ năng'));
      });
    });
  });

  describe('Error Clearing', () => {
    it('should clear validation error when user starts typing', async () => {
      render(<SkillsSection {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const longSkill = 'A'.repeat(51);
      
      // Trigger error
      fireEvent.change(input, { target: { value: longSkill } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/Kỹ năng quá dài/)).toBeInTheDocument();
      });

      // Start typing to clear error
      fireEvent.change(input, { target: { value: 'Valid Skill' } });
      
      await waitFor(() => {
        expect(screen.queryByText(/Kỹ năng quá dài/)).not.toBeInTheDocument();
      });
    });

    it('should clear error after successful skill addition', async () => {
      const propsWithSkills = {
        ...defaultProps,
        data: { items: ['JavaScript'] }
      };
      
      render(<SkillsSection {...propsWithSkills} />);
      
      const input = screen.getByPlaceholderText(/Thêm kỹ năng/);
      const addButton = screen.getByText('Thêm');
      
      // Trigger duplicate error
      fireEvent.change(input, { target: { value: 'JavaScript' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Kỹ năng này đã được thêm')).toBeInTheDocument();
      });

      // Add valid skill
      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.click(addButton);

      // Input should be cleared and no error should remain
      expect(input).toHaveValue('');
      expect(screen.queryByText('Kỹ năng này đã được thêm')).not.toBeInTheDocument();
    });
  });
}); 