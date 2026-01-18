import React, { useEffect, useRef, useState } from 'react'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 })
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi, I am Ojasritu assistant. How can I help you today?' },
  ])
  const [text, setText] = useState('')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const startDrag = (e) => {
    if (!isDesktop) return
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    }
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', endDrag)
  }

  const onDrag = (e) => {
    if (!dragState.current.dragging) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setPosition({ x: dragState.current.originX + dx, y: dragState.current.originY + dy })
  }

  const endDrag = () => {
    if (!dragState.current.dragging) return
    dragState.current.dragging = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
  }

  function send() {
    if (!text.trim()) return
    setMessages((m) => [...m, { from: 'user', text }])
    setText('')
    // stub: in production we would call an AI API or send the message to support@ojasritu.co.in
    setTimeout(() => setMessages((m) => [...m, { from: 'bot', text: "Thanks — we'll get back to you via email or WhatsApp." }]), 800)
  }

  useEffect(() => () => endDrag(), [])

  return (
    <div
      className={`chatbot ${open ? 'open' : ''}`}
      style={isDesktop ? { transform: `translate(${position.x}px, ${position.y}px)` } : undefined}
    >
      <button
        className="chat-toggle"
        onClick={() => setOpen((s) => !s)}
        onMouseDown={startDrag}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? (
          <span className="chat-icon">✕</span>
        ) : (
          <>
            <span className="chat-icon">💬</span>
            <span className="chat-label">Chat Us</span>
          </>
        )}
      </button>
      {open && (
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about products, bookings..." />
            <button onClick={send}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
