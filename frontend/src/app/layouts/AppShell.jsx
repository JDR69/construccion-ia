import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

function IconHome(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function IconList(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
  )
}

function IconChart(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  )
}

function IconMoon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
}

function IconSun(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
}

function IconBell(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function IconGrid(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function IconExit(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H9m0 0l3-3m-3 3l3 3" />
    </svg>
  )
}

function SidebarItem({ to, icon: Icon, label, variant, sidebarOpen }) {
  const base =
    variant === 'max'
      ? 'hover:ml-4 w-full p-2 pl-8 rounded-full transform ease-in-out duration-300 flex flex-row items-center space-x-3'
      : 'hover:ml-4 justify-end pr-5 w-full p-3 rounded-full transform ease-in-out duration-300 flex'

  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const active = isActive
          ? 'text-white dark:hover:text-[#38BDF8]'
          : 'text-white hover:text-purple-500 dark:hover:text-[#38BDF8]'
        const bg = 'bg-[#1E293B]'
        return [base, bg, active].join(' ')
      }}
      title={!sidebarOpen && variant === 'mini' ? label : undefined}
    >
      <Icon className="w-4 h-4" />
      {variant === 'max' ? <div>{label}</div> : null}
    </NavLink>
  )
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [isDark])

  const sidebarClass = useMemo(() => {
    const translate = sidebarOpen ? 'translate-x-none' : '-translate-x-48'
    return [
      'w-60 fixed transition transform ease-in-out duration-1000 z-50 flex h-screen bg-[#1E293B]',
      translate,
    ].join(' ')
  }, [sidebarOpen])

  const contentClass = useMemo(() => {
    return [
      'content transform ease-in-out duration-500 pt-20 px-2 md:px-5 pb-4',
      sidebarOpen ? 'ml-12 md:ml-60' : 'ml-12',
    ].join(' ')
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F172A]">
      {/* TOP BAR */}
      <div className="fixed w-full z-30 flex bg-white dark:bg-[#0F172A] p-2 items-center justify-center h-16 px-10">
        <div className="logo ml-12 dark:text-white transform ease-in-out duration-500 flex-none h-full flex items-center justify-center">
          De Plano a Presupuesto
        </div>

        <div className="grow h-full flex items-center justify-center" />

        <div className="flex-none h-full text-center flex items-center justify-center">
          <div className="flex space-x-3 items-center px-3">
            <div className="flex-none flex justify-center">
              <div className="w-8 h-8 flex">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShta_GXR2xdnsxSzj_GTcJHcNykjVKrCBrZ9qouUl0usuJWG2Rpr_PbTDu3sA9auNUH64&usqp=CAU"
                  alt="profile"
                  className="shadow rounded-full object-cover"
                />
              </div>
            </div>
            <div className="hidden md:block text-sm md:text-md text-black dark:text-white">
              John Doe
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={sidebarClass}>
        {/* open sidebar button */}
        <div
          className={[
            'max-toolbar w-full -right-6 transition transform ease-in duration-300 flex items-center justify-between',
            'border-4 border-white dark:border-[#0F172A] bg-[#1E293B] absolute top-2 rounded-full h-12',
            sidebarOpen ? 'translate-x-0 scale-x-100' : 'translate-x-24 scale-x-0',
          ].join(' ')}
        >
          <div className="flex pl-4 items-center space-x-2">
            <div>
              {!isDark ? (
                <button
                  type="button"
                  onClick={() => setIsDark(true)}
                  className="moon text-white hover:text-blue-500 dark:hover:text-[#38BDF8]"
                  aria-label="Activar modo oscuro"
                >
                  <IconMoon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDark(false)}
                  className="sun text-white hover:text-blue-500 dark:hover:text-[#38BDF8]"
                  aria-label="Activar modo claro"
                >
                  <IconSun className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              className="text-white hover:text-blue-500 dark:hover:text-[#38BDF8]"
              aria-label="Notificaciones (mock)"
            >
              <IconBell className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-3 group bg-gradient-to-r dark:from-cyan-500 dark:to-blue-500 from-indigo-500 via-purple-500 to-purple-500 pl-10 pr-2 py-1 rounded-full text-white">
            <div className="transform ease-in-out duration-300 mr-12">NERVE</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className={[
            '-right-6 transition transform ease-in-out duration-500 flex border-4 border-white dark:border-[#0F172A]',
            'bg-[#1E293B] dark:hover:bg-blue-500 hover:bg-purple-500 absolute top-2 p-3 rounded-full text-white',
            'hover:rotate-45',
          ].join(' ')}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          <IconGrid className="w-4 h-4" />
        </button>

        {/* MAX SIDEBAR */}
        <div
          className={[
            'max text-white mt-20 flex-col space-y-2 w-full h-[calc(100vh)]',
            sidebarOpen ? 'flex' : 'hidden',
          ].join(' ')}
        >
          <SidebarItem
            to="/dashboard"
            icon={IconHome}
            label="Home"
            variant="max"
            sidebarOpen={sidebarOpen}
          />
          <SidebarItem
            to="/dashboard"
            icon={IconList}
            label="Table"
            variant="max"
            sidebarOpen={sidebarOpen}
          />
          <SidebarItem
            to="/workspace/PRJ-001"
            icon={IconChart}
            label="Graph"
            variant="max"
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* MINI SIDEBAR */}
        <div
          className={[
            'mini mt-20 flex flex-col space-y-2 w-full h-[calc(100vh)]',
            sidebarOpen ? 'hidden' : 'flex',
          ].join(' ')}
        >
          <SidebarItem
            to="/dashboard"
            icon={IconHome}
            label="Home"
            variant="mini"
            sidebarOpen={sidebarOpen}
          />
          <SidebarItem
            to="/dashboard"
            icon={IconList}
            label="Table"
            variant="mini"
            sidebarOpen={sidebarOpen}
          />
          <SidebarItem
            to="/workspace/PRJ-001"
            icon={IconChart}
            label="Graph"
            variant="mini"
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* EXIT (BOTTOM) */}
        <div className="absolute bottom-4 left-0 w-full px-3">
          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="hover:ml-4 w-full text-white hover:text-purple-500 dark:hover:text-[#38BDF8] bg-[#1E293B] p-2 pl-8 rounded-full transform ease-in-out duration-300 flex flex-row items-center space-x-3"
            >
              <IconExit className="w-4 h-4" />
              <div>Salir</div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="hover:ml-4 justify-end pr-5 text-white hover:text-purple-500 dark:hover:text-[#38BDF8] w-full bg-[#1E293B] p-3 rounded-full transform ease-in-out duration-300 flex"
              title="Salir"
              aria-label="Salir"
            >
              <IconExit className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* CONTENT */}
      <div className={contentClass}>
        <Outlet />
      </div>
    </div>
  )
}
