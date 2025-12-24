export default function Hero() {
  return (
    <section className="bg-blue-900 text-white">
      <div className="container mx-auto grid md:grid-cols-2 gap-6 py-10 px-4 items-center">
        <div>
          <span className="text-xs uppercase tracking-wide text-blue-200">
            Portal de Aviação Civil
          </span>

          <h1 className="mt-2 text-2xl md:text-3xl font-bold">
            Informação, formação e autoridade em aviação civil no Brasil
          </h1>

          <p className="mt-3 text-sm text-blue-100 max-w-md">
            Notícias, regulamentos ANAC, carreira de pilotos e conteúdos técnicos
            produzidos pelo canal Love To Fly.
          </p>
        </div>

        <div className="hidden md:block">
          {/* Placeholder para imagem - substitua pelo caminho real depois */}
          <div className="bg-blue-800 h-64 w-full rounded-md shadow-lg flex items-center justify-center">
            <span className="text-blue-400">Imagem do Cockpit</span>
          </div>
        </div>
      </div>
    </section>
  );
}

