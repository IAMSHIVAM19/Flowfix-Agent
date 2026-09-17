const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL !== undefined
  ? RAW_API_URL.replace(/\/+$/, "")
  : (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

const TOKEN_KEY = "flowfix_admin_token";
const TECH_TOKEN_KEY = "flowfix_tech_token";
const TECH_USER_KEY = "flowfix_tech_user";

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

// ------------------------------------------------------------
// TECHNICIAN AUTH HELPERS
// ------------------------------------------------------------

export function getTechnicianToken() {
  return localStorage.getItem(TECH_TOKEN_KEY);
}

export function setTechnicianToken(token, techData = null) {
  localStorage.setItem(TECH_TOKEN_KEY, token);
  if (techData) {
    localStorage.setItem(TECH_USER_KEY, JSON.stringify(techData));
  }
}

export function getTechnicianUser() {
  try {
    const raw = localStorage.getItem(TECH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTechnicianToken() {
  localStorage.removeItem(TECH_TOKEN_KEY);
  localStorage.removeItem(TECH_USER_KEY);
}

export function isTechnicianAuthenticated() {
  return Boolean(getTechnicianToken());
}

export function getAdminUsers() {
  return request("/admin/users");
}

export function runAgentOperation(
  message,
  requestId = null
) {
  return request(
    "/admin/agent",
    {
      method: "POST",
      body: JSON.stringify({
        request_id: requestId,
        message,
      }),
    }
  );
}

export function confirmCustomer(requestId, name, phone, address) {
  return request(`/requests/${requestId}/confirm-customer`, {
    method: "POST",
    body: JSON.stringify({
      name,
      phone,
      address,
    }),
  });
}


// ============================================================
// HTTP REQUEST HELPER
// ============================================================

async function request(
  endpoint,
  options = {}
) {
  try {
    const isTechEndpoint = endpoint.startsWith("/technician-api");
    const token = isTechEndpoint ? getTechnicianToken() : getToken();
    const clientTimezone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "Australia/Sydney";
    const clientLocalTime = new Date().toISOString();

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Client-Timezone": clientTimezone,
          "X-Client-Local-Time": clientLocalTime,

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
      // If we received an HTML response for an API call, reject it as an error
      if (
        typeof data === "string" &&
        (data.trim().startsWith("<!DOCTYPE") ||
          data.trim().startsWith("<html") ||
          data.trim().startsWith("<head"))
      ) {
        throw new Error(
          `Unexpected HTML response from server for ${endpoint}. Please refresh or check connection.`
        );
      }
    }

    // --------------------------------------------------------
    // AUTHENTICATION FAILURE
    // --------------------------------------------------------

    if (
      response.status === 401 &&
      endpoint !== "/auth/login" &&
      endpoint !== "/technician-api/login"
    ) {
      if (isTechEndpoint) {
        clearTechnicianToken();
        window.location.href = "/technician/login";
      } else {
        clearToken();
        window.location.href = "/login";
      }

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

export function getDashboardNotifications() {
  return request(
    "/dashboard/notifications"
  );
}

export function updateNotificationStatus(
  notificationId,
  status
) {
  return request(
    `/admin/notifications/${encodeURIComponent(
      notificationId
    )}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
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

export function getRequestAppointmentOptions(requestId, params = {}) {
  const queryParams = new URLSearchParams();
  if (params.appointment_date) queryParams.set("appointment_date", params.appointment_date);
  if (params.preferred_time) queryParams.set("preferred_time", params.preferred_time);
  if (params.service_name) queryParams.set("service_name", params.service_name);
  const qs = queryParams.toString();
  return request(`/requests/${encodeURIComponent(requestId)}/appointment-options${qs ? `?${qs}` : ""}`);
}

export function adminBookAppointment(requestId, payload) {
  return request(`/requests/${encodeURIComponent(requestId)}/admin-book`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function getTechnicianServices() {
  return request(
    "/technicians/services"
  );
}

export function createTechnician(payload) {
  return request(
    "/technicians",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
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


// ============================================================
// TECHNICIAN PORTAL API
// ============================================================

export async function technicianLogin(usernameOrId, pin = "1234") {
  const data = await request("/technician-api/login", {
    method: "POST",
    body: JSON.stringify({
      username_or_id: String(usernameOrId),
      pin: String(pin),
    }),
  });
  setTechnicianToken(data.access_token, {
    id: data.technician_id,
    name: data.technician_name,
  });
  return data;
}

export function technicianLogout() {
  clearTechnicianToken();
}

export function getActiveTechniciansList() {
  return request("/technician-api/list");
}

export function getTechnicianMe() {
  return request("/technician-api/me");
}

export function getTechnicianBookings() {
  return request("/technician-api/bookings");
}

export function updateTechnicianBookingStatus(appointmentId, status, reason = null, notes = null) {
  return request(`/technician-api/bookings/${encodeURIComponent(appointmentId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      reason,
      notes,
    }),
  });
}

export function getTechnicianSchedule() {
  return request("/technician-api/schedule");
}

