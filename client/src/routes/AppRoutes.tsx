import { Route, Routes } from "react-router-dom";
import { PublicLayout } from "../layouts/PublicLayout.tsx";
import { DashboardLayout } from "../layouts/DashboardLayout.tsx";

import { ProtectedRoute } from "../components/auth/ProtectedRoute.tsx";


import { CustomerAppPage } from "../pages/CustomerAppPage.tsx";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage.tsx";
import { HomePage } from "../pages/HomePage.tsx";
import { About } from "../pages/About.tsx";
import { Pricing } from "../pages/Pricing.tsx";
import { OrderPage } from "../pages/OrderPage.tsx";
import { LoginPage } from "../pages/LoginPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { RegisterPage } from "../pages/RegisterPage.tsx";
import { TrackPage } from "../pages/TrackPage.tsx";
import HowItWorks from "../pages/HowItWorks.tsx";
import Docs from "../pages/Docs.tsx";
import Blog from "../pages/Blog.tsx";



export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingCode" element={<TrackPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/blog" element={<Blog />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />


      {/*  */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin'] }>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerAppPage />} />
      </Route>
    </Routes>
  );
}