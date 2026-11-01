import { Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Navbar } from "../components/Navbar";

export function PublicLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="page-loader"> Loading... </div>;
  }

  return (
    // <div className="p-2 md:p-5">
    //   <div className="overflow-hidden">
    //     <Navbar />
    //     <Outlet />
    //   </div>
    // </div>

    <div className="flex min-h-screen flex-col p-2 md:p-5">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}