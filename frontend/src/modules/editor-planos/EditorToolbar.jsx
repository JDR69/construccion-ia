import { Button } from '../../ui/Button'

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

function IconBack(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.5 19.5L3.75 12l6.75-7.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.5 12h15.75"
      />
    </svg>
  )
}

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.5 6.75h9m-6.75 0v-1.5h4.5v1.5m-7.5 0l.9 13.5h6.2l.9-13.5"
      />
    </svg>
  )
}

function IconSave(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.5 6.75A2.25 2.25 0 016.75 4.5h8.69c.6 0 1.17.24 1.59.66l1.81 1.81c.42.42.66.99.66 1.59v8.69A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25V6.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.25 19.5v-6h7.5v6"
      />
    </svg>
  )
}

function IconJpg(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6.75 3.75h10.5A1.5 1.5 0 0118.75 5.25v13.5a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.25 15l2.25-2.25 2.25 2.25 1.5-1.5 1.5 1.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.5 9.5h.01"
      />
    </svg>
  )
}

function IconPdf(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6.75 3.75h7.5l3 3v13.5a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M14.25 3.75v3a1.5 1.5 0 001.5 1.5h3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.5 16.5h9"
      />
    </svg>
  )
}

// ─── Toolbar inferior — solo controles de sesión/export ──────────────────────
// Los botones de insertar elementos viven en <ElementsPalette> (lado derecho).
export function EditorToolbar({
  onBack,
  onClear,
  onSave,
  onExportJpg,
  onExportPdf,
  saving,
  isDark,
  onToggleTheme,
}) {
  const iconBtn = 'h-16 w-16 px-0 justify-center rounded-2xl'
  const iconSize = 'w-6 h-6 shrink-0'
  const groupWrap =
    'flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur max-w-[96vw]'
  const rowScroll = 'flex flex-wrap items-center justify-center gap-2'

  return (
    <div className="w-full flex justify-center pb-4">
      <div className={groupWrap}>
        <div className={rowScroll}>
          {/* ── Volver ── */}
          <Button
            variant="toolbar"
            size="lg"
            className={iconBtn}
            onClick={onBack}
            disabled={saving}
            title="Volver"
            aria-label="Volver"
          >
            <IconBack className={iconSize} />
          </Button>

          {/* ── Tema ── */}
          <Button
            variant="toolbar"
            size="lg"
            className={iconBtn}
            onClick={onToggleTheme}
            disabled={saving}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? <IconSun className={iconSize} /> : <IconMoon className={iconSize} />}
          </Button>

          {/* ── Guardar ── */}
          <Button
            variant="toolbar"
            size="lg"
            className={iconBtn}
            onClick={onSave}
            disabled={saving}
            title="Guardar"
            aria-label="Guardar"
          >
            <IconSave className={iconSize} />
          </Button>

          {/* ── Exportar JPG ── */}
          <Button
            variant="toolbar"
            size="lg"
            className={iconBtn}
            onClick={onExportJpg}
            disabled={saving}
            title="Exportar JPG"
            aria-label="Exportar JPG"
          >
            <IconJpg className={iconSize} />
          </Button>

          {/* ── Exportar PDF ── */}
          <Button
            variant="toolbar"
            size="lg"
            className={iconBtn}
            onClick={onExportPdf}
            disabled={saving}
            title="Exportar PDF"
            aria-label="Exportar PDF"
          >
            <IconPdf className={iconSize} />
          </Button>

          <div className="mx-1 h-9 w-px bg-slate-800" />

          {/* ── Limpiar ── */}
          <Button
            variant="toolbarDanger"
            size="lg"
            className={iconBtn}
            onClick={onClear}
            disabled={saving}
            title="Limpiar plano"
            aria-label="Limpiar plano"
          >
            <IconTrash className={iconSize} />
          </Button>
        </div>
      </div>
    </div>
  )
}
