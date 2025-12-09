import { NavLink } from 'react-router-dom';

const menu = [
  { name: 'Home', path: '/', icon: '🏠' },
  // { name: 'Document Upload', path: '/upload', icon: '📤' },
  { name: 'Contract Search & Chat', path: '/compare-chat', icon: '🔍' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col py-6 px-4">
      <div className="mb-8 text-2xl font-bold text-blue-700">Contract Agent</div>
      <nav className="flex flex-col gap-2">
        {menu.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition ${
                isActive ? 'bg-blue-100 font-semibold' : ''
              }`
            }
          >
            <span>{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
