import { NavLink } from 'react-router-dom';

const menu = [
  { name: 'Home', path: '/', icon: '🏠' },
  // { name: 'Document Upload', path: '/upload', icon: '📤' },
  { name: 'Contract Search & Chat', path: '/compare-chat', icon: '🔍' },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white shadow-lg flex flex-col">
      <nav className="flex flex-col gap-1 py-4 px-4">
        {menu.map(item => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition text-gray-700 hover:bg-indigo-50 ${
                isActive ? 'bg-indigo-100 font-semibold text-indigo-700' : ''
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
