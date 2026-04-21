import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../hooks/useAuth.jsx'
import { useProyectos } from '../hooks/useProyectos'

import { ListaProyectos } from '../modules/dashboard/ListaProyectos'
import { ProyectoPreview } from '../dashboard/ProyectoPreview'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    </svg>
  )
}

function IconMoon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  )
}

function IconSun(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  )
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  )
}

function IconGrid(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  )
}

function IconExit(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l-3-3m3 3l-3 3m3-3H9"
      />
    </svg>
  )
}

function SidebarItem({ icon: Icon, label, sidebarOpen, onClick, title }) {
  if (sidebarOpen) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="hover:ml-4 w-full text-white hover:text-purple-500 dark:hover:text-[#38BDF8] bg-[#1E293B] p-2 pl-8 rounded-full transform ease-in-out duration-300 flex flex-row items-center space-x-3"
      >
        <Icon className="w-4 h-4" />
        <div>{label}</div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className="hover:ml-4 justify-end pr-5 text-white hover:text-purple-500 dark:hover:text-[#38BDF8] w-full bg-[#1E293B] p-3 rounded-full transform ease-in-out duration-300 flex"
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { items, isLoading, error, refresh, create, update, remove } =
    useProyectos()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark])

  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [previewing, setPreviewing] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const proyectos = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((p) => {
      const t = String(p.titulo ?? '').toLowerCase()
      const d = String(p.descripcion ?? '').toLowerCase()
      return t.includes(q) || d.includes(q)
    })
  }, [items, search])

  const openCreate = () => {
    setEditing(null)
    setTitulo('')
    setDescripcion('')
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setPreviewing(null)
    setTitulo(p.titulo ?? '')
    setDescripcion(p.descripcion ?? '')
    setFormError('')
    setModalOpen(true)
  }

  const openPreview = (p) => {
    setPreviewing(p)
  }

  const onDelete = (p) => {
    const ok = window.confirm(`¿Eliminar el proyecto "${p.titulo}"?`)
    if (!ok) return
    remove(p.id).catch(() => {})
  }

  const save = async () => {
    setFormError('')
    if (!titulo.trim() || !descripcion.trim()) {
      setFormError('Completa título y descripción')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, { titulo, descripcion })
      } else {
        await create({ titulo, descripcion })
      }
      setModalOpen(false)
    } catch (e) {
      setFormError('No se pudo guardar el proyecto')
    } finally {
      setSaving(false)
    }
  }

  const sidebarClass = [
    'w-60 fixed transition transform ease-in-out duration-1000 z-50 flex h-screen bg-[#1E293B]',
    sidebarOpen ? 'translate-x-none' : '-translate-x-48',
  ].join(' ')

  const maxToolbarClass = [
    'max-toolbar w-full -right-6 transition transform ease-in duration-300 flex items-center justify-between',
    'border-4 border-white dark:border-[#0F172A] bg-[#1E293B] absolute top-2 rounded-full h-12',
    sidebarOpen ? 'translate-x-0' : 'translate-x-24 scale-x-0',
  ].join(' ')

  const contentClass = [
    'content transform ease-in-out duration-500 pt-20 px-2 md:px-5 pb-4',
    sidebarOpen ? 'ml-12 md:ml-60' : 'ml-12',
  ].join(' ')

  const initials = useMemo(() => {
    const name = `${user?.nombre ?? ''} ${user?.apellido ?? ''}`.trim()
    const base = (name || user?.correo || 'U').trim()
    const parts = base.split(/\s+/).filter(Boolean)
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase())
    return letters.join('') || 'U'
  }, [user])

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
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-semibold shadow">
                {initials}
              </div>
            </div>

            <div className="hidden md:block text-sm md:text-md text-black dark:text-white">
              {user?.correo ?? 'Usuario'}
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className={sidebarClass}>
        {/* open sidebar button */}
        <div className={maxToolbarClass}>
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
            <div className="text-white hover:text-blue-500 dark:hover:text-[#38BDF8]" aria-hidden="true">
              <IconBell className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center space-x-3 group bg-gradient-to-r dark:from-cyan-500 dark:to-blue-500 from-indigo-500 via-purple-500 to-purple-500 pl-10 pr-2 py-1 rounded-full text-white">
            <div className="transform ease-in-out duration-300 mr-12">Dashboard</div>
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
            icon={IconHome}
            label="Proyectos"
            sidebarOpen={sidebarOpen}
            onClick={() => {}}
          />

          <div className="absolute bottom-4 left-0 w-full px-3">
            <SidebarItem
              icon={IconExit}
              label="Salir"
              title="Salir"
              sidebarOpen={sidebarOpen}
              onClick={() => logout()}
            />
          </div>
        </div>

        {/* MINI SIDEBAR */}
        <div
          className={[
            'mini mt-20 flex flex-col space-y-2 w-full h-[calc(100vh)]',
            sidebarOpen ? 'hidden' : 'flex',
          ].join(' ')}
        >
          <SidebarItem
            icon={IconHome}
            label="Proyectos"
            title="Proyectos"
            sidebarOpen={sidebarOpen}
            onClick={() => {}}
          />

          <div className="absolute bottom-4 left-0 w-full px-3">
            <SidebarItem
              icon={IconExit}
              label="Salir"
              title="Salir"
              sidebarOpen={sidebarOpen}
              onClick={() => logout()}
            />
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <div className={contentClass}>
        <nav
          className="flex px-5 py-3 text-gray-700 rounded-lg bg-gray-50 dark:bg-[#1E293B]"
          aria-label="Breadcrumb"
        >
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <span className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-400">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Home
              </span>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2 dark:text-gray-400">
                  Proyectos
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="my-5 px-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-900 dark:text-white truncate">
              Dashboard
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
              {isLoading ? 'Cargando proyectos…' : `${items.length} proyectos`}
            </div>
          </div>

          <div className="w-full max-w-md">
            <Input
              label=""
              placeholder="Buscar proyectos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="px-5">
          {error && (
            <div
              className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
              role="alert"
            >
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <ProyectoPreview proyecto={previewing} onClose={() => setPreviewing(null)} />

          <ListaProyectos
            proyectos={proyectos}
            view="cards"
            onCreate={openCreate}
            onPreview={openPreview}
            onEdit={openEdit}
            onDelete={onDelete}
            onRefresh={() => refresh()}
          />
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
        onClose={() => (saving ? null : setModalOpen(false))}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        }
      >
        {formError && (
          <div className="mb-3 text-sm text-red-600 dark:text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            {formError}
          </div>
        )}

        <div className="space-y-3">
          <Input
            label="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Casa 120m²"
          />
          <Input
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Proyecto de vivienda unifamiliar"
          />
        </div>
      </Modal>
    </div>
  )
}
