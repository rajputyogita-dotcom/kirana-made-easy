const API_URL = "http://192.168.29.166:8000";
async function handleResponse(
  response: Response,
  fallbackMessage: string
) {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null);

    throw new Error(
      error?.detail || fallbackMessage
    );
  }

  return response.json();
}

/* ---------------- PRODUCTS ---------------- */

export async function getProducts() {
  const response = await fetch(
    `${API_URL}/products/`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch products"
  );
}

export async function getLowStockAlerts() {
  const response = await fetch(
    `${API_URL}/products/alerts/low-stock`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch low-stock alerts"
  );
}

export async function updateProductStock(
  productId: number,
  quantity: number
) {
  const response = await fetch(
    `${API_URL}/products/${productId}/stock`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to update stock"
  );
}

/* ---------------- SALES ---------------- */

export async function getSales() {
  const response = await fetch(
    `${API_URL}/sales/`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch sales"
  );
}

export async function createSale(
  productId: number,
  quantity: number
) {
  const response = await fetch(
    `${API_URL}/sales/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to create sale"
  );
}

/* ---------------- UDHAAR ---------------- */

export async function getCredits() {
  const response = await fetch(
    `${API_URL}/credits/`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch credit records"
  );
}

export async function createCredit(
  customerName: string,
  phone: string,
  amount: number
) {
  const response = await fetch(
    `${API_URL}/credits/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_name: customerName,
        phone,
        amount,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to add udhaar"
  );
}

export async function markCreditPaid(
  creditId: number
) {
  const response = await fetch(
    `${API_URL}/credits/${creditId}/paid`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(
    response,
    "Failed to mark udhaar as paid"
  );
}

/* ---------------- BILLS ---------------- */

export async function getBills() {
  const response = await fetch(
    `${API_URL}/bills/`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch bills"
  );
}

export async function createBill(
  customerName: string,
  totalAmount: number,
  paymentStatus: string
) {
  const response = await fetch(
    `${API_URL}/bills/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_name:
          customerName || null,
        total_amount: totalAmount,
        payment_status:
          paymentStatus,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to create bill"
  );
}

/* ---------------- NOTIFICATIONS ---------------- */

export async function getNotifications() {
  const response = await fetch(
    `${API_URL}/notifications/`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch notifications"
  );
}

export async function resolveNotification(
  notificationId: number
) {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/resolve`,
    {
      method: "PATCH",
    }
  );

  return handleResponse(
    response,
    "Failed to resolve notification"
  );
}

/* ---------------- DASHBOARD ---------------- */

export async function getDashboardData() {
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

/* ---------------- DUKAANAI ---------------- */

export async function parseAssistantCommand(
  command: string
) {
  const response = await fetch(
    `${API_URL}/assistant/parse`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        command,
      }),
    }
  );

  return handleResponse(
    response,
    "DukaanAI could not understand the command"
  );
}

export async function executeAssistantAction(
  productId: number,
  restockQuantity: number,
  saleQuantity: number
) {
  const response = await fetch(
    `${API_URL}/assistant/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        restock_quantity:
          restockQuantity,
        sale_quantity:
          saleQuantity,
      }),
    }
  );

  return handleResponse(
    response,
    "DukaanAI action could not be completed"
  );
}
/* ---------------- DUKAANAI INSIGHTS ---------------- */

export async function getDukaanAIInsights() {
  const response = await fetch(
    `${API_URL}/assistant/insights`,
    {
      cache: "no-store",
    }
  );

  return handleResponse(
    response,
    "Failed to fetch DukaanAI insights"
  );
}