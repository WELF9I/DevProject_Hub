const Spinner = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading awesome projects...</p>
      </div>
    );
  };
  
  export default Spinner;