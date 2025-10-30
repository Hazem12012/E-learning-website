import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { UserContext } from "./pages/services/context.js";
import { useState } from "react";
import Layout from "./pages/Layout/Layout.jsx";
import Home from "./pages/doctor/Home/Home.jsx";
import Profile from "./pages/Profile/Profile.jsx";
import Courses from "./pages/doctor/Cources/Courses.jsx";
import Login_Register from "./pages/login/Login_Register.jsx";
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
      path: "login",
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
