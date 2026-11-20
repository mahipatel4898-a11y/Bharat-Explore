import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { FiMessageSquare, FiMic, FiSend, FiX, FiZap } from 'react-icons/fi'

const starterPrompts = [
  'Plan 2 day Goa trip under Rs 12000',
  'Best hotels in Udaipur',
  'Food to try in Ahmedabad',
]

const MEMORY_KEY = 'bharat_ai_guide_preferences'
const interestKeywords = ['heritage', 'food', 'beach', 'mountains', 'luxury', 'budget', 'adventure', 'culture', 'spiritual', 'family', 'solo', 'couple']

const readMemory = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {}
  } catch {
    return {}
  }
}

const mergeUnique = (current = [], next = []) => [...new Set([...current, ...next])].slice(0, 8)

const rememberFromMessage = (message, current = {}) => {
  const next = { ...current }
  const lower = message.toLowerCase()
  const budgetMatch = message.match(/(?:under|below|around|budget(?: is)?|rs|inr|\u20b9)\s*(?:rs|inr|\u20b9)?\s*([\d,]{3,})/i)
  const durationMatch = message.match(/\b(\d{1,2})\s*(day|days|night|nights)\b/i)
  const fromMatch = message.match(/\b(?:from|based in|living in)\s+([a-zA-Z\s]{2,32})(?:$|,|\.|\sfor|\sunder|\swith)/i)
  const destinationMatch = message.match(/\b(?:to|in|for|visit|visiting|plan)\s+([a-zA-Z\s]{2,32})(?:$|,|\.|\sfor|\sunder|\swith|\strip|\sjourney)/i)
  const foundInterests = interestKeywords.filter((keyword) => lower.includes(keyword))

  if (budgetMatch) next.budget = `Rs ${budgetMatch[1].replace(/,/g, '')}`
  if (durationMatch) next.duration = `${durationMatch[1]} ${durationMatch[2]}`
  if (fromMatch) next.location = fromMatch[1].trim()
  if (destinationMatch) next.destination = destinationMatch[1].trim()
  if (foundInterests.length) next.interests = mergeUnique(next.interests, foundInterests)
  if (lower.includes('luxury')) next.travelStyle = 'luxury'
  else if (lower.includes('budget')) next.travelStyle = 'budget'
  else if (lower.includes('family')) next.travelStyle = 'family'
  else if (lower.includes('solo')) next.travelStyle = 'solo'
  else if (lower.includes('couple')) next.travelStyle = 'couple'

  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(next))
  } catch {
    // Chat should keep working even if browser storage is unavailable.
  }
  return next
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste. I am Bharat AI Guide. I can help with travel, hotels, food, bookings, coding, planning, and general knowledge.' },
  ])
  const [memory, setMemory] = useState(readMemory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, active: false })
  const endRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceBaseRef = useRef('')
  const frameRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    setVoiceSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event) => {
      let transcript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript
      }
      setInput(`${voiceBaseRef.current}${transcript}`.trimStart())
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      try {
        recognition.stop()
      } catch {
        // Ignore browser speech cleanup errors.
      }
    }
  }, [])

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
  }, [])

  const send = async (value = input) => {
    const userMessage = value.trim()
    if (!userMessage || loading) return

    setInput('')
    const newMessages = [...messages, { from: 'user', text: userMessage }]
    const nextMemory = rememberFromMessage(userMessage, memory)
    setMemory(nextMemory)
    setMessages(newMessages)
    setLoading(true)
    try {
      const { data } = await axios.post('/api/ai/chat', {
        message: userMessage,
        history: messages
          .filter((m, index) => !(index === 0 && m.from === 'bot'))
          .map(m => ({
            role: m.from === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
        memory: nextMemory
      })
      setMessages((current) => [...current, { from: 'bot', text: data.reply }])
    } catch {
      setMessages((current) => [...current, { from: 'bot', text: 'I could not connect to the Bharat AI Guide. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handlePanelMove = (event) => {
    if (window.matchMedia('(max-width: 640px)').matches) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      setTilt({
        rotateX: Number((-y * 4).toFixed(2)),
        rotateY: Number((x * 4).toFixed(2)),
        active: true,
      })
    })
  }

  const resetTilt = () => setTilt({ rotateX: 0, rotateY: 0, active: false })

  const toggleVoice = () => {
    if (!voiceSupported || !recognitionRef.current) return

    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    try {
      voiceBaseRef.current = input.trim() ? `${input.trim()} ` : ''
      recognitionRef.current.start()
    } catch {
      setListening(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`fixed bottom-6 right-6 z-[60] flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
          open
            ? 'bg-slate-950/90 text-brand-gold-400 hover:shadow-[0_0_40px_rgba(212,175,55,0.18)]'
            : 'bg-gradient-to-br from-brand-gold-400 via-amber-400 to-orange-500 text-slate-950 hover:shadow-[0_0_46px_rgba(245,158,11,0.35)]'
        }`}
        title="Bharat AI Guide"
        aria-label="Toggle Bharat AI Guide"
      >
        {open ? <FiX size={24} /> : <FiMessageSquare size={24} />}
      </button>

      {open && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-3 py-20 sm:px-6">
          <div className="absolute inset-0 bg-[#02040d]/40 backdrop-blur-[2px]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="bharat-ambient-drift absolute left-[6%] top-[16%] h-36 w-[42rem] -rotate-12 rounded-[999px] bg-[linear-gradient(90deg,rgba(56,189,248,0.20),rgba(212,175,55,0.12),rgba(255,255,255,0))] blur-3xl" />
            <div className="bharat-ambient-drift absolute bottom-[10%] right-[2%] h-40 w-[40rem] rotate-12 rounded-[999px] bg-[linear-gradient(90deg,rgba(212,175,55,0.14),rgba(59,130,246,0.16),rgba(255,255,255,0))] blur-3xl [animation-delay:-4s]" />
          </div>

          <section
            onMouseMove={handlePanelMove}
            onMouseLeave={resetTilt}
            className="pointer-events-auto relative flex h-[min(78vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#050814]/80 shadow-[0_30px_100px_rgba(0,0,0,0.72)] backdrop-blur-2xl will-change-transform"
            style={{
              transform: `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              transition: tilt.active ? 'transform 180ms ease-out' : 'transform 420ms ease',
            }}
          >
            <div className="pointer-events-none absolute inset-px rounded-[23px] border border-white/10" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,rgba(56,189,248,0.13),rgba(212,175,55,0.12),rgba(15,23,42,0))]" />

            <header className="relative z-10 border-b border-white/10 bg-white/[0.04] px-5 py-5 sm:px-7">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-gold-400/25 bg-brand-gold-400/10 text-brand-gold-400 shadow-[0_0_30px_rgba(212,175,55,0.16)]">
                  <FiZap size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="bg-gradient-to-r from-white via-amber-100 to-brand-gold-400 bg-clip-text text-xl font-black leading-tight text-transparent sm:text-2xl">
                    Bharat AI Guide
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">Your Intelligent Travel Companion</p>
                </div>
              </div>
            </header>

            <div className="bharat-chat-scroll relative z-10 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7">
              {messages.map((message, index) => {
                const isUser = message.from === 'user'

                return (
                  <div
                    key={index}
                    className={`bharat-message-in group flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                  >
                    {!isUser && (
                      <div className="mb-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] sm:flex">
                        <FiZap size={15} />
                      </div>
                    )}

                    {isUser ? (
                      <div className="max-w-[84%] whitespace-pre-line rounded-[24px] rounded-br-md bg-gradient-to-br from-brand-gold-400 via-amber-400 to-orange-500 px-4 py-3 text-sm font-medium leading-7 text-slate-950 shadow-[0_16px_38px_rgba(245,158,11,0.22)] transition duration-300 group-hover:-translate-y-0.5">
                        {message.text}
                      </div>
                    ) : (
                      <div className="max-w-[88%] rounded-[22px] bg-gradient-to-br from-cyan-300/30 via-white/10 to-brand-gold-500/35 p-[1px] shadow-[0_18px_48px_rgba(0,0,0,0.28)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_52px_rgba(14,165,233,0.12)]">
                        <div className="whitespace-pre-line rounded-[21px] bg-slate-950/70 px-4 py-3 text-sm leading-7 text-slate-100 backdrop-blur-xl">
                          {message.text}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {messages.length === 1 && (
                <div className="grid gap-2 pt-1 sm:grid-cols-3">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-xs font-semibold leading-5 text-slate-300 shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:rotate-[1deg] hover:border-brand-gold-400/40 hover:bg-brand-gold-400/10 hover:text-white hover:shadow-[0_18px_42px_rgba(212,175,55,0.12)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="bharat-message-in flex items-end gap-3 justify-start">
                  <div className="mb-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.12)] sm:flex">
                    <FiZap size={15} />
                  </div>
                  <div className="bharat-thinking-card relative overflow-hidden rounded-[22px] bg-gradient-to-br from-cyan-300/30 via-white/10 to-brand-gold-500/35 p-[1px] shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                    <div className="relative z-10 rounded-[21px] bg-slate-950/75 px-4 py-3 text-sm text-slate-300 backdrop-blur-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-400">Bharat AI Guide is thinking...</span>
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map((item) => (
                            <span
                              key={item}
                              className="bharat-typing-dot h-2 w-2 rounded-full bg-brand-gold-400 shadow-[0_0_14px_rgba(212,175,55,0.5)]"
                              style={{ animationDelay: `${item * 0.14}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <footer className="sticky bottom-0 z-20 border-t border-white/10 bg-slate-950/45 px-4 py-4 backdrop-blur-2xl sm:px-7">
              <div className={`flex items-center gap-2 rounded-full border px-2 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.32)] transition-all duration-300 ${
                listening
                  ? 'border-brand-gold-400/60 bg-brand-gold-400/10 shadow-[0_0_38px_rgba(212,175,55,0.18)]'
                  : 'border-white/10 bg-white/[0.07] focus-within:border-brand-gold-400/45 focus-within:shadow-[0_0_36px_rgba(212,175,55,0.12)]'
              }`}>
                <button
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                    listening
                      ? 'bharat-recording-pulse border-brand-gold-400/60 bg-brand-gold-400 text-slate-950'
                      : voiceSupported
                        ? 'border-white/10 bg-white/5 text-slate-300 hover:border-brand-gold-400/45 hover:text-brand-gold-400'
                        : 'cursor-not-allowed border-white/5 bg-white/5 text-slate-600'
                  }`}
                  title={voiceSupported ? 'Voice input' : 'Voice input is not supported in this browser'}
                  aria-label="Voice input"
                >
                  <FiMic size={16} />
                </button>

                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) send()
                  }}
                  placeholder={listening ? 'Listening...' : 'Ask Bharat AI Guide anything...'}
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                />

                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold-400 to-orange-500 text-slate-950 shadow-[0_0_26px_rgba(245,158,11,0.22)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_36px_rgba(245,158,11,0.38)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  <FiSend size={16} />
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
