import { createContext, useContext, useState, ReactNode } from 'react';

type ErrorContextType = {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType>({
  error: null,
  setError: () => {},
  clearError: () => {}
});

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<Error | null>(null);

  return (
    <ErrorContext.Provider value={{
      error,
      setError: (err) => setError(err),
      clearError: () => setError(null)
    }}>
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-500 text-white rounded-lg shadow-lg flex items-center">
          <span>{error.message}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-4 px-3 py-1 bg-red-700 rounded hover:bg-red-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);
