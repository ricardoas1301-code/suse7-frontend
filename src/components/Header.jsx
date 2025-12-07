export default function Header() {
  return (
    <header className="bg-white shadow-sm w-full py-3 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg">
          S7
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">Painel</h1>
      </div>

      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium shadow-md flex items-center gap-2 transition">
        <span>Conectar Mercado Livre</span>
      </button>
    </header>
  );
}
