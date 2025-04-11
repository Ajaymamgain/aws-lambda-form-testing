export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-400 border-t-transparent"></div>
        <div className="mt-4 text-center text-sm text-gray-600">Loading...</div>
      </div>
    </div>
  );
};