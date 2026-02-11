import React, { useState } from 'react';
import { Key, ExternalLink, ShieldAlert, Sparkles, Eye } from 'lucide-react';

interface ApiKeyGateProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyGate: React.FC<ApiKeyGateProps> = ({ onKeySubmit }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.length < 30) {
      setError("Cette clé runique semble invalide (trop courte).");
      return;
    }
    onKeySubmit(inputKey);
  };

  const handleDemoMode = () => {
    onKeySubmit("DEMO");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blood-dark/20 via-black to-black animate-pulse"></div>
      
      <div className="relative z-10 max-w-lg w-full bg-darker-metal border-2 border-gold-dark/40 p-8 rounded-lg shadow-[0_0_50px_rgba(138,3,3,0.3)] text-center animate-fade-in">
        
        <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-blood-dark/30 border border-gold-dark/30 shadow-glow-gold">
                <Key className="w-12 h-12 text-gold-antique" />
            </div>
        </div>

        <h2 className="font-header text-3xl text-gold-antique mb-4 uppercase tracking-widest">
          Halte, Voyageur
        </h2>
        
        <p className="text-parchment-dark font-body mb-6 leading-relaxed">
          Pour invoquer le Narrateur, vous devez présenter votre propre <strong>Clé API Gemini</strong>.
          <br/>
          <span className="text-sm opacity-80 block mt-2">C'est <strong>totalement gratuit</strong> via le quota personnel offert par Google.</span>
        </p>

        <div className="bg-black/40 border border-gold-dark/20 p-4 rounded mb-6 text-left">
          <h3 className="text-gold-antique font-bold mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Où trouver sa clé gratuitement ?
          </h3>
          <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2 font-body">
            <li>Allez sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline decoration-dotted">Google AI Studio</a>.</li>
            <li>Connectez-vous avec votre compte Google.</li>
            <li>Cliquez sur <strong>"Create API key"</strong>.</li>
            <li>Copiez la chaîne de caractères (commence par "AIza...").</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError(null);
              }}
              placeholder="Collez votre Clé Runique ici..."
              className="w-full bg-black text-center text-parchment font-mono border border-gold-dark/50 rounded p-4 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none placeholder-gray-700 transition-all"
            />
          </div>
          
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 text-sm animate-bounce">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blood-dark to-red-900 hover:from-blood-red hover:to-red-800 text-gold-antique font-header uppercase tracking-wider font-bold rounded shadow-lg border border-gold-dark/30 transition-all transform hover:scale-[1.02]"
          >
            Entrer dans le Donjon
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gold-dark/20">
            <button 
                onClick={handleDemoMode}
                className="text-gray-500 hover:text-parchment text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
            >
                <Eye className="w-4 h-4" />
                Juste visiter l'interface (Mode Démo sans IA)
            </button>
        </div>
        
        <p className="mt-4 text-xs text-gray-600">
          Votre clé est stockée uniquement dans votre navigateur et envoyée directement aux serveurs de Google pour la génération. Aucun intermédiaire.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyGate;