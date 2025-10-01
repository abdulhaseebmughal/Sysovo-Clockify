import { Routes, Route } from "react-router-dom";
import LoginForm from "./component/login";
import Dashboard from "./component/Dashboard";
import EmployeeDashboard from "./component/EmployeeDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
    </Routes>
  );
}

export default App;
