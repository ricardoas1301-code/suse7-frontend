/* ----------------------------------------------
   COMPONENTE: StatCard (Versão Premium)
---------------------------------------------- */

export default function StatCard({ title, value, badge, color = "#3b82f6", description }) {
  return (
    <div
      className="
        stat-card-premium
        bg-white
        rounded-2xl
        p-6
        shadow-sm
        border
        transition-all
        duration-200
        hover:shadow-md
        hover:-translate-y-[2px]
        flex
        flex-col
        gap-3
      "
    >
      {/* Topo: título + ícone */}
      <div className="flex items-center justify-between">
        
        <span className="text-gray-500 font-medium text-sm">
          {title}
        </span>

        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${color}cc, ${color}99)`
          }}
        >
          {badge}
        </div>

      </div>

      {/* Valor */}
      <span className="text-4xl font-bold text-gray-900 leading-none tracking-tight">
        {value}
      </span>

      {/* Descrição opcional */}
      {description && (
        <span className="text-sm text-gray-500 mt-[-6px]">
          {description}
        </span>
      )}
    </div>
  );
}
