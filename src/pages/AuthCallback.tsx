import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AuthCallback() {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      navigate("/account", { replace: true });
    }
  }, [loading, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-3 text-sm text-slate-500">Completing sign in...</p>
      </div>
    </div>
  );
}
