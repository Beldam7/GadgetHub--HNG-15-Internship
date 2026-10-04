# GadgetHub — AI-Powered Gadget E-Commerce Store

A full-stack, production-ready e-commerce website for a modern gadget shop. Built with React, TypeScript, Supabase, Google OAuth, Nodemailer transactional emails (SMTP), and an AI shopping assistant that recommends products from the actual store inventory.

## Features

- **Storefront**: Home, Shop (with filters, search, sorting, pagination), Product Details, Categories
- **Shopping Cart**: Add/remove items, quantity controls, stock validation, persistent across sessions
- **Checkout**: Customer info, shipping address, order summary, Pay on Delivery, server-side price/stock validation
- **Order System**: Orders stored in Supabase, order items preserved for history, stock decremented atomically, unique order numbers
- **Email Confirmation**: Professional HTML order confirmation emails via Nodemailer SMTP (with failure handling)
- **Google Authentication**: Sign in/up with Google via Supabase Auth
- **Customer Account**: Profile management, order history, order details, account settings
- **AI Shopping Assistant**: Floating chatbot that asks clarifying questions, retrieves real products from the database, and recommends based on budget, use case, and specifications
- **Responsive Design**: Mobile-first, works on all devices
- **Row Level Security**: All database tables protected with proper RLS policies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Vite |
| Routing | React Router v7 |
| Backend/Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Google OAuth |
| Emails | Nodemailer (SMTP) |
| AI | OpenAI-compatible API (via edge function) |
| Server Logic | Supabase Edge Functions (Deno) |

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── AIChatbot.tsx       # Floating AI shopping assistant
│   ├── Footer.tsx          # Site footer
│   ├── Navbar.tsx          # Sticky nav with search, cart, account
│   ├── ProductCard.tsx     # Product card with add-to-cart
│   ├── Skeletons.tsx       # Loading placeholders
│   ├── StarRating.tsx      # Star rating display
│   └── ToastContainer.tsx  # Toast notifications
├── contexts/          # React contexts
│   ├── AuthContext.tsx     # Auth state, Google sign-in, profile
│   ├── CartContext.tsx     # Cart state, add/update/remove
│   └── ToastContext.tsx    # Toast notifications
├── lib/
│   ├── supabase.ts         # Supabase client singleton
│   └── utils.ts            # Formatting utilities
├── pages/             # Route pages
│   ├── Account.tsx         # Profile + order history
│   ├── AuthCallback.tsx    # OAuth redirect handler
│   ├── Cart.tsx            # Shopping cart
│   ├── Categories.tsx      # Category grid
│   ├── Checkout.tsx        # Checkout form + order placement
│   ├── Home.tsx            # Landing page
│   ├── Login.tsx           # Google sign-in
│   ├── NotFound.tsx        # 404 page
│   ├── OrderSuccess.tsx    # Order confirmation
│   ├── ProductDetail.tsx   # Product page + reviews
│   └── Shop.tsx            # Product grid with filters
├── services/          # Data access layer
│   ├── aiService.ts        # AI chatbot API calls
│   ├── orderService.ts     # Order creation via edge function
│   ├── productService.ts   # Product/category queries
│   ├── profileService.ts   # Profile updates
│   └── reviewService.ts    # Product reviews
├── types/             # TypeScript types
├── config.ts          # Store name, currency, settings
└── App.tsx            # Router + providers

supabase/
├── config.toml              # Edge function config
├── functions/
│   ├── ai-assistant/        # AI chatbot edge function
│   └── create-order/        # Order creation + email edge function
└── migrations/              # SQL migration files
```

## Setup Guide

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A Google Cloud Console account (for OAuth)
- An SMTP email provider (Gmail, Amazon SES, Postmark, etc.) for transactional emails
- An OpenAI API key (for the AI assistant)

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

The Supabase project is already provisioned in the Bolt environment. If setting up from scratch:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Project Settings → API** to get:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
3. The database schema, RLS policies, and seed data are applied automatically via migrations

### 4. Google Authentication Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services → OAuth consent screen**:
   - Choose **External** user type
   - Fill in app name: `GadgetHub`
   - Add your email as a test user
   - Add scopes: `email`, `profile`, `openid`
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `https://your-production-domain.com/auth/callback`
5. Copy the **Client ID** and **Client Secret**
6. In Supabase dashboard, go to **Authentication → Providers → Google**:
   - Enable Google
   - Paste the Client ID and Client Secret
   - Save

### 5. Email (Nodemailer SMTP) Setup

The app uses Nodemailer to send order confirmation emails over SMTP. This works with any SMTP provider.

**Option A: Gmail (easiest for testing)**
1. Enable 2-factor authentication on your Google account
2. Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use these SMTP settings:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`
   - `SMTP_PASS=your-16-char-app-password`
   - `SMTP_FROM_EMAIL=your-email@gmail.com`

**Option B: Amazon SES**
1. Create an IAM user with AmazonSESFullAccess
2. Generate SMTP credentials in the SES console
3. Use your SES region SMTP endpoint (e.g. `email-smtp.us-east-1.amazonaws.com`)
4. Set `SMTP_FROM_EMAIL` to a verified sender address

**Option C: Any other SMTP provider**
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM_EMAIL` to your provider's values

### 6. AI Assistant Setup

The AI assistant uses an OpenAI-compatible API. If no key is provided, a fallback keyword-based recommendation engine is used.

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys) or any compatible provider
2. Set these environment variables:
   - `AI_API_KEY` — your API key
   - `AI_MODEL` — model name (default: `gpt-4o-mini`)

### 7. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 8. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 9. Build for Production

```bash
npm run build
npm run preview
```

## How the AI Assistant Works

1. The user opens the chat widget (bottom-right corner) and describes what they're looking for
2. The frontend sends the conversation to the `ai-assistant` edge function
3. The edge function:
   - Fetches all active, in-stock products from Supabase
   - Builds a product catalog summary with names, prices, specs, ratings
   - Sends the conversation + catalog to the AI provider
   - The AI asks clarifying questions (budget, use case, preferences)
   - When recommending, the AI returns structured product references
4. The edge function fetches full product details for recommended products
5. The frontend displays product cards with "View" and "Add to Cart" buttons
6. The AI **never invents products** — it can only recommend from the actual database inventory

## How Orders Work

1. Customer fills checkout form and clicks "Place Order"
2. Frontend sends order data to the `create-order` edge function
3. The edge function:
   - Verifies the user's authentication session
   - Fetches product prices and stock from the database (never trusts client prices)
   - Validates stock availability for each item
   - Calculates subtotal, shipping, and total server-side
   - Creates the order with a unique order number
   - Creates order items (storing product name + price for historical accuracy)
   - Decrements stock for each product
   - Clears the user's cart
   - Sends a confirmation email via Nodemailer SMTP
   - Records email status (sent/failed) on the order
4. If the email fails, the order is still saved — the email can be retried later
5. The customer is redirected to the order success page

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | Customer profiles (auto-created on signup) |
| `categories` | Product categories |
| `products` | Product catalog with pricing, stock, specs, ratings |
| `carts` | Shopping carts per user |
| `cart_items` | Items within carts |
| `orders` | Order records with shipping and payment info |
| `order_items` | Line items (product name/price preserved for history) |
| `reviews` | Product reviews and ratings |

All tables have Row Level Security enabled with ownership-scoped policies. Public users can browse active products and categories; authenticated users can manage their own cart, orders, and reviews.

## Changing the Store Name

Edit `src/config.ts`:

```typescript
export const STORE_CONFIG = {
  name: "GadgetHub",  // ← change this
  ...
};
```

The store name is used throughout the app: navbar, footer, emails, AI greeting.

## Payment Integration

The checkout is structured to support a real payment provider. Currently "Pay on Delivery" is enabled. To add Stripe, Paystack, or Flutterwave:

1. Add the provider's API key as an environment variable
2. Update the `create-order` edge function to call the provider's API
3. Update the payment method section in `src/pages/Checkout.tsx`

The modular architecture means you only need to modify these two locations — the rest of the order flow (database, emails, cart clearing) stays the same.

## License

This is a demo project. Feel free to use it as a starting point for your own e-commerce store.
