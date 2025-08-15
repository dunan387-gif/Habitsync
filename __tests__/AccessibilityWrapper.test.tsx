import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import AccessibilityWrapper from '../components/AccessibilityWrapper';

describe('AccessibilityWrapper', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AccessibilityWrapper>
        <Text>Test Content</Text>
      </AccessibilityWrapper>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies accessibility props correctly', () => {
    const { getByTestId } = render(
      <AccessibilityWrapper
        testID="accessibility-wrapper"
        accessibilityLabel="Test Label"
        accessibilityHint="Test Hint"
        accessibilityRole="button"
      >
        <Text>Test Content</Text>
      </AccessibilityWrapper>
    );

    const wrapper = getByTestId('accessibility-wrapper');
    expect(wrapper).toBeTruthy();
  });

  it('has default accessible prop as true', () => {
    const { getByTestId } = render(
      <AccessibilityWrapper testID="accessibility-wrapper">
        <Text>Test Content</Text>
      </AccessibilityWrapper>
    );

    const wrapper = getByTestId('accessibility-wrapper');
    expect(wrapper.props.accessible).toBe(true);
  });
});
