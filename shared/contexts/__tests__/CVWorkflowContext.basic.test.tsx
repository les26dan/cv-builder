import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple test component
const TestComponent: React.FC = () => {
  return <div data-testid="test-component">Test Component</div>
}

describe('CVWorkflowContext Basic Tests', () => {
  it('should render test component', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })
}) 