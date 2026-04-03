import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import pratitiLogo from '../assets/pratiti_logo.png';

const BackgroundShapes = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
      style={{ background: 'radial-gradient(circle, #14a0c8 0%, transparent 70%)' }} />
    <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-15"
      style={{ background: 'radial-gradient(circle, #783c78 0%, transparent 70%)' }} />
    <div className="absolute inset-0 opacity-5"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
  </div>
);

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: 'Unified Incident Tracking',
    desc:  'Log, assign, and resolve incidents across IT, HR, Admin, Facilities, and Finance.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'SLA Monitoring',
    desc:  'Real-time breach detection with automated escalation alerts.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: 'Role-Based Access',
    desc:  'Tailored dashboards for Employees, Support Staff, Managers, and Admins.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
    title: 'Analytics & Reports',
    desc:  'Department KPIs, SLA compliance, and exportable CSV reports.',
  },
];

const LoginPage = () => (
  <div className="min-h-screen flex">

    <div
      className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative"
      style={{ background: 'linear-gradient(140deg,#1a1a4e 0%,#3c3c8c 45%,#5a3070 75%,#783c78 100%)' }}
    >
      <BackgroundShapes />

      <div className="relative z-10 flex items-center gap-4">
        <img src={pratitiLogo} alt="Pratiti Logo" width={70} height={70} />
        <div>
          <p className="text-white/50 text-xs tracking-[0.18em] uppercase font-medium">
            Pratiti Technologies
          </p>
          <h1 className="text-white text-xl font-semibold tracking-tight leading-tight">
            Internal Incident<br />Management Portal
          </h1>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
        <div className="mb-10">
          <h2 className="text-white text-3xl xl:text-4xl font-semibold leading-tight tracking-tight mb-4">
            One portal for every<br />
            <span className="font-light" style={{ color: '#28b8dc' }}>incident, resolved.</span>
          </h2>
        </div>
        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={f.title} className="flex items-start gap-3.5 animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s` }}>
              <span className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#28b8dc' }}>
                {f.icon}
              </span>
              <div>
                <p className="text-white text-sm font-medium leading-snug">{f.title}</p>
                <p className="text-white/50 text-xs leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-white/30 text-xs">
        © {new Date().getFullYear()} Pratiti Technologies Pvt. Ltd.
      </p>
    </div>

    <div className="flex-1 flex flex-col bg-gray-50">

      <div className="lg:hidden flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
        <img src={pratitiLogo} alt="Pratiti" width={32} height={32} />
        <div>
          <p className="text-xs text-gray-500 leading-none">Pratiti Technologies</p>
          <p className="text-sm font-semibold text-indigo-800 leading-snug">IIMP</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Pratiti Technologies Pvt. Ltd.
        </p>
      </div>
    </div>
  </div>
);

export default LoginPage;
