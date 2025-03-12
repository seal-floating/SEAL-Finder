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
    { name: '시즌 관리', path: '/admin/seasons' },
    // 추후 다른 관리 메뉴 추가 가능
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
              <span className="text-sm bg-emerald-700 px-2 py-0.5 rounded">관리자</span>
            </div>
            <nav>
              <Link href="/" className="hover:underline">
                메인으로 돌아가기
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1">
          {/* 사이드바 */}
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

          {/* 메인 콘텐츠 */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </>
  );
}