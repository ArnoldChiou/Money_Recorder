// src/components/Sidebar.tsx
import * as React from 'react';
import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuthUser } from '../hooks/useAuthUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faList, faUsers, faCreditCard } from '@fortawesome/free-solid-svg-icons';

const Sidebar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
        const savedWidth = localStorage.getItem('sidebarWidthV2');
        return savedWidth ? parseInt(savedWidth, 10) : 256;
    });
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const mainContentRef = useRef<HTMLElement | null>(null);
    const resizerRef = useRef<HTMLDivElement | null>(null);
    const { user } = useAuthUser();
    const location = useLocation();

    const minSidebarWidth = 180;
    const maxSidebarWidth = 400;

    useEffect(() => {
        mainContentRef.current = document.getElementById('main-content-area');
        if (window.innerWidth >= 768 && mainContentRef.current) {
            mainContentRef.current.style.marginLeft = `${sidebarWidth}px`;
            if(sidebarRef.current) sidebarRef.current.style.width = `${sidebarWidth}px`;
        }
    }, [sidebarWidth]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.classList.add('resizing-active');
    };

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            setIsResizing(false);
            document.body.classList.remove('resizing-active');
            localStorage.setItem('sidebarWidthV2', sidebarWidth.toString());
        }
    }, [isResizing, sidebarWidth]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        newWidth = Math.max(minSidebarWidth, Math.min(newWidth, maxSidebarWidth));
        setSidebarWidth(newWidth);
    }, [isResizing, minSidebarWidth, maxSidebarWidth]);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const handleResize = () => {
             mainContentRef.current = document.getElementById('main-content-area'); // 確保元素存在
            if (window.innerWidth < 768) {
                setIsMobileMenuOpen(false); // 在視窗變動時自動關閉選單
                if (mainContentRef.current) mainContentRef.current.style.marginLeft = '0px';
                // 移除 transform 的直接設定，讓 className 控制
            } else {
                if (mainContentRef.current) mainContentRef.current.style.marginLeft = `${sidebarWidth}px`;
                 if (sidebarRef.current) sidebarRef.current.style.width = `${sidebarWidth}px`;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // 初始化
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarWidth]); // 此處的依賴項是為了在拖曳寬度後能正確更新

    const isActive = (path: string) => location.pathname === path;

     // Active link highlighting
    useEffect(() => {
        const mainArea = document.getElementById('main-content-area');
        if (!mainArea) return;

        const sections = Array.from(mainArea.querySelectorAll('section[id]')) as HTMLElement[];
        const links = Array.from(document.querySelectorAll('.sidebar-link')) as HTMLAnchorElement[];

        if (sections.length === 0 || links.length === 0) return;

        const observerCallback: IntersectionObserverCallback = (entries) => {
            let finalActiveId: string | null = null;
            let currentMinY = Infinity;

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const top = entry.boundingClientRect.top;
                    if (top < window.innerHeight && entry.boundingClientRect.bottom > 0) {
                        if (top < currentMinY) {
                            currentMinY = top;
                            finalActiveId = entry.target.getAttribute('id');
                        }
                    }
                }
            });

            links.forEach(link => link.classList.remove('active'));

            if (finalActiveId) {
                const activeNavLink = document.querySelector(`.sidebar-link[href="#${finalActiveId}"]`);
                if (activeNavLink) activeNavLink.classList.add('active');
            } else {
                 const scrollY = window.scrollY || window.pageYOffset;
                 let foundDefault = false;
                 for (let i = sections.length - 1; i >= 0; i--) {
                     if (scrollY >= sections[i].offsetTop - (window.innerHeight * 0.3)) {
                          const defaultLink = document.querySelector(`.sidebar-link[href="#${sections[i].id}"]`);
                          if (defaultLink) { defaultLink.classList.add('active'); foundDefault = true; }
                          break;
                     }
                 }
                 if (!foundDefault && links[0]) links[0].classList.add('active');
            }
        };

        const observer = new IntersectionObserver(observerCallback, {
            root: null,
            threshold: 0,
            rootMargin: "0px 0px -40% 0px"
        });

        sections.forEach(section => observer.observe(section));

        return () => sections.forEach(section => observer.unobserve(section));
    }, []);


    return (
        <>
            <button
                id="mobile-menu-btn"
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-700 text-white rounded-md shadow-lg"
                onClick={toggleMobileMenu}
                aria-label="開啟選單"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </button>

            <nav
                id="sidebar"
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full bg-slate-800 text-white p-5 flex flex-col space-y-3 z-40 shadow-lg
                            transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
                            transition-transform duration-300 ease-in-out`}
                 style={{ width: window.innerWidth >= 768 ? `${sidebarWidth}px` : '16rem' }}
            >
                <h1 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-3">功能選單</h1>
                <div className="flex flex-col gap-2 flex-1 justify-start">
                  <Link to="/" className={`sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200 ${isActive('/') ? 'active' : ''}`} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📝 首頁</Link>
                  <Link to="/add-transaction" className={`sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200 ${isActive('/add-transaction') ? 'active' : ''}`} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>➕ 新增紀錄</Link>
                  <Link to="/transactions" className={`sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200 ${isActive('/transactions') ? 'active' : ''}`} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>🧾 收支列表</Link>
                  <Link to="/reports" className={`sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200 ${isActive('/reports') ? 'active' : ''}`} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📊 財務分析</Link>
                  <Link to="/accounts" className={`sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200 ${isActive('/accounts') ? 'active' : ''}`} onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📂 帳戶管理</Link>
                </div>
                {user && (
                  <div className="mt-6 border-t border-slate-700 pt-4 text-sm flex flex-col gap-2">
                    <span className="text-gray-300 break-all">{user.email}</span>
                    <button onClick={() => signOut(auth)} className="text-indigo-300 hover:underline text-left">登出</button>
                  </div>
                )}
                <div
                    id="sidebar-resizer"
                    ref={resizerRef}
                    className="hidden md:block w-2 h-full bg-slate-600 hover:bg-slate-500 cursor-col-resize absolute top-0 -right-1 z-45 opacity-50 hover:opacity-100 transition-opacity"
                    onMouseDown={handleMouseDown}
                ></div>
            </nav>
        </>
    );
}
export default Sidebar;