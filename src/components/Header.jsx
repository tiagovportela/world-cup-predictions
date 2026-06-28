import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="max-w-1200px mx-auto px-6 py-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-black">
          ⚽ WORLD CUP
        </Link>
        <nav className="flex gap-8">
          <Link to="/" className="text-sm font-500 text-black hover:text-gray-600 transition-colors uppercase tracking-wide">
            Home
          </Link>
          <Link to="/submit" className="text-sm font-500 text-black hover:text-gray-600 transition-colors uppercase tracking-wide">
            Submit
          </Link>
          <Link to="/admin" className="text-sm font-500 text-black hover:text-gray-600 transition-colors uppercase tracking-wide">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
