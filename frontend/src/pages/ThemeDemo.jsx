import React from 'react'

export default function ThemeDemo() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Theme Preview: Templatemo Graph Page</h1>

      <p className="mb-4 text-slate-400">
        This preview renders the original template inside an iframe so you can evaluate the look-and-feel without
        modifying existing app styles. Use this route to review before we apply styles to your React components.
      </p>

      <div style={{ height: '80vh', border: '1px solid rgba(148,163,184,0.2)' }}>
        <iframe
          title="Graph Page Preview"
          src="/themes/templatemo_602_graph_page/index.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      <div className="mt-4">
        <a
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md"
          href="/themes/templatemo_602_graph_page/index.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open standalone preview
        </a>
      </div>
    </div>
  )
}
