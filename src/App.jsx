import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { UserContext } from "./pages/services/context.jsx";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./pages/Layout/Layout.jsx";
import Home from "./pages/doctor/Home/Home.jsx";
import Profile from "./pages/doctor/Profile/Profile.jsx";
import Courses from "./pages/doctor/Cources/Courses.jsx";
import Login_Register from "./pages/login&Register/Login_Register.jsx";
import Notfound from "./pages/Notfound.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";
import PrivateRoute from "./pages/services/PrivateRoute.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(true);

  const router = createBrowserRouter([
    {
      element: (
        <UserContext.Provider value={{ isOpen, setIsOpen }}>
          <Layout />
        </UserContext.Provider>
      ),
      children: [
        {
          path: "/",
          element: (
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          ),
        },
        {
          path: "/home",
          element: (
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          ),
        },

        {
          path: "/profile",

          element: (
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          ),
        },

        {
          path: "/cources",
          element: (
            <PrivateRoute>
              <Courses />
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
    <>
      <Toaster
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          className: "",
          style: {
            padding: "16px",
            alignItems: "center",
            zIndex: "99999999",
            top: "40px",
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
