# GadgetHub Mobile App

A React Native + Expo mobile client for the GadgetHub e-commerce platform. This app shares the same backend, database, authentication, cart, orders, and AI assistant as the [GadgetHub website](../README.md).

## Architecture

```
Website (React + Vite)          Mobile App (React Native + Expo)
         \                               /
          \                             /
           → Same Supabase Backend ←
             - Same database
             - Same auth (Google OAuth)
             - Same cart (realtime sync)
             - Same orders
             - Same AI edge function
             - Same Nodemailer email
```

## Shared Systems

| System | How it's shared |
|--------|----------------|
| User accounts | Supabase Auth — same user ID on both platforms |
| Google OAuth | Same Supabase Google provider, mobile uses `expo-auth-session` |
| Products | Same Supabase `products` table, same queries |
| Cart | Same Supabase `carts` + `cart_items` tables, **realtime sync** via Supabase Realtime |
| Orders | Same `create-order` edge function, same `orders` + `order_items` tables |
| AI Assistant | Same `ai-assistant` edge function |
| Email | Same Nodemailer SMTP in `create-order` edge function (mobile never sends emails directly) |
| Reviews | Same `reviews` table |

## Setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Configure environment

The `.env` file is pre-configured with the same Supabase URL and anon key as the website. These are public/client-safe keys — no service-role keys or SMTP credentials are included.

### 3. Run the app

```bash
npx expo start
```

- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Press `w` to run in web browser

## Security

The mobile app only contains:
- Supabase URL and anon key (public, safe for client)
- No service-role key
- No SMTP credentials
- No AI API keys
- No server secrets

All sensitive operations (order creation, email sending, AI processing) happen server-side in the existing Supabase Edge Functions.

## Cart Realtime Sync

The cart uses Supabase Realtime to synchronize between the website and mobile app:

1. Both clients read/write to the same `cart_items` table
2. The mobile app subscribes to `postgres_changes` on the `cart_items` table
3. When the website adds/removes/updates an item, the mobile app receives a realtime event and reloads the cart
4. The cart badge in the bottom tab bar updates automatically

## Screens

- **Home** — Hero, search, featured products, categories, new arrivals, special offers, AI CTA
- **Shop** — Product grid with search, category filters, price range, sort, stock filter, pagination
- **Product Detail** — Images, price, specs, reviews, add to cart, buy now, related products
- **Cart** — Items with quantity controls, subtotal/shipping/total, checkout button
- **Checkout** — Customer info, shipping address, payment method, order summary
- **Order Confirmation** — Order number, total, status, shipping info, email status
- **Account** — Profile, order history, order details, sign out
- **AI Assistant** — Chat interface with product recommendation cards and add-to-cart
- **Login** — Google sign-in via mobile OAuth flow

## Tech Stack

- React Native 0.75
- Expo SDK 51
- Expo Router (file-based navigation)
- TypeScript
- Supabase (auth, database, realtime, edge functions)
- expo-secure-store (session storage)
- expo-auth-session + expo-web-browser (Google OAuth)
- lucide-react-native (icons)
