import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface CreateOrderInput {
  items: OrderItemInput[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  payment_method: string;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `GH-${timestamp}-${random}`;
}

async function sendEmail(
  orderData: Record<string, unknown>,
  orderItems: Array<{ product_name: string; product_price: number; quantity: number; subtotal: number }>,
): Promise<boolean> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS");
  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "orders@gadgethub.com";
  const storeName = Deno.env.get("STORE_NAME") || "GadgetHub";

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("SMTP credentials not configured");
    return false;
  }

  const orderNumber = orderData.order_number as string;
  const customerName = orderData.customer_name as string;
  const customerEmail = orderData.customer_email as string;
  const orderDate = new Date(orderData.created_at as string).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const subtotal = Number(orderData.subtotal);
  const shippingFee = Number(orderData.shipping_fee);
  const total = Number(orderData.total);
  const currency = orderData.currency as string;
  const paymentMethod = (orderData.payment_method as string).replace(/_/g, " ");
  const shippingAddress = orderData.shipping_address as string;
  const shippingCity = orderData.shipping_city as string;
  const shippingState = orderData.shipping_state as string;
  const shippingCountry = orderData.shipping_country as string;
  const shippingPostal = orderData.shipping_postal_code as string || "";

  const itemsHtml = orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.product_price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px;">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${storeName}</h1>
      <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Order Confirmation</p>
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 22px;">Thank you for your order, ${customerName}!</h2>
      <p style="color: #64748b; margin: 0 0 24px; font-size: 15px;">We've received your order and are preparing it for shipment.</p>

      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Number</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Date</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${orderDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Payment Method</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right; text-transform: capitalize;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Order Status</td>
            <td style="padding: 6px 0; color: #16a34a; font-weight: 600; text-align: right;">Confirmed</td>
          </tr>
        </table>
      </div>

      <h3 style="color: #0f172a; font-size: 17px; margin: 0 0 12px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 12px; text-align: left; color: #64748b; font-weight: 600;">Product</th>
            <th style="padding: 12px; text-align: center; color: #64748b; font-weight: 600;">Qty</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Price</th>
            <th style="padding: 12px; text-align: right; color: #64748b; font-weight: 600;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 24px;">
        <div style="display: inline-block; min-width: 200px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Subtotal</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${currency} ${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Shipping</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${currency} ${shippingFee.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a;">
              <td style="padding: 12px 0; color: #0f172a; font-weight: 700; font-size: 16px;">Total</td>
              <td style="padding: 12px 0; color: #0f172a; font-weight: 700; font-size: 16px; text-align: right;">${currency} ${total.toFixed(2)}</td>
            </tr>
          </table>
        </div>
      </div>

      <h3 style="color: #0f172a; font-size: 17px; margin: 0 0 12px;">Shipping Address</h3>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #334155; line-height: 1.6;">
        <strong>${customerName}</strong><br>
        ${shippingAddress}<br>
        ${shippingCity}, ${shippingState} ${shippingPostal}<br>
        ${shippingCountry}
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0;">Need help? Contact our support team at ${fromEmail}</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">&copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `${storeName} <${fromEmail}>`,
      to: customerEmail,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Email send error:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the user's session
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json() as CreateOrderInput;

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Order must contain at least one item" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!body.customer_name?.trim()) {
      return new Response(JSON.stringify({ error: "Customer name is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body.customer_email?.trim()) {
      return new Response(JSON.stringify({ error: "Customer email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!body.shipping_address?.trim() || !body.shipping_city?.trim() || !body.shipping_state?.trim() || !body.shipping_country?.trim()) {
      return new Response(JSON.stringify({ error: "Complete shipping address is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch products from DB — NEVER trust client-supplied prices
    const productIds = body.items.map((item) => item.product_id);
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, is_active")
      .in("id", productIds);

    if (prodError) throw prodError;

    // Validate stock and build order items server-side
    const orderItems: Array<{ product_id: string; product_name: string; product_price: number; quantity: number; subtotal: number }> = [];
    let subtotal = 0;
    const stockUpdates: Array<{ id: string; newStock: number }> = [];

    for (const item of body.items) {
      const product = dbProducts?.find((p) => p.id === item.product_id);
      if (!product || !product.is_active) {
        return new Response(
          JSON.stringify({ error: `Product not found or unavailable` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        product_price: Number(product.price),
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
      stockUpdates.push({ id: product.id, newStock: product.stock_quantity - item.quantity });
    }

    // Calculate shipping fee server-side
    const shippingFee = subtotal >= 100 ? 0 : 15;
    const total = subtotal + shippingFee;
    const orderNumber = generateOrderNumber();

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone || null,
        shipping_address: body.shipping_address,
        shipping_city: body.shipping_city,
        shipping_state: body.shipping_state,
        shipping_country: body.shipping_country,
        shipping_postal_code: body.shipping_postal_code || null,
        subtotal,
        shipping_fee: shippingFee,
        total,
        currency: "USD",
        payment_method: body.payment_method || "pay_on_delivery",
        payment_status: "pending",
        order_status: "confirmed",
        email_status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsInsert = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsInsert);

    if (itemsError) throw itemsError;

    // Decrement stock atomically
    for (const update of stockUpdates) {
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock_quantity: update.newStock })
        .eq("id", update.id);
      if (stockError) console.error("Stock update error for product", update.id, stockError);
    }

    // Clear the user's cart
    const { data: userCart } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (userCart) {
      await supabase.from("cart_items").delete().eq("cart_id", userCart.id);
    }

    // Send confirmation email via Nodemailer SMTP
    let emailStatus = "pending";
    try {
      const emailSent = await sendEmail(order, orderItems);
      emailStatus = emailSent ? "sent" : "failed";
    } catch {
      emailStatus = "failed";
    }

    // Update email status on the order
    await supabase
      .from("orders")
      .update({ email_status: emailStatus })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          ...order,
          email_status: emailStatus,
          items: orderItems,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Create order error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create order. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
