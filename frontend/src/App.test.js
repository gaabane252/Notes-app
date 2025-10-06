import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Notes App header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Notes App/i); // check your app header
  expect(headerElement).toBeInTheDocument();
});
