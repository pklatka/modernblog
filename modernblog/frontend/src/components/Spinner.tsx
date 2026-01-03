import { useState, useEffect } from 'react';

interface SpinnerProps {
  loading: boolean;
  delay?: number;
}

export default function Spinner({ loading, delay = 150 }: SpinnerProps) {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }

    const timeout = setTimeout(() => setShowSpinner(true), delay);
    return () => clearTimeout(timeout);
  }, [loading, delay]);

  if (!loading || !showSpinner) {
    return null;
  }

  return (
    <div className="loading">
      <div className="loading-spinner" />
    </div>
  );
}
