import Gallery from "./components/Gallery";

function App() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-stone-950 text-stone-100 font-sans selection:bg-orange-500 selection:text-white">
      <header className="sticky top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-md border-b-2 border-stone-700/50 mb-2">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-light tracking-widest uppercase">
            Galeria <span className="font-bold text-orange-500">Pro</span>
          </h1>
        </div>
      </header>
      <main className="flex-grow w-full py-4 sm:py-6 px-4 sm:px-6 flex flex-col items-center">
        <div className="w-full max-w-7xl mx-auto">
          <Gallery />
        </div>
      </main>
    </div>
  );
}

export default App;
