import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders landing page content', async () => {
    render(<App />);
    
    // Add a small delay to allow async content to load
    await screen.findByText(/Transform Your Videos Into/i);
    expect(screen.getByText(/Searchable Text/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started Free/i)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', async () => {
    render(<App />);
    
    const getStartedButton = await screen.findByRole('link', { name: /Get Started Free/i });
    const watchDemoButton = await screen.findByRole('link', { name: /Watch Demo/i });
    
    expect(getStartedButton).toBeInTheDocument();
    expect(watchDemoButton).toBeInTheDocument();
  });
});
