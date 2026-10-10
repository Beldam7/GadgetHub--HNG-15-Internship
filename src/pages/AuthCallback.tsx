import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AuthCallback() {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search + "&" + window.location.hash.replace(/^#/, ""),
    );
    const err = params.get("error_description") || params.get("error");
    if (err) {
      setAuthError(err);
      return;
    }
    if (!loading) navigate("/account", { replace: true });
  }, [loading, navigate]);

  if (authError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">Sign in failed</p>
        <p className="mt-2 text-sm text-slate-600">{authError}</p>
        <Link to="/login" className="mt-4 inline-block text-sm text-slate-900 underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">Completing sign in...</p>
      </div>
    </div>
  );
}