import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center px-6">
      <div className="mx-auto w-full max-w-md">
        <p className="stamp">404 · {location.pathname}</p>
        <h1 className="mt-4 text-3xl font-medium text-foreground">This page is not on the board</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">The link may be old, or the page may have moved.</p>
        <div className="mt-8 flex gap-2">
          <Button asChild><Link to="/dashboard">Go to dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/">Home</Link></Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
