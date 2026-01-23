import React, { useState, useEffect, useRef } from 'react'
import api from '../../../api/axiosClient'

export default function ECardDesigner({ onChange, onExport, initial = {} }) {
  const [template, setTemplate] = useState(initial.template || 'classic')
  const [bgColor, setBgColor] = useState(initial.bgColor || '#ffffff')
  const [textColor, setTextColor] = useState(initial.textColor || '#0f172a')
  const [title, setTitle] = useState(initial.title || 'Congrats!')
  const [message, setMessage] = useState(initial.message || '')
  const [sender, setSender] = useState(initial.sender || '')
  const [image, setImage] = useState(initial.image || null)

  // Build a small HTML snippet representing the e-card
  function buildHtml() {
    const imgHtml = image ? `<div style="text-align:center;margin-bottom:12px"><img src=\"${image}\" style=\"max-width:100%;border-radius:8px;display:block;margin:0 auto;\"/></div>` : ''
    return `
      <div style="background:${bgColor};color:${textColor};padding:24px;border-radius:16px;font-family:Inter,system-ui,Arial;width:100%;min-height:180px;overflow:auto;box-sizing:border-box;">
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${title}</div>
        ${imgHtml}
        <div style="font-size:14px;line-height:1.5;margin-bottom:10px;">${message || ''}</div>
        <div style="font-size:13px;opacity:0.85">From: ${sender || '—'}</div>
      </div>
    `
  }

  useEffect(() => {
    if (typeof onChange === 'function') onChange(buildHtml())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, bgColor, textColor, title, message, sender, image])

  async function handleImage(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    // show local preview immediately
    const preview = URL.createObjectURL(f)
    setImage(preview)

    // upload to backend so we can reference a permanent URL
    try {
      const form = new FormData()
      form.append('files', f)
      const res = await api.post('/recognition/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const uploaded = res.data || []
      const url = uploaded[0]?.url
      if (url) {
        // set image to the uploaded url so final e-card uses a permanent asset
        setImage(url)
        if (typeof onExport === 'function') {
          // let parent know an image was attached (parent can treat this as media)
          onExport(url)
        }
      }
    } catch (err) {
      console.error('Image upload failed', err)
    }
  }

  const previewRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  async function handleExportPNG() {
    try {
      setExporting(true)
      const html2canvas = (await import('html2canvas')).default
      const el = previewRef.current
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2 })
      return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return reject(new Error('Failed to render image'))
          const form = new FormData()
          form.append('files', new File([blob], 'ecard.png', { type: 'image/png' }))
          const res = await api.post('/recognition/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
          const uploaded = res.data || []
          const url = uploaded[0]?.url
          if (typeof onExport === 'function') onExport(url)
          setExporting(false)
          resolve(url)
        }, 'image/png')
      })
    } catch (err) {
      console.error('Export failed', err)
      setExporting(false)
      throw err
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[13px] font-normal text-white mb-2">Template</div>
        <div className="flex gap-2">
          <button onClick={() => setTemplate('classic')} type="button" className={`px-3 py-1 rounded-lg ${template==='classic'?'bg-indigo-500 text-white':'bg-surface text-text-main'}`}>Classic</button>
          <button onClick={() => setTemplate('modern')} type="button" className={`px-3 py-1 rounded-lg ${template==='modern'?'bg-indigo-500 text-white':'bg-surface text-text-main'}`}>Modern</button>
          <button onClick={() => setTemplate('fun')} type="button" className={`px-3 py-1 rounded-lg ${template==='fun'?'bg-indigo-500 text-white':'bg-surface text-text-main'}`}>Fun</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[13px] font-normal text-white mb-2">Background</div>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 p-1 rounded-lg" />
        </div>

        <div>
          <div className="text-[13px] font-normal text-white mb-2">Text Color</div>
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 p-1 rounded-lg" />
        </div>
      </div>

      <div>
        <div className="text-[13px] font-normal text-white mb-2">Title</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-indigo-500/10" />
      </div>

      <div>
        <div className="text-[13px] font-normal text-white mb-2">Message</div>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-indigo-500/10 min-h-[80px]" />
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <div className="text-[13px] font-normal text-white mb-2">Sender name</div>
          <input value={sender} onChange={(e) => setSender(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-indigo-500/10" />
        </div>
        <div>
          <div className="text-[13px] font-normal text-white mb-2">Image (optional)</div>
          <input type="file" accept="image/*" onChange={handleImage} className="w-full" />
        </div>
      </div>

      <div>
        <div className="text-[13px] font-normal text-white mb-2">Preview</div>
        <div className="p-6 bg-card border border-border-soft rounded-2xl shadow-2xl">
          <div className="w-full">
            <div ref={previewRef} id="ecard-preview" className="w-full" dangerouslySetInnerHTML={{ __html: buildHtml() }} />
          </div>
        </div>
        <div className="mt-3 flex gap-2 items-center">
          <button type="button" disabled={exporting} onClick={async () => { try { await handleExportPNG(); alert('E-Card exported and uploaded'); } catch { alert('Export failed') } }} className="px-4 py-2 rounded-lg btn-accent text-white font-bold disabled:opacity-60">
            {exporting ? 'Exporting…' : 'Export PNG & Upload'}
          </button>
          {exporting && <div className="text-sm opacity-70">Rendering image…</div>}
        </div>
      </div>
    </div>
  )
}
