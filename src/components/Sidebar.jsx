// 側邊導覽列
import React, { useState, useEffect, useRef, useCallback } from 'react';

function Sidebar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(parseInt(localStorage.getItem('sidebarWidthV2')) || 256); // 256px is w-64
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef(null);
    const mainContentRef = useRef(null); // Assuming you'll get main content ref or ID from App.js or context
    const resizerRef = useRef(null);

    const minSidebarWidth = 180;
    const maxSidebarWidth = 400;

    // Set initial main content margin
    useEffect(() => {
        mainContentRef.current = document.getElementById('main-content-area'); // Get main content
        if (window.innerWidth >= 768 && mainContentRef.current) { // md breakpoint
            mainContentRef.current.style.marginLeft = `${sidebarWidth}px`;
            if(sidebarRef.current) sidebarRef.current.style.width = `${sidebarWidth}px`;
        }
    }, [sidebarWidth]);
    
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const handleMouseDown = (e) => {
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

    const handleMouseMove = useCallback((e) => {
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
            if (window.innerWidth < 768) { // md breakpoint
                setIsMobileMenuOpen(false); // Close mobile menu on resize to desktop
                if (mainContentRef.current) mainContentRef.current.style.marginLeft = '0px';
                if (sidebarRef.current) sidebarRef.current.style.transform = 'translateX(-100%)';
            } else {
                if (mainContentRef.current) mainContentRef.current.style.marginLeft = `${sidebarWidth}px`;
                if (sidebarRef.current) sidebarRef.current.style.transform = 'translateX(0%)';
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarWidth]);
    
    // Active link highlighting
    useEffect(() => {
        const sections = document.querySelectorAll('#main-content-area > div > section[id]');
        const links = document.querySelectorAll('.sidebar-link');

        const observerCallback = (entries) => {
            let finalActiveId = null;
            let currentMinY = Infinity;
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.boundingClientRect.top < window.innerHeight && entry.boundingClientRect.bottom > 0) {
                         if (entry.boundingClientRect.top < currentMinY) {
                            currentMinY = entry.boundingClientRect.top;
                            finalActiveId = entry.target.getAttribute('id');
                        }
                    }
                }
            });
            links.forEach(link => link.classList.remove('active'));
            if (finalActiveId) {
                const activeNavLink = document.querySelector(`.sidebar-link[href="#${finalActiveId}"]`);
                if (activeNavLink) activeNavLink.classList.add('active');
            } else if (links.length > 0) {
                 const scrollY = window.scrollY || window.pageYOffset;
                 let foundDefault = false;
                 for (let i = sections.length - 1; i >= 0; i--) {
                     if (scrollY >= sections[i].offsetTop - (window.innerHeight * 0.3)) { // Activate if section top is within upper 30% of viewport or above
                          const defaultLink = document.querySelector(`.sidebar-link[href="#${sections[i].id}"]`);
                          if (defaultLink) { defaultLink.classList.add('active'); foundDefault = true; }
                          break;
                     }
                 }
                 if (!foundDefault && links[0]) links[0].classList.add('active');
            }
        };
        const observer = new IntersectionObserver(observerCallback, { root: null, threshold: 0, rootMargin: "0px 0px -40% 0px" });
        sections.forEach(section => observer.observe(section));
        return () => sections.forEach(section => observer.unobserve(section));
    }, []);


    return (
        <>
            {/* Hamburger Button for Mobile */}
            <button 
                id="mobile-menu-btn" 
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-700 text-white rounded-md shadow-lg"
                onClick={toggleMobileMenu}
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
                  <a href="#form-section-target" className="sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📝 新增記錄</a>
                  <a href="#list-section-target" className="sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📋 收支列表</a>
                  <a href="#report-section-target" className="sidebar-link block py-2.5 px-4 rounded-lg hover:bg-slate-700 transition duration-200" onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}>📈 財務總覽</a>
                </div>
                {/* Resizer Handle - only show on desktop */}
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