import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Simple test component to verify testing setup works
const SimpleTestComponent = ({ title, description }: { title: string; description: string }) => {
  return (
    <View testID="test-container">
      <Text testID="title">{title}</Text>
      <Text testID="description">{description}</Text>
    </View>
  );
};

describe('Basic Component Testing', () => {
  it('renders simple component correctly', () => {
    const { getByTestId, getByText } = render(
      <SimpleTestComponent title="Test Title" description="Test Description" />
    );
    
    expect(getByTestId('test-container')).toBeTruthy();
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });

  it('renders with correct props', () => {
    const { getByTestId } = render(
      <SimpleTestComponent title="Exercise" description="Daily workout" />
    );
    
    const title = getByTestId('title');
    const description = getByTestId('description');
    
    expect(title.props.children).toBe('Exercise');
    expect(description.props.children).toBe('Daily workout');
  });
});
