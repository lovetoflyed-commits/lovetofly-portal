export default function ContentGrid() {
  return (
    <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <article className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md 
transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
        <div className="h-2 w-12 bg-blue-500 rounded-full mb-4 group-hover:w-full transition-all 
duration-500"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
          Como interpretar METAR e TAF corretamente
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Guia essencial para pilotos alunos e privados. Aprenda a ler os códigos meteorológicos com 
segurança.
        </p>
      </article>

      <article className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md 
transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
        <div className="h-2 w-12 bg-green-500 rounded-full mb-4 group-hover:w-full transition-all 
duration-500"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-green-600 transition-colors">
          Atualizações recentes nos RBACs da ANAC
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          O que mudou nas regulações e como isso afeta sua formação e operação diária.
        </p>
      </article>

      <article className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md 
transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
        <div className="h-2 w-12 bg-orange-500 rounded-full mb-4 group-hover:w-full transition-all 
duration-500"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">
          Carreira de piloto: caminhos possíveis
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          Aviação geral, executiva e linhas aéreas. Descubra qual perfil se encaixa melhor com seus 
objetivos.
        </p>
      </article>
    </section>
  );
}

