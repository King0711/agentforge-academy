import { departments } from '../data/departments';

export default function DepartmentFilter({ value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
      {departments.map((dept) => {
        const active = value === dept.id;
        return (
          <button
            key={dept.id}
            onClick={() => onChange(dept.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
              active
                ? 'text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            style={
              active
                ? { backgroundColor: `${dept.color}26`, borderColor: dept.color, color: dept.color }
                : undefined
            }
          >
            <span>{dept.icon}</span>
            {dept.name}
          </button>
        );
      })}
    </div>
  );
}
