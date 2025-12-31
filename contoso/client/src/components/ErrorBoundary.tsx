import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Container, Button } from 'react-bootstrap';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log to error reporting service in production
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className='mt-5'>
          <Alert variant='danger'>
            <Alert.Heading>Something went wrong</Alert.Heading>
            <p>
              We're sorry, but something unexpected happened. The error has been
              logged and we'll look into it.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <>
                <hr />
                <details>
                  <summary className='mb-2'>
                    <strong>Error Details (Development Only)</strong>
                  </summary>
                  <pre className='text-danger'>
                    <code>{this.state.error.toString()}</code>
                  </pre>
                  {this.state.errorInfo && (
                    <pre
                      className='text-muted'
                      style={{ fontSize: '0.875rem' }}
                    >
                      <code>{this.state.errorInfo.componentStack}</code>
                    </pre>
                  )}
                </details>
              </>
            )}
            <hr />
            <div className='d-flex gap-2'>
              <Button variant='primary' onClick={this.handleReset}>
                Go to Home Page
              </Button>
              <Button
                variant='secondary'
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}
