const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        "Something went wrong."
    );
  }

  return data as T;
}


/* =========================================================
   AUTHENTICATION
   ========================================================= */

export async function signup(
  name: string,
  email: string,
  password: string
) {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}


export async function login(
  email: string,
  password: string
) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}


/* =========================================================
   PRODUCTS / INVENTORY
   ========================================================= */

export async function getProducts() {
  return apiRequest("/products/");
}


export async function getProduct(
  productId: number
) {
  return apiRequest(`/products/${productId}`);
}


export async function getLowStockProducts() {
  return apiRequest(
    "/products/alerts/low-stock"
  );
}


export async function updateStock(
  productId: number,
  quantity: number
) {
  return apiRequest(
    `/products/${productId}/stock`,
    {
      method: "PATCH",
      body: JSON.stringify({
        quantity,
      }),
    }
  );
}


/* =========================================================
   SALES
   ========================================================= */

export async function getSales() {
  return apiRequest("/sales/");
}


export async function createSale(
  productId: number,
  quantity: number
) {
  return apiRequest("/sales/", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      quantity,
    }),
  });
}


/* =========================================================
   BILLS
   ========================================================= */

export async function getBills() {
  return apiRequest("/bills/");
}


export async function createBill(
  customerName: string | null,
  totalAmount: number,
  paymentStatus: "paid" | "pending" = "paid"
) {
  return apiRequest("/bills/", {
    method: "POST",
    body: JSON.stringify({
      customer_name: customerName,
      total_amount: totalAmount,
      payment_status: paymentStatus,
    }),
  });
}


/* =========================================================
   UDHAAR / CREDITS
   ========================================================= */

export async function getCredits() {
  return apiRequest("/credits/");
}


export async function createCredit(
  customerName: string,
  phone: string | null,
  amount: number
) {
  return apiRequest("/credits/", {
    method: "POST",
    body: JSON.stringify({
      customer_name: customerName,
      phone,
      amount,
    }),
  });
}


export async function markCreditPaid(
  creditId: number
) {
  return apiRequest(
    `/credits/${creditId}/paid`,
    {
      method: "PATCH",
    }
  );
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

/*
 * These functions use the notification endpoints
 * exposed by the backend.
 *
 * If your notifications.py uses different paths,
 * we can adjust only these functions later.
 */

export async function getNotifications() {
  return apiRequest("/notifications/");
}


export async function getActiveNotifications() {
  return apiRequest(
    "/notifications/active"
  );
}


/* =========================================================
   DUKAANAI
   ========================================================= */

export async function parseDukaanAICommand(
  command: string
) {
  return apiRequest("/assistant/parse", {
    method: "POST",
    body: JSON.stringify({
      command,
    }),
  });
}


export async function executeDukaanAIMultiAction(
  productId: number,
  restockQuantity: number,
  saleQuantity: number
) {
  return apiRequest("/assistant/execute", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      restock_quantity: restockQuantity,
      sale_quantity: saleQuantity,
    }),
  });
}


export async function getDukaanAIInsights() {
  return apiRequest(
    "/assistant/insights"
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

export type DashboardData = {
  products: any[];
  sales: any[];
  credits: any[];
  bills: any[];
  notifications: any[];
};


export async function getDashboardData(): Promise<DashboardData> {
  const [
    products,
    sales,
    credits,
    bills,
    notifications,
  ] = await Promise.all([
    getProducts(),
    getSales(),
    getCredits(),
    getBills(),
    getNotifications(),
  ]);

  return {
    products,
    sales,
    credits,
    bills,
    notifications,
  };
}