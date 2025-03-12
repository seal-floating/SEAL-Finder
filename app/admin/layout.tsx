'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Season Management', path: '/admin/seasons' },
    // More admin menu items can be added here
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex min-h-screen flex-col">
        <header className="bg-emerald-800 text-white">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/" className="text-xl font-bold">
                Find the SEAL
              </Link>
              <span className="text-sm bg-emerald-700 px-2 py-0.5 rounded">Admin</span>
            </div>
            <nav>
              <Link href="/" className="hover:underline">
                Back to Main
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="w-64 bg-emerald-700 text-white p-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-2 rounded ${
                    pathname === item.path
                      ? 'bg-emerald-600 font-medium'
                      : 'hover:bg-emerald-600/50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}