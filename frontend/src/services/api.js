const API_URL = "http://127.0.0.1:8000";

const TOKEN_KEY = "flowfix_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getAdminUsers() {
  return request("/admin/users");
}


// ============================================================
// HTTP REQUEST HELPER
// ============================================================

async function request(
  endpoint,
  options = {}
) {
  try {
    const token = getToken();

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...(options.headers || {}),
        },
      }
    );

    let data = null;

    const contentType =
      response.headers.get(
        "content-type"
      );

    if (
      contentType &&
      contentType.includes(
        "application/json"
      )
    ) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // --------------------------------------------------------
    // AUTHENTICATION FAILURE
    // --------------------------------------------------------

    if (
      response.status === 401 &&
      endpoint !== "/auth/login"
    ) {
      clearToken();

      window.location.href = "/login";

      return null;
    }

    // --------------------------------------------------------
    // OTHER HTTP ERRORS
    // --------------------------------------------------------

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data?.detail
          ? data.detail
          : `Request failed: ${response.status} ${response.statusText}`;

      const error = new Error(message);

      error.status =
        response.status;

      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the FlowFix API. Please check that the backend is running."
      );
    }

    throw error;
  }
}


// ============================================================
// AUTHENTICATION
// ============================================================

export async function login(
  username,
  password
) {
  const data = await request(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  setToken(data.access_token);

  return data;
}

export function logout() {
  clearToken();
}

export function getCurrentAdmin() {
  return request("/auth/me");
}

// ============================================================
// DASHBOARD
// ============================================================

export function getDashboardSummary() {
  return request(
    "/dashboard/summary"
  );
}


// ============================================================
// REQUESTS
// ============================================================

export function getRequests() {
  return request("/requests");
}

export function getRequest(requestId) {
  return request(
    `/requests/${encodeURIComponent(
      requestId
    )}`
  );
}

export function provideRequestInformation(
  requestId,
  message
) {
  return request(
    `/requests/${encodeURIComponent(
      requestId
    )}/information`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
      }),
    }
  );
}

// ============================================================
// APPOINTMENTS
// ============================================================

export function getAppointments() {
  return request(
    "/appointments"
  );
}


// ============================================================
// TECHNICIANS
// ============================================================

export function getTechnicians() {
  return request(
    "/technicians"
  );
}

export function getTechnicianAvailability(
  technicianId
) {
  return request(
    `/technicians/${encodeURIComponent(
      technicianId
    )}/availability`
  );
}


// ============================================================
// CUSTOMERS
// ============================================================

export function getCustomers() {
  return request(
    "/customers"
  );
}

export function getCustomer(
  customerId
) {
  return request(
    `/customers/${encodeURIComponent(
      customerId
    )}`
  );
}

export function createAdminUser(
  username,
  password,
  role
) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      role,
    }),
  });
}


export function updateAdminUserStatus(
  userId,
  isActive
) {
  return request(
    `/admin/users/${encodeURIComponent(
      userId
    )}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );
}

export function updateAdminUserRole(
  userId,
  role
) {
  return request(
    `/admin/users/${encodeURIComponent(
      userId
    )}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({
        role,
      }),
    }
  );
}

export function createCustomerRequest(
  name,
  phone,
  address,
  message
) {
  return request("/requests", {
    method: "POST",
    body: JSON.stringify({
      name,
      phone,
      address,
      message,
    }),
  });
}

export function confirmCustomerRequest(
  requestId,
  optionId
) {
  return request(
    `/requests/${encodeURIComponent(
      requestId
    )}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({
        option_id: optionId,
      }),
    }
  );
}

