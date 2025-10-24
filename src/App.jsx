import Navbar from "./pages/doctor/Navbar/Navbar.jsx";
import Layout from "./pages/Layout/Layout.jsx";
import Login_Register from "./pages/login/Login_Register.jsx";
import { UserContext } from "./pages/services/context.js";
function App() {
  return (
    <UserContext.Provider>
      {/* <Login_Register /> */}
      <Layout/>
    </UserContext.Provider>
  );
}

export default App;


