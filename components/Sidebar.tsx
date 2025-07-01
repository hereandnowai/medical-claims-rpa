
import React from 'react';
import { BRANDING } from '../constants';
import { HomeIcon, UploadIcon, LinkedinIcon, GithubIcon, XIcon, BlogIcon } from './icons/Icons';

type View = 'dashboard' | 'processor';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
      isActive
        ? 'bg-primary text-secondary-dark font-bold shadow-lg'
        : 'text-gray-300 hover:bg-secondary-light hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ view, setView }) => {
  const socialLinks = [
    { href: BRANDING.brand.socialMedia.linkedin, icon: <LinkedinIcon />, name: 'LinkedIn' },
    { href: BRANDING.brand.socialMedia.github, icon: <GithubIcon />, name: 'GitHub' },
    { href: BRANDING.brand.socialMedia.x, icon: <XIcon />, name: 'X' },
    { href: BRANDING.brand.socialMedia.blog, icon: <BlogIcon />, name: 'Blog' },
  ];

  return (
    <aside className="w-64 bg-secondary-dark p-4 flex flex-col justify-between shadow-2xl">
      <div>
        <div className="flex items-center justify-center mb-8">
            <img src={BRANDING.brand.chatbot.face} alt="Chatbot Face" className="h-20 w-20 rounded-full border-2 border-primary" />
        </div>
        <nav>
          <ul>
            <NavItem
              icon={<HomeIcon />}
              label="Dashboard"
              isActive={view === 'dashboard'}
              onClick={() => setView('dashboard')}
            />
            <NavItem
              icon={<UploadIcon />}
              label="Process Claims"
              isActive={view === 'processor'}
              onClick={() => setView('processor')}
            />
          </ul>
        </nav>
      </div>
      <div>
        <div className="flex justify-center space-x-4">
          {socialLinks.map(link => (
            <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors duration-200" title={link.name}>
              {link.icon}
            </a>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          © {new Date().getFullYear()} {BRANDING.brand.organizationShortName}
        </p>
        <p className="text-center text-[10px] text-gray-600 mt-1">
          Developed by SAKTHI KANNAN [ AI Products Engineering Team ]
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
