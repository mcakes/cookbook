import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Cookbook3</h1>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<p>Home</p>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
