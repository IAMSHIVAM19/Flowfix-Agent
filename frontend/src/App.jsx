import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminOnlyRoute from "./components/AdminOnlyRoute";

import Overview from "./pages/Overview";
import Requests from "./pages/Requests";
import Appointments from "./pages/Appointments";
import Technicians from "./pages/Technicians";
import Customers from "./pages/Customers";
import Agent from "./pages/Agent";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

import CustomerPortal from "./customer/CustomerPortal";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/customer-portal"
          element={<CustomerPortal />}
        />


        {/* ==================================================
            PROTECTED ADMIN ROUTES
        ================================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/"
              element={<Overview />}
            />

            <Route
              path="/requests"
              element={<Requests />}
            />

            <Route
              path="/appointments"
              element={<Appointments />}
            />

            <Route
              path="/technicians"
              element={<Technicians />}
            />

            <Route
              path="/customers"
              element={<Customers />}
            />

            <Route
              path="/agent"
              element={<Agent />}
            />


            {/* Administrator-only */}
            <Route element={<AdminOnlyRoute />}>
              <Route
                path="/settings"
                element={<Settings />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;