'use client';

export function LandingFooter(): JSX.Element {
  return (
    <footer
      className="w-full border-t"
      style={{ backgroundColor: '#ffffff', borderColor: '#e6ebf2' }}
    >
      <div className="max-w-[1200px] mx-auto px-8 py-16">
        <div className="grid grid-cols-5 gap-12">
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#0b1220' }}>
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  For Creators
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  For Supporters
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#0b1220' }}>
              Developers
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  API Docs
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  SDKs
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  GitHub
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Status
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#0b1220' }}>
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Press
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#0b1220' }}>
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Cookies
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#0b1220' }}>
              Social
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="border-t mt-12 pt-8 flex items-center justify-between"
          style={{ borderColor: '#e6ebf2' }}
        >
          <p className="text-sm" style={{ color: '#64748b' }}>
            © 2024 Dorisio. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
              Status
            </a>
            <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
              Privacy
            </a>
            <a href="#" className="text-sm transition-colors hover:text-[#0b1220]" style={{ color: '#334155' }}>
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
