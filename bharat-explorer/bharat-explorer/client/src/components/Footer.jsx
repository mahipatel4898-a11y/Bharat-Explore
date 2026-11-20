import { Link } from 'react-router-dom'
import { FiGithub, FiGlobe, FiLinkedin, FiMail, FiMapPin } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070a10]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-400 text-base font-black text-slate-950">BE</div>
              <div>
                <div className="text-xl font-black text-white">Bharat Explorer</div>
                <div className="text-sm font-semibold text-amber-300">AI Powered Smart Travel Platform for India</div>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              A full-stack travel platform with React, Express, SQLite, AI-style trip planning, authenticated wishlists, admin management, rich destination data, and accurate maps.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <FiMapPin className="text-amber-300" /> Built in India for a final college project and portfolio showcase.
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Explore</h4>
            <div className="space-y-2 text-sm text-slate-400">
              {['Ahmedabad', 'Jaipur', 'Udaipur', 'Goa', 'Manali'].map((city) => (
                <Link key={city} to={`/search?q=${city}`} className="block transition hover:text-amber-300">{city}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Product</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <Link to="/trip-planner" className="block transition hover:text-amber-300">Trip Planner</Link>
              <Link to="/wishlist" className="block transition hover:text-amber-300">Wishlist</Link>
              <Link to="/search?q=beach" className="block transition hover:text-amber-300">Search</Link>
              <Link to="/login" className="block transition hover:text-amber-300">Demo Login</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">Project Stack</h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'Vite', 'Tailwind', 'Node', 'Express', 'SQLite'].map((item) => (
                <span key={item} className="badge bg-white/10 text-slate-300">{item}</span>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {[FiGithub, FiLinkedin, FiMail, FiGlobe].map((Icon, index) => (
                <span key={index} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300">
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row">
          <p>Copyright 2026 Bharat Explorer. College submission and portfolio project.</p>
          <p>Frontend + Backend + SQLite database, ready for local demo.</p>
        </div>
      </div>
    </footer>
  )
}
