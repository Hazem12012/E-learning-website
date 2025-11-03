import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { UserContext } from "./pages/services/context.jsx";
import { useState } from "react";
import Layout from "./pages/Layout/Layout.jsx";
import Home from "./pages/doctor/Home/Home.jsx";
import Profile from "./pages/doctor/Profile/Profile.jsx";
import Courses from "./pages/doctor/Cources/Courses.jsx";
import Login_Register from "./pages/login&Register/Login_Register.jsx";
import Notfound from "./pages/Notfound.jsx";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  const router = createBrowserRouter([
    {
      element: (
        <UserContext.Provider value={{ isOpen, setIsOpen }}>
          <Layout />
        </UserContext.Provider>
      ),
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/home",
          element: <Home />,
        },

        {
          path: "/profile",
          element: <Profile />,
        },

        {
          path: "/cources",
          element: <Courses />,
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
  return <RouterProvider router={router} />;
}

export default App;
