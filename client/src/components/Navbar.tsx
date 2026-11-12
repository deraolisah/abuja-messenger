import { ArrowUpRight, ChevronDown, Menu, Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/favicon.png";

export function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="fixed z-60 top-4 left-1/2 -translate-x-1/2 w-[calc(100%-30px)] md:top-0 md:relative h-14 md:h-24 md:w-full">
        <div className="w-full h-full flex items-center justify-between gap-2.5 py-2 px-2 md:px-8 bg-white md:bg-primary/10 rounded-full md:rounded-t-3xl! md:rounded-none shadow-lg shadow-primary/10! md:shadow-none!">
          <div className="w-full flex items-center justify-start">
            <Link to="/" aria-label="Abuja Messenger" className="ml-2 flex items-center gap-1.5 md:gap-2.25 text-xs md:text-sm font-semibold leading-4.5">
              <img src={logo} alt="Abuja Messsenger Logo" className="object-contain w-10 md:w-12 h-fit" />
              <span className="mt-px leading-tight">
                Abuja
                <br />
                Messenger
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center justify-center w-full">
            <div className="bg-white p-1 shadow-none rounded-xl flex items-center text-nowrap">
              <Link
                to="/about"
                className="text-sm text-slate-500 transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-lg"
              >
                About
              </Link>
              <a
                href="#business"
                className="text-sm text-slate-500 transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-lg"
              >
                Customers
              </a>

              <div className="group relative">
                <button
                  type="button"
                  className="text-sm text-slate-500 transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-lg flex items-center gap-1"
                >
                  Features
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </button>

                <div
                  className="
                    absolute top-full left-0 z-50 pt-2
                    opacity-0 invisible pointer-events-none
                    group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto
                    group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto
                    transition-all duration-150
                    translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0
                  "
                >
                  <div className="w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-2">
                    <ul className="text-sm">
                      <li>
                        <Link to="/how-it-works" className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                          How it works
                        </Link>
                      </li>
                      <li>
                        <Link to="/docs" className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                          Docs
                        </Link>
                      </li>
                      <li>
                        <Link to="/pricing" className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                          Pricing
                        </Link>
                      </li>
                      <li>
                        <Link to="/blog" className="block px-3 py-2 rounded-lg hover:bg-primary/10 transition">
                          Blog
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link
                to="/track"
                className="text-sm text-slate-500 transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-lg"
              >
                Track a delivery
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-end w-full">
            {user ? (
              <Link to="/app" className="button-secondary">
                <Package className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <Link to="/register" className="button-secondary text-nowrap border-none">
                Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <button
            type="button"
            className="grid h-9.5 min-w-9.5 place-items-center rounded-full border border-ink md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>

        {mobileOpen && (
          // ✅ Fixed height so sheet fits under nav; overflow-y-auto so long lists scroll
          <div className="container-shell bg-white border-t border-slate-100 mt-2 px-2 py-3 md:hidden rounded-2xl overflow-y-auto shadow-lg shadow-primary/10!">
            <div className="grid grid-cols-3 gap-x-1 gap-y-2 text-sm font-medium text-slate-600">
              <Link to="/" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Home </Link>
              <Link to="/about" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> About </Link>
              <Link to="/contact" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Contact </Link>
              <Link to="/docs" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Docs </Link>

              {/* ✅ Fixed "Features" — was jumping to #business (wrong section) */}
              <Link to="/how-it-works" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> How it works </Link>
              <Link to="/pricing" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Pricing </Link>
              <Link to="/blog" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Blog </Link>
              <a href="#business" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Customers </a>
              <Link to="/track" className="transition duration-500 hover:bg-primary/10 p-2 px-3 rounded-xl"> Track </Link>
            </div>
          </div>
        )}

      </nav>
      {mobileOpen && (
        <div className="fixed z-50 inset-0 bg-black/65 cursor-pointer" onClick={() => {setMobileOpen(false)}}></div>
      )}
    </>
  );
}