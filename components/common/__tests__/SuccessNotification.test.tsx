import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SuccessNotification } from '../SuccessNotification';

// Mock createPortal to render in place for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('SuccessNotification', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should not render when not visible', () => {
    render(
      <SuccessNotification
        isVisible={false}
        message="✨ Success!"
      />
    );

    expect(screen.queryByText('✨ Success!')).not.toBeInTheDocument();
  });

  it('should render when visible', () => {
    render(
      <SuccessNotification
        isVisible={true}
        message="✨ Success!"
      />
    );

    expect(screen.getByText('✨ Success!')).toBeInTheDocument();
  });

  it('should render Vietnamese message correctly', () => {
    render(
      <SuccessNotification
        isVisible={true}
        message="✨ Thành công!"
      />
    );

    expect(screen.getByText('✨ Thành công!')).toBeInTheDocument();
  });

  it('should auto-hide after default duration', async () => {
    const onComplete = jest.fn();
    
    render(
      <SuccessNotification
        isVisible={true}
        message="✨ Success!"
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('✨ Success!')).toBeInTheDocument();

    // Fast-forward past the default 2000ms duration + fade animation
    jest.advanceTimersByTime(2300);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should auto-hide after custom duration', async () => {
    const onComplete = jest.fn();
    
    render(
      <SuccessNotification
        isVisible={true}
        message="✨ Success!"
        duration={1000}
        onComplete={onComplete}
      />
    );

    // Fast-forward past the custom 1000ms duration + fade animation
    jest.advanceTimersByTime(1300);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('should have proper accessibility and styling', () => {
    render(
      <SuccessNotification
        isVisible={true}
        message="✨ Success!"
      />
    );

    const notification = screen.getByText('✨ Success!').closest('div');
    
    // Check that it has proper styling classes for animation and appearance
    expect(notification).toHaveClass('transform', 'transition-all', 'duration-300');
    expect(notification).toHaveClass('bg-green-600', 'text-white');
  });
});
