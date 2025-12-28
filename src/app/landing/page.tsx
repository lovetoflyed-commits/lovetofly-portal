
"use client";
import Sidebar from '../../components/Sidebar';
import { useState } from 'react';

export default function LandingPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register' | null>(null);

  // Handler for when a not-logged user tries to access a feature
  const handleFeatureClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onFeatureClick={handleFeatureClick} disabled />
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold mb-4">Bem-vindo ao LoveToFly Portal</h1>
        <p className="mb-8 text-lg text-gray-600">Explore as funcionalidades, mas faça login ou cadastre-se para acessar!</p>
        {/* Optionally, list features here as disabled */}
      </main>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso restrito</h2>
            <p className="mb-6">Faça login ou cadastre-se para acessar esta funcionalidade.</p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => setModalType('register')}
              >
                Cadastrar
              </button>
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                onClick={() => setModalType('login')}
              >
                Entrar
              </button>
            </div>
            <button
              className="mt-6 text-sm text-gray-500 hover:underline"
              onClick={() => {
                setShowModal(false);
                setModalType(null);
              }}
            >
              Fechar
            </button>
            {/* Render login or register modal if chosen */}
            {modalType === 'login' && (
              <div className="mt-6">[Login Modal Aqui]</div>
            )}
            {modalType === 'register' && (
              <div className="mt-6">[Register Modal Aqui]</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
