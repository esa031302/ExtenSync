import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

const LoadingSpinner = () => {
  return (
    <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
      <Container className="text-center">
        <Spinner animation="border" role="status" variant="primary" size="lg">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3 text-muted">Loading...</p>
      </Container>
    </div>
  );
};

export default LoadingSpinner;
