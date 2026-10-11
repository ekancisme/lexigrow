import { useCallback, useEffect, useState } from 'react'
import api from '../../services/api.js'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './AdminAnnouncements.css'

const EMPTY = { titleEn:'', titleVi:'', bodyEn:'', bodyVi:'', bannerUrl:'', imageUrl:'', imageAltEn:'', imageAltVi:'', actionLabelEn:'', actionLabelVi:'', actionUrl:'', audience:['student'], status:'draft', startsAt:'', endsAt:'', priority:0 }
const ROLES = ['student','teacher','parent','admin']
export default function AdminAnnouncements() {
  const { t, language } = useLanguage()
  const [items,setItems] = useState([]); const [form,setForm] = useState(EMPTY); const [editing,setEditing] = useState('')
  const [locale,setLocale] = useState(language); const [previewLocale,setPreviewLocale] = useState(language); const [error,setError] = useState(''); const [saving,setSaving] = useState(false)
  const load = useCallback(async()=>{try{const {data}=await api.get('/admin/announcements');setItems(data?.data||[])}catch(e){setError(e.message)}},[])
  useEffect(()=>{let active=true;Promise.resolve().then(()=>active&&load());return()=>{active=false}},[load])
  const set = (key,value)=>setForm(old=>({...old,[key]:value}))
  const startEdit = item => { setEditing(item._id); setForm({...EMPTY,...item,startsAt:item.startsAt?new Date(item.startsAt).toISOString().slice(0,16):'',endsAt:item.endsAt?new Date(item.endsAt).toISOString().slice(0,16):''}); window.scrollTo({top:0,behavior:'smooth'}) }
  const submit = async event => {event.preventDefault();setSaving(true);setError('');const payload={...form,startsAt:form.startsAt?new Date(form.startsAt).toISOString():new Date().toISOString(),endsAt:form.endsAt?new Date(form.endsAt).toISOString():null,priority:Number(form.priority)};try{if(editing)await api.patch(`/admin/announcements/${editing}`,payload);else await api.post('/admin/announcements',payload);setForm(EMPTY);setEditing('');await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
  const remove = async id => {if(!window.confirm(t('announcements.admin.confirmDelete','Delete this announcement?')))return;try{await api.delete(`/admin/announcements/${id}`);await load()}catch(e){setError(e.message)}}
  const toggleRole = role => set('audience',form.audience.includes(role)?form.audience.filter(x=>x!==role):[...form.audience,role])
  const localeFields = locale==='vi'?['titleVi','bodyVi','imageAltVi','actionLabelVi']:['titleEn','bodyEn','imageAltEn','actionLabelEn']
  const preview = (keyEn,keyVi)=>form[previewLocale==='vi'?keyVi:keyEn]
  return <main className="admin-announcements">
    <header><h1>{t('announcements.admin.title','Announcements')}</h1><p>{t('announcements.admin.subtitle','Create bilingual announcements shown to selected signed-in users.')}</p></header>
    {error&&<div className="admin-announcements__error" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
    <form className="admin-announcements__form card-base" onSubmit={submit}>
      <div className="admin-announcements__form-heading"><h2>{editing?t('announcements.admin.edit','Edit announcement'):t('announcements.admin.create','New announcement')}</h2><div><button type="button" aria-pressed={locale==='en'} onClick={()=>setLocale('en')}>English</button><button type="button" aria-pressed={locale==='vi'} onClick={()=>setLocale('vi')}>Tiếng Việt</button></div></div>
      <label>{t('announcements.admin.titleField','Title')}<input required maxLength="140" value={form[localeFields[0]]} onChange={e=>set(localeFields[0],e.target.value)}/></label>
      <label>{t('announcements.admin.body','Message')}<textarea required maxLength="10000" rows="5" value={form[localeFields[1]]} onChange={e=>set(localeFields[1],e.target.value)}/></label>
      <label>{t('announcements.admin.imageAlt','Image description')}<input maxLength="250" value={form[localeFields[2]]} onChange={e=>set(localeFields[2],e.target.value)}/></label>
      <div className="admin-announcements__grid"><label>{t('announcements.admin.banner','Banner URL')}<input type="text" placeholder="https://… or /images/banner.jpg" value={form.bannerUrl} onChange={e=>set('bannerUrl',e.target.value)}/></label><label>{t('announcements.admin.image','Image URL')}<input type="text" placeholder="https://… or /images/image.jpg" value={form.imageUrl} onChange={e=>set('imageUrl',e.target.value)}/></label></div>
      <div className="admin-announcements__grid"><label>{t('announcements.admin.actionLabel','Button label')}<input maxLength="80" value={form[localeFields[3]]} onChange={e=>set(localeFields[3],e.target.value)}/></label><label>{t('announcements.admin.actionUrl','Internal link')}<input placeholder="/student/explore" value={form.actionUrl} onChange={e=>set('actionUrl',e.target.value)}/></label></div>
      <fieldset><legend>{t('announcements.admin.audience','Audience')}</legend>{ROLES.map(role=><label className="admin-announcements__check" key={role}><input type="checkbox" checked={form.audience.includes(role)} onChange={()=>toggleRole(role)}/>{t(`announcements.admin.roles.${role}`,role)}</label>)}</fieldset>
      <div className="admin-announcements__grid"><label>{t('announcements.admin.status','Status')}<select value={form.status} onChange={e=>set('status',e.target.value)}><option value="draft">{t('announcements.admin.draft','Draft')}</option><option value="published">{t('announcements.admin.published','Published')}</option><option value="archived">{t('announcements.admin.archived','Archived')}</option></select></label><label>{t('announcements.admin.priority','Priority')}<input type="number" min="0" max="100" value={form.priority} onChange={e=>set('priority',e.target.value)}/></label><label>{t('announcements.admin.starts','Starts at')}<input type="datetime-local" value={form.startsAt} onChange={e=>set('startsAt',e.target.value)}/></label><label>{t('announcements.admin.ends','Ends at')}<input type="datetime-local" value={form.endsAt} onChange={e=>set('endsAt',e.target.value)}/></label></div>
      <div className="admin-announcements__preview"><div><h3>{t('announcements.admin.preview','Preview')} <select aria-label={t('header.language','Language')} value={previewLocale} onChange={e=>setPreviewLocale(e.target.value)}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></h3>{form.bannerUrl&&<img className="preview-banner" src={form.bannerUrl} alt=""/>}{form.imageUrl&&<img className="preview-image" src={form.imageUrl} alt={preview('imageAltEn','imageAltVi')}/>}<strong>{preview('titleEn','titleVi')||'Announcement title'}</strong><p>{preview('bodyEn','bodyVi')||'Announcement text'}</p>{preview('actionLabelEn','actionLabelVi')&&<span className="preview-button">{preview('actionLabelEn','actionLabelVi')}</span>}</div></div>
      <div className="admin-announcements__buttons"><button type="submit" disabled={saving}>{saving?t('common.loading','Loading...'):t('common.save','Save')}</button>{editing&&<button type="button" onClick={()=>{setForm(EMPTY);setEditing('')}}>{t('common.cancel','Cancel')}</button>}</div>
    </form>
    <section className="admin-announcements__list"><h2>{t('announcements.admin.existing','Existing announcements')}</h2>{items.map(item=><article className="card-base" key={item._id}><div><strong>{item.titleEn} / {item.titleVi}</strong><span>{item.status} · {item.audience.join(', ')}</span></div><button onClick={()=>startEdit(item)}>{t('announcements.admin.edit','Edit')}</button><button onClick={()=>remove(item._id)}>{t('announcements.admin.delete','Delete')}</button></article>)}</section>
  </main>
}
