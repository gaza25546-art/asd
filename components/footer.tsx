import Link from 'next/link';
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const footerLinks = {
  Club: [
    { href: '/history', label: 'Club History' },
    { href: '/squad', label: 'First Team Squad' },
    { href: '/contact', label: 'Contact Us' },
  ],
  Matches: [
    { href: '/fixtures', label: 'Fixtures & Results' },
    { href: '/table', label: 'League Table' },
    { href: '/predictions', label: 'Prediction Game' },
  ],
  Community: [
    { href: '/forum', label: 'Forum' },
    { href: '/gallery', label: 'Fan Gallery' },
    { href: '/videos', label: 'Videos' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold text-xl">
                DV
              </div>
              <div>
                <span className="font-display text-2xl font-bold">DVSC</span>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Debreceni Vasutas SC
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              The ultimate online destination for DVSC supporters. Hajra Loki!
            </p>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Youtube, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="mt-8 flex flex-col gap-4 border-t border-border/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Nagyerdei Stadion, Debrecen
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              +36 52 123 456
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              info@dvsc.hu
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>
            This is a fan-made website. Not affiliated with Debreceni Vasutas Sport Club.
            For educational and demonstration purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
