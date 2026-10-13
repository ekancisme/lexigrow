import { useId } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import NavigationDisclosure from './NavigationDisclosure.jsx'

export default function HeaderNavigation({ role, openId, setOpenId, onNavigate }) {
  const { user, selectedParentChildId, selectParentChild } = useAuth()
  const { t, language } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const selectId = useId()
  const routeChildId = location.pathname.match(/^\/parent\/children\/([^/]+)/)?.[1]
  const validStoredChild = user?.children?.some(child => child._id === selectedParentChildId)
  const childId = routeChildId || (validStoredChild ? selectedParentChildId : '') || user?.children?.[0]?._id || ''
  const child = user?.children?.find(entry => entry._id === childId)
  const item = (key, path, icon, extra = {}) => ({ label: t(key), path, icon, ...extra })
  const childItem = (key, view, icon, extra = {}) => item(key, childId ? `/parent/children/${childId}/${view}` : '/parent/dashboard', icon, { disabled: !childId, ...extra })
  const studentWorkspaceItems = [
    item('nav.dashboard', '/student/dashboard', 'dashboard'),
    item('nav.smartWriting', '/student/explore', 'edit_note', { aliases: ['/student/writing', '/student/write', '/student/write-essay', '/student/feedback'] }),
    item('nav.myWords', '/student/my-words', 'menu_book', { aliases: ['/student/vocabulary'] }),
    item('nav.growthGarden', '/student/garden', 'forest'),
    item('headerNavigation.progressOverview', '/student/progress', 'monitoring'),
    item('nav.myClasses', '/student/class', 'school'),
  ]

  const groupsByRole = {
    student: [
      ...(user ? [{ id: 'workspace', label: language === 'vi' ? 'Góc học tập' : 'My Learning', items: studentWorkspaceItems }] : []),
    ],
    teacher: [
      { id: 'teaching', label: t('headerNavigation.teaching'), items: [
        item('nav.myClasses', '/teacher/classes', 'school', { aliases: ['/teacher/class', '/teacher/student'] }),
        item('nav.assignments', '/teacher/assignments', 'assignment', { aliases: ['/teacher/assignment', '/teacher/feedback'] }),
        item('nav.newClass', '/teacher/classes', 'add'),
      ] },
      { id: 'tracking', label: t('headerNavigation.tracking'), items: [item('nav.earlyWarnings', '/teacher/alerts', 'warning')] },
      { id: 'tools', label: t('headerNavigation.tools'), items: [item('nav.systemPrompts', '/teacher/prompts', 'tune')] },
    ],
    admin: [
      { id: 'management', label: t('headerNavigation.management'), items: [
        item('nav.users', '/admin/users', 'group'), item('nav.classes', '/admin/classes', 'school'), item('nav.vocabulary', '/admin/vocabulary', 'dictionary'),
      ] },
      { id: 'operations', label: t('headerNavigation.operations'), items: [
        item('nav.aiMonitoring', '/admin/ai-monitoring', 'monitoring'), item('nav.announcements', '/admin/announcements', 'campaign'),
        item('nav.auditLogs', '/admin/logs', 'receipt_long'), item('headerNavigation.support', '/admin/chat', 'chat'),
      ] },
      { id: 'billing', label: t('headerNavigation.billing'), items: [item('nav.pricingPayOS', '/admin/pricing', 'payments')] },
    ],
    parent: [
      { id: 'children', label: t('headerNavigation.myChild'), items: [
        childItem('nav.progress', 'progress', 'monitoring'), childItem('nav.essays', 'essays', 'history_edu'),
        childItem('nav.vocabulary', 'vocabulary', 'menu_book'), childItem('nav.weeklyGoals', 'goals', 'flag'),
        childItem('nav.alerts', 'alerts', 'warning', { badge: child?.unreadAlertCount }),
      ] },
      { id: 'family', label: t('headerNavigation.family'), items: [item('nav.linkStudent', '/parent/dashboard?link=1', 'person_add')] },
    ],
  }
  const groups = groupsByRole[role] || groupsByRole.student
  const matches = navItem => !navItem.disabled && !navItem.path.includes('?') && [navItem.path, ...(navItem.aliases || [])].some(path => location.pathname === path || location.pathname.startsWith(`${path}/`))
  const activeGroup = groups.find(group => group.items.some(navItem => navItem.path === location.pathname))?.id || groups.find(group => group.items.some(matches))?.id
  return (
    <nav className="header-navigation" aria-label={t('headerNavigation.primaryNavigation')}>
      {role === 'student' ? (
        <>
          <NavLink to="/student/home" end className={({ isActive }) => `header-navigation__home ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
            {language === 'vi' ? 'Trang chủ' : 'Home'}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `header-navigation__home ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
            {language === 'vi' ? 'Giới thiệu' : 'About Us'}
          </NavLink>
          <NavLink to="/pricing" className={({ isActive }) => `header-navigation__home ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
            {language === 'vi' ? 'Bảng giá' : 'Pricing'}
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `header-navigation__home ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
            {language === 'vi' ? 'Liên hệ' : 'Contact Us'}
          </NavLink>
          {user && (
            <NavigationDisclosure label={language === 'vi' ? 'Góc học tập' : 'My Learning'} active={activeGroup === 'workspace'} open={openId === 'workspace'}
              onOpen={() => setOpenId('workspace')} onClose={() => setOpenId(current => current === 'workspace' ? null : current)}
              onToggle={() => setOpenId(current => current === 'workspace' ? null : 'workspace')}>
              <ul className="header-navigation__links">
                {studentWorkspaceItems.map((navItem, index) => (
                  <li key={`${navItem.path}-${index}`}>
                    <NavLink to={navItem.path} className={({ isActive }) => `header-navigation__link ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
                      <span className="material-symbols-outlined" aria-hidden="true">{navItem.icon}</span>
                      <span>{navItem.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </NavigationDisclosure>
          )}
        </>
      ) : (
        <NavLink to={`/${role}/dashboard`} className={({ isActive }) => `header-navigation__home ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
          {t('nav.overview')}
        </NavLink>
      )}
      {role !== 'student' && groups.map(group => (
        <NavigationDisclosure key={group.id} label={group.label} active={activeGroup === group.id} open={openId === group.id}
          onOpen={() => setOpenId(group.id)} onClose={() => setOpenId(current => current === group.id ? null : current)}
          onToggle={() => setOpenId(current => current === group.id ? null : group.id)}>
          {role === 'parent' && group.id === 'children' && <div className="header-navigation__child">
            {user?.children?.length > 0 ? <>
              <label htmlFor={selectId}>{t('nav.viewingStudent')}</label>
              <select id={selectId} value={childId} onChange={event => {
                const nextId = event.target.value
                selectParentChild(nextId)
                const view = location.pathname.match(/^\/parent\/children\/[^/]+\/(progress|essays|vocabulary|goals|alerts)$/)?.[1] || 'progress'
                navigate(`/parent/children/${nextId}/${view}`)
                onNavigate()
              }}>{user.children.map(entry => <option key={entry._id} value={entry._id}>{entry.name}</option>)}</select>
              <p>{child?.englishLevel || t('headerNavigation.levelNotSet')}{child?.activeAlertCount > 0 ? ` · ${t('headerNavigation.activeAlerts', { count: child.activeAlertCount })}` : ''}</p>
            </> : <p>{t('headerNavigation.linkChildFirst')}</p>}
          </div>}
          <ul className="header-navigation__links">
            {group.items.map((navItem, index) => <li key={`${navItem.path}-${index}`}>
              {navItem.disabled ? <span className="header-navigation__link is-disabled" aria-disabled="true"><span className="material-symbols-outlined" aria-hidden="true">{navItem.icon}</span>{navItem.label}</span>
                : <NavLink to={navItem.path} className={({ isActive }) => `header-navigation__link ${isActive ? 'is-active' : ''}`} onClick={onNavigate}>
                  <span className="material-symbols-outlined" aria-hidden="true">{navItem.icon}</span><span>{navItem.label}</span>
                  {navItem.badge > 0 && <span className="header-navigation__badge">{navItem.badge > 9 ? '9+' : navItem.badge}</span>}
                </NavLink>}
            </li>)}
          </ul>
        </NavigationDisclosure>
      ))}
    </nav>
  )
}
