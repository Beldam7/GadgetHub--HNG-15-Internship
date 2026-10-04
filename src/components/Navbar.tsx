import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart, User, Search, Menu, X, LogOut, Package, Cpu } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { STORE_CONFIG } from "@/config";
import { searchProducts } from "@/services/productService";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

export function Navbar() {
  const { cartCount } = useCart();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchProducts(searchQuery.trim(), 5);
      setSearchResults(results);
      setSearchOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMobileOpen(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">{STORE_CONFIG.name}</span>
          </Link>

          {/* Desktop Search */}
          <div ref={searchRef} className="relative hidden flex-1 max-w-xl md:block">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for gadgets..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </form>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{formatPrice(product.price)}</p>
                    </div>
                  </Link>
                ))}
                <Link
                  to={`/shop?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="block px-4 py-2.5 text-center text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
                >
                  View all results
                </Link>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-1 md:flex">
            <Link to="/shop" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              Shop
            </Link>
            <Link to="/categories" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              Categories
            </Link>
            <Link to="/cart" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
              >
                <User className="h-5 w-5" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {profile?.full_name || user.email}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <User size={16} /> My Account
                      </Link>
                      <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Package size={16} /> Order History
                      </Link>
                      <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                        <LogOut size={16} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Sign In
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1 md:hidden">
            <Link to="/cart" className="relative rounded-lg p-2 text-slate-700">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 text-slate-700">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for gadgets..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </form>
            <Link to="/" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-slate-700">Home</Link>
            <Link to="/shop" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-slate-700">Shop</Link>
            <Link to="/categories" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-slate-700">Categories</Link>
            {user ? (
              <>
                <Link to="/account" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-slate-700">My Account</Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="block w-full text-left px-2 py-2 text-sm font-medium text-rose-600">Sign Out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm font-medium text-slate-700">Sign In</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
