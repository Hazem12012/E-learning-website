import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthContextProvider } from "./pages/services/AuthContext.jsx";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/Layout/Layout.jsx";
import Login_Register from "./pages/login&Register/Login_Register.jsx";
import Notfound from "./pages/Notfound.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import PrivateRoute from "./pages/services/PrivateRoute.jsx";
import Loading from "./components/Loading/Loading.jsx";

// Lazy load all major components
const Home = React.lazy(() => import("./Home/Home.jsx"));
const Profile = React.lazy(() => import("./Profile/Profile.jsx"));
const Courses = React.lazy(() => import("./Cources/CoursesPage.jsx"));
import CourseDetailsPage from './Cources/CourseDetailsPage.jsx';

function App() {

  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: "/",
          element: (
            <PrivateRoute>
              <Suspense fallback={<Loading />}>
                <Home />
              </Suspense>
            </PrivateRoute>
          ),
        },
        {
          path: "/home",
          element: (
            <PrivateRoute>
              <Suspense fallback={<Loading />}>
                <Home />
              </Suspense>
            </PrivateRoute>
          ),
        },
        {
          path: "/profile",
          element: (
            <PrivateRoute>
              <Suspense fallback={<Loading />}>
                <Profile />
              </Suspense>
            </PrivateRoute>
          ),
        },
        {
          path: "/cources",
          element: (
            <PrivateRoute>
              <Suspense fallback={<Loading />}>
                <Courses />
              </Suspense>
            </PrivateRoute>
          ),
        },
        {
          path: "/cources/:courseId",
          element: (
            <PrivateRoute>
              <Suspense fallback={<Loading />}>
                <CourseDetailsPage />
              </Suspense>
            </PrivateRoute>
          ),
        },
      ],
    },
    {
      element: <Login_Register />,
      children: [
        {
          element: <Register />,
          path: "/register",
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          element: <ForgotPassword />,
          path: "/forgotpassword",
        },
      ],
    },
    {
      element: <Notfound />,
      path: "*",
    },
  ]);

  return (
    <AuthContextProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          style: {
            padding: "16px",
            zIndex: 99999999,
          },
        }}
      />
    </AuthContextProvider>
  );
}

export default App;