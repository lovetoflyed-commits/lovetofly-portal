export default function ContentGrid() {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <article className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md transition">
        <h3 className="text-sm font-semibold mb-2">
          Como interpretar METAR e TAF corretamente
        </h3>
        <p className="text-xs text-gray-600">
          Guia essencial para pilotos alunos e privados.
        </p>
      </article>

      <article className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md transition">
        <h3 className="text-sm font-semibold mb-2">
          Atualizações recentes nos RBACs da ANAC
        </h3>
        <p className="text-xs text-gray-600">
          O que mudou e como isso afeta sua formação.
        </p>
      </article>

      <article className="bg-white border border-gray-200 rounded-md p-4 hover:shadow-md transition">
        <h3 className="text-sm font-semibold mb-2">
          Carreira de piloto: caminhos possíveis no Brasil
        </h3>
        <p className="text-xs text-gray-600">
          Aviação geral, executiva e linhas aéreas.
        </p>
      </article>
    </section>
  );
}
