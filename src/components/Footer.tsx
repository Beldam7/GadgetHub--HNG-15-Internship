import { Link } from "react-router-dom";
import { Cpu, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { STORE_CONFIG } from "@/config";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <Cpu className="h-5 w-5 text-slate-900" />
              </div>
              <span className="text-lg font-bold text-white">{STORE_CONFIG.name}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{STORE_CONFIG.description}</p>
            <div className="flex gap-3 mt-4">
              <a href={STORE_CONFIG.social.twitter} className="text-slate-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href={STORE_CONFIG.social.instagram} className="text-slate-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href={STORE_CONFIG.social.youtube} className="text-slate-400 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="text-slate-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="text-slate-400 hover:text-white transition-colors">Categories</Link></li>
              <li><Link to="/shop?sort=newest" className="text-slate-400 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link to="/shop?sale=true" className="text-slate-400 hover:text-white transition-colors">Special Offers</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="text-slate-400 hover:text-white transition-colors">My Account</Link></li>
              <li><Link to="/account" className="text-slate-400 hover:text-white transition-colors">Order History</Link></li>
              <li><Link to="/cart" className="text-slate-400 hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <Mail size={16} /> {STORE_CONFIG.supportEmail}
              </li>
              <li className="text-slate-400">Free shipping on orders over ${STORE_CONFIG.freeShippingThreshold}</li>
              <li className="text-slate-400">30-day return policy</li>
              <li className="text-slate-400">Secure checkout</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {STORE_CONFIG.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
