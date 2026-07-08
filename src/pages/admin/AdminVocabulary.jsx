import { useState, useEffect, useRef } from 'react'
import api from '../../services/api.js'
import './AdminPages.css'

export default function AdminVocabulary() {
  const [vocabularies, setVocabularies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Pagination & Filtering state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [cefrFilter, setCefrFilter] = useState('')
  const [awlFilter, setAwlFilter] = useState('')

  // Statistics State
  const [stats, setStats] = useState({
    totalCount: 0,
    awlCount: 0,
    cefr: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 }
  })

  // Modal CRUD State
  const [showCrudModal, setShowCrudModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [currentWordId, setCurrentWordId] = useState(null)
  const [formData, setFormData] = useState({
    word: '',
    ipa: '',
    partOfSpeech: 'noun',
    definition: '',
    cefr: 'B1',
    awl: ''
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Upload Wizard (Import) State
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  // Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [wordToDelete, setWordToDelete] = useState(null)

  // Search debounce ref
  const searchTimeoutRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Sync search input with debounced state
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on search
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search])

  // Fetch vocabulary data when filters or pagination changes
  useEffect(() => {
    fetchVocabularies()
  }, [page, limit, debouncedSearch, cefrFilter, awlFilter])

  const fetchVocabularies = async () => {
    setLoading(true)
    setError('')
    try {
      const queryParams = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        cefr: cefrFilter,
        awl: awlFilter
      })
      const res = await api.get(`/admin/global-vocabulary?${queryParams.toString()}`)
      if (res.success) {
        setVocabularies(res.data || [])
        setTotalPages(res.pagination?.pages || 1)
        setTotalCount(res.pagination?.total || 0)
        if (res.stats) {
          setStats(res.stats)
        }
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách từ vựng.')
    } finally {
      setLoading(false)
    }
  }

  // --- CRUD Actions ---
  const openCreateModal = () => {
    setModalMode('create')
    setFormData({
      word: '',
      ipa: '',
      partOfSpeech: 'noun',
      definition: '',
      cefr: 'B1',
      awl: ''
    })
    setFormError('')
    setCurrentWordId(null)
    setShowCrudModal(true)
  }

  const openEditModal = (item) => {
    setModalMode('edit')
    setFormData({
      word: item.word,
      ipa: item.ipa || '',
      partOfSpeech: item.partOfSpeech || 'noun',
      definition: item.definition,
      cefr: item.cefr || 'B1',
      awl: item.awl || ''
    })
    setFormError('')
    setCurrentWordId(item._id)
    setShowCrudModal(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    
    if (!formData.word.trim()) {
      setFormError('Từ vựng không được để trống.')
      return
    }
    if (!formData.definition.trim()) {
      setFormError('Định nghĩa không được để trống.')
      return
    }

    setFormLoading(true)
    try {
      let res
      if (modalMode === 'create') {
        res = await api.post('/admin/global-vocabulary', formData)
        setSuccessMsg(`Đã tạo thành công từ "${res.data.word}".`)
      } else {
        res = await api.put(`/admin/global-vocabulary/${currentWordId}`, formData)
        setSuccessMsg(`Đã cập nhật thành công từ "${res.data.word}".`)
      }
      
      setShowCrudModal(false)
      fetchVocabularies()
      // Auto clear success message
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setFormError(err.message || 'Lỗi khi lưu từ vựng.')
    } finally {
      setFormLoading(false)
    }
  }

  const confirmDelete = (item) => {
    setWordToDelete(item)
    setShowDeleteConfirm(true)
  }

  const handleDeleteSubmit = async () => {
    if (!wordToDelete) return
    setError('')
    try {
      await api.delete(`/admin/global-vocabulary/${wordToDelete._id}`)
      setSuccessMsg(`Đã xóa thành công từ "${wordToDelete.word}".`)
      setShowDeleteConfirm(false)
      setWordToDelete(null)
      fetchVocabularies()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Không thể xóa từ vựng.')
      setShowDeleteConfirm(false)
      setWordToDelete(null)
    }
  }

  // --- Export Action ---
  const handleExport = async () => {
    setError('')
    try {
      const token = api.getToken()
      const response = await fetch('/api/admin/global-vocabulary/export', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error('Lỗi từ máy chủ khi xuất dữ liệu.')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `global_vocabulary_${new Date().toISOString().slice(0,10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setSuccessMsg('Đã xuất dữ liệu CSV thành công!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Lỗi khi xuất file CSV.')
    }
  }

  // --- Import Actions ---
  const downloadTemplate = () => {
    const csvContent = '\uFEFFsep=,\nWord,IPA,Part of Speech,Definition,CEFR,AWL\nubiquitous,/juːˈbɪkwɪtəs/,adjective,Có mặt ở khắp mọi nơi,C1,Sublist 1\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lexigrow_vocabulary_template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setImportError('Vui lòng chọn tập tin có định dạng .csv')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      setImportError('')
      setImportResults(null)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current.click()
  }

  // Custom high-quality CSV parser
  const parseCSV = (text) => {
    const lines = []
    let row = []
    let inQuotes = false
    let currentVal = ''
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"'
          i++ // skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal)
        currentVal = ''
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++ // skip \n
        }
        row.push(currentVal)
        if (row.length > 0 && row.some(cell => cell.trim() !== '')) {
          lines.push(row)
        }
        row = []
        currentVal = ''
      } else {
        currentVal += char
      }
    }
    
    if (currentVal || row.length > 0) {
      row.push(currentVal)
      if (row.some(cell => cell.trim() !== '')) {
        lines.push(row)
      }
    }
    
    return lines
  }

  const handleImportSubmit = () => {
    if (!selectedFile) return
    
    setImportLoading(true)
    setImportError('')
    setImportResults(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      try {
        const rows = parseCSV(text)
        
        let headerRowIndex = 0
        if (rows.length > 0 && rows[0][0] && rows[0][0].trim().toLowerCase().startsWith('sep=')) {
          headerRowIndex = 1
        }

        if (rows.length <= headerRowIndex) {
          throw new Error('Tập tin CSV trống hoặc thiếu dòng tiêu đề.')
        }

        const headers = rows[headerRowIndex].map(h => h.trim().toLowerCase())
        // Map headers to field indexes
        const wordIdx = headers.indexOf('word')
        const ipaIdx = headers.indexOf('ipa')
        const posIdx = headers.indexOf('part of speech') !== -1 ? headers.indexOf('part of speech') : headers.indexOf('partofspeech')
        const defIdx = headers.indexOf('definition')
        const cefrIdx = headers.indexOf('cefr')
        const awlIdx = headers.indexOf('awl')

        if (wordIdx === -1 || defIdx === -1) {
          throw new Error('Tập tin CSV thiếu cột bắt buộc: "Word" và "Definition".')
        }

        const wordsToImport = []
        const localErrors = []

        // Start from row after header
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i]
          const lineNum = i + 1

          const word = row[wordIdx]?.trim() || ''
          const definition = row[defIdx]?.trim() || ''
          const ipa = ipaIdx !== -1 ? row[ipaIdx]?.trim() || '' : ''
          const partOfSpeech = posIdx !== -1 ? row[posIdx]?.trim() || 'noun' : 'noun'
          const cefr = cefrIdx !== -1 ? row[cefrIdx]?.trim() || 'B1' : 'B1'
          const awl = awlIdx !== -1 ? row[awlIdx]?.trim() || '' : ''

          if (!word) {
            localErrors.push({ line: lineNum, message: 'Từ vựng (Word) không được bỏ trống.' })
            continue
          }
          if (!definition) {
            localErrors.push({ line: lineNum, word, message: 'Định nghĩa (Definition) không được bỏ trống.' })
            continue
          }

          wordsToImport.push({
            word,
            ipa,
            partOfSpeech,
            definition,
            cefr,
            awl
          })
        }

        if (wordsToImport.length === 0 && localErrors.length > 0) {
          setImportResults({
            success: false,
            createdCount: 0,
            updatedCount: 0,
            errors: localErrors,
            message: 'Không có dòng hợp lệ nào để tải lên.'
          })
          setImportLoading(false)
          return
        }

        // Call backend API import
        const res = await api.post('/admin/global-vocabulary/import', { words: wordsToImport })
        
        // Merge client side validation errors with server errors
        const allErrors = [...localErrors, ...(res.errors || [])]
        
        setImportResults({
          success: true,
          createdCount: res.createdCount || 0,
          updatedCount: res.updatedCount || 0,
          errors: allErrors,
          message: res.message
        })
        
        setSelectedFile(null)
        fetchVocabularies()
      } catch (err) {
        setImportError(err.message || 'Lỗi phân tích cú pháp CSV.')
      } finally {
        setImportLoading(false)
      }
    }

    reader.onerror = () => {
      setImportError('Không thể đọc tập tin CSV.')
      setImportLoading(false)
    }

    reader.readAsText(selectedFile, 'UTF-8')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setImportError('Vui lòng thả tập tin có định dạng .csv')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      setImportError('')
      setImportResults(null)
    }
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page__header">
        <div>
          <h2 className="admin-page__title">Từ điển Học thuật Hệ thống</h2>
          <p className="admin-page__subtitle">Quản lý kho từ vựng chuẩn, cấp độ khó CEFR và phân loại AWL (Academic Word List)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="admin-task-item__btn" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            <span>Xuất dữ liệu (Export)</span>
          </button>
          <button className="admin-task-item__btn" onClick={() => { setShowUploadModal(true); setImportResults(null); setSelectedFile(null); setImportError(''); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
            <span>Nhập danh sách (Import)</span>
          </button>
          <button 
            className="admin-task-item__btn" 
            onClick={openCreateModal}
            style={{ 
              background: 'var(--color-primary)', 
              color: 'var(--color-on-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            <span>Thêm từ mới</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast-like Alert */}
      {successMsg && (
        <div style={{ 
          background: 'rgba(40, 167, 69, 0.1)', 
          border: '1px solid var(--color-success, #28a745)', 
          color: '#1e6830', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-lg)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          animation: 'fadeIn var(--transition-normal)'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-success, #28a745)' }}>check_circle</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{ 
          background: 'rgba(185, 28, 28, 0.1)', 
          border: '1px solid var(--color-error, #b91c1c)', 
          color: '#8b1c1c', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-lg)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-error, #b91c1c)' }}>error</span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="admin-page__stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.totalCount}</div>
            <div className="admin-stat-card__label">Tổng Số Từ Chuẩn</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <div className="admin-stat-card__value">{stats.awlCount}</div>
            <div className="admin-stat-card__label">Từ Vựng Học Thuật (AWL)</div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ flex: 1.5 }}>
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <span className="material-symbols-outlined">signal_cellular_alt</span>
          </div>
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--color-outline)', marginBottom: '4px' }}>
              <span>Cơ Bản (A1-A2): {stats.cefr.A1 + stats.cefr.A2}</span>
              <span>Trung Cấp (B1-B2): {stats.cefr.B1 + stats.cefr.B2}</span>
              <span>Cao Cấp (C1-C2): {stats.cefr.C1 + stats.cefr.C2}</span>
            </div>
            {/* Progress bar visualizing distribution */}
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: 'var(--color-surface-container-high)' }}>
              <div style={{ 
                width: `${stats.totalCount ? ((stats.cefr.A1 + stats.cefr.A2) / stats.totalCount) * 100 : 0}%`, 
                background: 'var(--color-primary-container, #d1e4ff)' 
              }} />
              <div style={{ 
                width: `${stats.totalCount ? ((stats.cefr.B1 + stats.cefr.B2) / stats.totalCount) * 100 : 0}%`, 
                background: 'var(--color-primary, #005bbf)' 
              }} />
              <div style={{ 
                width: `${stats.totalCount ? ((stats.cefr.C1 + stats.cefr.C2) / stats.totalCount) * 100 : 0}%`, 
                background: 'var(--color-on-primary-container, #001d3f)' 
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Vocabulary Control Panel */}
      <div className="admin-card">
        <div className="admin-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: 'none', paddingBottom: 0 }}>
          <div>
            <h3 className="admin-card__title" style={{ fontSize: '18px' }}>Danh sách từ điển học thuật</h3>
            <p className="admin-card__desc" style={{ marginTop: '2px' }}>Tìm kiếm, chỉnh sửa hoặc lọc các từ vựng học thuật đang có hiệu lực trên LexiGrow</p>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px', 
          flexWrap: 'wrap', 
          background: 'var(--color-surface-container-low)', 
          padding: '16px', 
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-outline-variant)'
        }}>
          {/* Search bar */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', fontSize: '20px' }}>
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo từ vựng hoặc định nghĩa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            {search && (
              <span 
                className="material-symbols-outlined" 
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', cursor: 'pointer', fontSize: '18px' }}
              >
                close
              </span>
            )}
          </div>

          {/* CEFR Level filter */}
          <div style={{ width: '160px' }}>
            <select
              value={cefrFilter}
              onChange={(e) => { setCefrFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Tất cả CEFR</option>
              <option value="A1">A1 - Sơ cấp</option>
              <option value="A2">A2 - Sơ cấp</option>
              <option value="B1">B1 - Trung cấp</option>
              <option value="B2">B2 - Trung cấp</option>
              <option value="C1">C1 - Cao cấp</option>
              <option value="C2">C2 - Cao cấp</option>
            </select>
          </div>

          {/* AWL Class Filter */}
          <div style={{ width: '180px' }}>
            <select
              value={awlFilter}
              onChange={(e) => { setAwlFilter(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                outline: 'none',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">Tất cả AWL</option>
              <option value="yes">Thuộc danh mục AWL</option>
              <option value="no">Không thuộc AWL</option>
              <option value="Sublist 1">Sublist 1</option>
              <option value="Sublist 2">Sublist 2</option>
              <option value="Sublist 3">Sublist 3</option>
              <option value="Sublist 4">Sublist 4</option>
              <option value="Sublist 5">Sublist 5</option>
              <option value="Sublist 6">Sublist 6</option>
              <option value="Sublist 7">Sublist 7</option>
              <option value="Sublist 8">Sublist 8</option>
              <option value="Sublist 9">Sublist 9</option>
              <option value="Sublist 10">Sublist 10</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>
              progress_activity
            </span>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '14px' }}>Đang tải dữ liệu từ vựng...</p>
          </div>
        ) : vocabularies.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--color-surface-container-low)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--color-outline-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-outline)', marginBottom: '8px' }}>
              folder_open
            </span>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>Không tìm thấy từ vựng</h4>
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '13px', maxWidth: '400px', margin: '0 auto' }}>
              Không tìm thấy từ vựng nào khớp với bộ lọc hiện tại của bạn. Thử thay đổi từ khóa hoặc bộ lọc.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-outline-variant)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                  <th style={{ padding: '14px 16px' }}>Từ Vựng</th>
                  <th style={{ padding: '14px 16px' }}>Phiên Âm</th>
                  <th style={{ padding: '14px 16px' }}>Từ Loại</th>
                  <th style={{ padding: '14px 16px', width: '35%' }}>Định Nghĩa / Nghĩa</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>CEFR</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>AWL</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {vocabularies.map((item, idx) => (
                  <tr 
                    key={item._id} 
                    style={{ 
                      borderBottom: idx === vocabularies.length - 1 ? 'none' : '1px solid var(--color-outline-variant)',
                      background: idx % 2 === 0 ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-container-high)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'var(--color-surface-container-lowest)' : 'var(--color-surface-container-low)' }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-on-surface)' }}>{item.word}</td>
                    <td style={{ padding: '14px 16px', fontStyle: 'italic', color: 'var(--color-outline)' }}>{item.ipa || '-'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        background: 'rgba(0, 91, 191, 0.08)', 
                        color: 'var(--color-primary)', 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-full)' 
                      }}>
                        {item.partOfSpeech}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                      {item.definition}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: item.cefr === 'C1' || item.cefr === 'C2' ? '#fde8e8' : (item.cefr === 'B1' || item.cefr === 'B2' ? '#fef3c7' : '#ecfdf5'),
                        color: item.cefr === 'C1' || item.cefr === 'C2' ? '#9b1c1c' : (item.cefr === 'B1' || item.cefr === 'B2' ? '#92400e' : '#065f46')
                      }}>
                        {item.cefr}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                      {item.awl ? (
                        <span style={{ fontSize: '12px', background: 'rgba(111, 66, 193, 0.08)', color: '#6f42c1', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                          {item.awl}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-outline)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => openEditModal(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,91,191,0.08)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button 
                          onClick={() => confirmDelete(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-error, #b91c1c)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(185,28,28,0.08)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer controls (Rows per page & Pagination) */}
        {!loading && vocabularies.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-outline)' }}>
              <span>Hiển thị</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                style={{
                  padding: '4px 8px',
                  border: '1px solid var(--color-outline-variant)',
                  borderRadius: '6px',
                  background: 'var(--color-surface-container-lowest)',
                  color: 'var(--color-on-surface)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
              <span>của {totalCount} từ</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                style={{
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                  color: page === 1 ? 'var(--color-outline)' : 'var(--color-on-surface)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: page === 1 ? 0.5 : 1
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>chevron_left</span>
                Trước
              </button>

              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface)', padding: '0 8px' }}>
                Trang {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  background: 'var(--color-surface-container-low)',
                  border: '1px solid var(--color-outline-variant)',
                  color: page === totalPages ? 'var(--color-outline)' : 'var(--color-on-surface)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-lg)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  opacity: page === totalPages ? 0.5 : 1
                }}
              >
                Sau
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '4px' }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- CRUD MODAL --- */}
      {showCrudModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                {modalMode === 'create' ? 'Thêm Từ Vựng Hệ Thống Mới' : 'Cập Nhật Từ Vựng Hệ Thống'}
              </h3>
              <span 
                className="material-symbols-outlined" 
                onClick={() => setShowCrudModal(false)}
                style={{ color: 'var(--color-outline)', cursor: 'pointer' }}
              >
                close
              </span>
            </div>

            {formError && (
              <div style={{ background: 'rgba(185, 28, 28, 0.1)', border: '1px solid var(--color-error, #b91c1c)', color: '#8b1c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Word field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Từ Vựng *</label>
                <input
                  type="text"
                  name="word"
                  value={formData.word}
                  onChange={handleFormChange}
                  placeholder="ví dụ: evaluate"
                  disabled={modalMode === 'edit'} // Don't change word name in edit mode to avoid clashes, or we can handle it
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--radius-md)',
                    background: modalMode === 'edit' ? 'var(--color-surface-container-low)' : 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    fontSize: '14px',
                    cursor: modalMode === 'edit' ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              {/* IPA & Part of Speech Row */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Phiên Âm (IPA)</label>
                  <input
                    type="text"
                    name="ipa"
                    value={formData.ipa}
                    onChange={handleFormChange}
                    placeholder="ví dụ: /ɪˈvæljueɪt/"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-container-lowest)',
                      color: 'var(--color-on-surface)',
                      outline: 'none',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Từ Loại</label>
                  <select
                    name="partOfSpeech"
                    value={formData.partOfSpeech}
                    onChange={handleFormChange}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-container-lowest)',
                      color: 'var(--color-on-surface)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="verb">Động từ (Verb)</option>
                    <option value="adjective">Tính từ (Adjective)</option>
                    <option value="adverb">Trạng từ (Adverb)</option>
                    <option value="pronoun">Đại từ (Pronoun)</option>
                    <option value="preposition">Giới từ (Preposition)</option>
                    <option value="conjunction">Liên từ (Conjunction)</option>
                    <option value="interjection">Thán từ (Interjection)</option>
                    <option value="phrase">Cụm từ (Phrase)</option>
                    <option value="other">Loại khác (Other)</option>
                  </select>
                </div>
              </div>

              {/* CEFR & AWL Row */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Cấp độ CEFR</label>
                  <select
                    name="cefr"
                    value={formData.cefr}
                    onChange={handleFormChange}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-container-lowest)',
                      color: 'var(--color-on-surface)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="A1">A1 - Elementary</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Advanced</option>
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Phân nhóm AWL</label>
                  <select
                    name="awl"
                    value={formData.awl}
                    onChange={handleFormChange}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-container-lowest)',
                      color: 'var(--color-on-surface)',
                      outline: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Không thuộc AWL</option>
                    <option value="Sublist 1">Sublist 1</option>
                    <option value="Sublist 2">Sublist 2</option>
                    <option value="Sublist 3">Sublist 3</option>
                    <option value="Sublist 4">Sublist 4</option>
                    <option value="Sublist 5">Sublist 5</option>
                    <option value="Sublist 6">Sublist 6</option>
                    <option value="Sublist 7">Sublist 7</option>
                    <option value="Sublist 8">Sublist 8</option>
                    <option value="Sublist 9">Sublist 9</option>
                    <option value="Sublist 10">Sublist 10</option>
                  </select>
                </div>
              </div>

              {/* Definition field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-on-surface-variant)' }}>Định Nghĩa / Nghĩa Tiếng Việt *</label>
                <textarea
                  name="definition"
                  value={formData.definition}
                  onChange={handleFormChange}
                  placeholder="ví dụ: Đánh giá, định giá; ước lượng giá trị của một cái gì đó"
                  rows={3}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCrudModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: formLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {formLoading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>}
                  Lưu Lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- IMPORT UPLOAD WIZARD MODAL --- */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-2xl)',
            width: '100%',
            maxWidth: '550px',
            maxHeight: '85vh',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleIn 0.2s ease-out',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Tải lên CSV - Nhập từ vựng hàng loạt
              </h3>
              <span 
                className="material-symbols-outlined" 
                onClick={() => setShowUploadModal(false)}
                style={{ color: 'var(--color-outline)', cursor: 'pointer' }}
              >
                close
              </span>
            </div>

            {/* Template downloader alert */}
            <div style={{ 
              background: 'var(--color-surface-container-low)', 
              border: '1px solid var(--color-outline-variant)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '12px 14px', 
              fontSize: '13px', 
              color: 'var(--color-on-surface-variant)', 
              lineHeight: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>Quy định tiêu đề cột:</strong> <code>Word, IPA, Part of Speech, Definition, CEFR, AWL</code>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-outline)' }}>
                  * Bắt buộc có cột <strong>Word</strong> và <strong>Definition</strong>. Trùng từ sẽ tự động cập nhật.
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 500 }}>
                  💡 Khuyên dùng: Nên tải file mẫu và chỉnh sửa để tránh lỗi font hoặc dính cột trên Microsoft Excel.
                </p>
              </div>
              <button 
                onClick={downloadTemplate}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-primary)',
                  color: 'var(--color-primary)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
                Tải Mẫu
              </button>
            </div>

            {importError && (
              <div style={{ background: 'rgba(185, 28, 28, 0.1)', border: '1px solid var(--color-error, #b91c1c)', color: '#8b1c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                <span>{importError}</span>
              </div>
            )}

            {/* Dropzone Area */}
            {!importResults && (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                style={{
                  border: '2px dashed var(--color-outline-variant)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(0, 91, 191, 0.02)' : 'var(--color-surface-container-low)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  borderColor: selectedFile ? 'var(--color-primary)' : 'var(--color-outline-variant)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = selectedFile ? 'var(--color-primary)' : 'var(--color-outline-variant)' }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  style={{ display: 'none' }}
                />
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: selectedFile ? 'var(--color-primary)' : 'var(--color-outline)', marginBottom: '12px' }}>
                  {selectedFile ? 'task' : 'cloud_upload'}
                </span>
                
                {selectedFile ? (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '4px' }}>
                      {selectedFile.name}
                    </h4>
                    <p style={{ color: 'var(--color-outline)', fontSize: '12px' }}>
                      Kích thước: {(selectedFile.size / 1024).toFixed(2)} KB - Đã sẵn sàng xử lý
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '4px' }}>
                      Kéo thả tập tin CSV vào đây hoặc click để chọn
                    </h4>
                    <p style={{ color: 'var(--color-outline)', fontSize: '12px' }}>
                      Hệ thống chỉ hỗ trợ tập tin .csv mã hóa UTF-8
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Import results summary */}
            {importResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ 
                  background: importResults.errors.length > 0 ? 'rgba(253, 126, 20, 0.06)' : 'rgba(40, 167, 69, 0.06)',
                  border: `1px solid ${importResults.errors.length > 0 ? 'var(--color-warning, #fd7e14)' : 'var(--color-success, #28a745)'}`,
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span className="material-symbols-outlined" style={{ color: importResults.errors.length > 0 ? 'var(--color-warning, #fd7e14)' : 'var(--color-success, #28a745)' }}>
                      {importResults.errors.length > 0 ? 'warning' : 'check_circle'}
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-on-surface)' }}>Kết quả Import dữ liệu</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                    <div style={{ background: 'var(--color-surface-container-lowest)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-outline)', fontWeight: 600 }}>TỪ THÊM MỚI</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success, #28a745)', marginTop: '2px' }}>{importResults.createdCount}</div>
                    </div>
                    <div style={{ background: 'var(--color-surface-container-lowest)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-outline)', fontWeight: 600 }}>TỪ CẬP NHẬT</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>{importResults.updatedCount}</div>
                    </div>
                  </div>
                </div>

                {/* Listing warnings/errors */}
                {importResults.errors.length > 0 && (
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-error, #b91c1c)', marginBottom: '6px' }}>
                      Chi tiết lỗi / cảnh báo ({importResults.errors.length}):
                    </h5>
                    <div style={{ 
                      maxHeight: '150px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--color-outline-variant)', 
                      borderRadius: '8px', 
                      background: 'var(--color-surface-container-low)',
                      fontSize: '12px'
                    }}>
                      {importResults.errors.map((err, i) => (
                        <div key={i} style={{ padding: '8px 12px', borderBottom: i === importResults.errors.length - 1 ? 'none' : '1px solid var(--color-outline-variant)', display: 'flex', gap: '6px', color: 'var(--color-on-surface-variant)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-outline)' }}>Dòng {err.line}:</span>
                          {err.word && <span style={{ fontWeight: 700, color: 'var(--color-on-surface)' }}>"{err.word}":</span>}
                          <span>{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--color-outline-variant)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {importResults ? 'Đóng' : 'Hủy'}
              </button>

              {!importResults && (
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={importLoading || !selectedFile}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: selectedFile ? 'pointer' : 'not-allowed',
                    opacity: importLoading || !selectedFile ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {importLoading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>}
                  Bắt đầu nạp (Import)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error, #b91c1c)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Xác nhận xóa từ vựng</h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa từ vựng chuẩn <strong>"{wordToDelete?.word}"</strong> ra khỏi kho từ vựng toàn hệ thống của LexiGrow? 
              <br />
              <span style={{ color: 'var(--color-outline)', fontSize: '12px' }}>* Thao tác này không thể hoàn tác.</span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setWordToDelete(null); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-outline-variant)',
                  color: 'var(--color-on-surface)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                style={{
                  background: 'var(--color-error, #b91c1c)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
