import React, { useState } from 'react';
import { AlertTriangle, Box, Minus, Plus, PlusCircle, Skull, Trash2, Wand2, X } from 'lucide-react';
import { Currency, Player } from '../../types';
import { cx } from '../ui';

const COINS: { key: keyof Currency; label: string; color: string }[] = [
  { key: 'gold', label: 'PO', color: 'text-yellow-400' },
  { key: 'silver', label: 'PA', color: 'text-gray-300' },
  { key: 'copper', label: 'PC', color: 'text-orange-400' },
];

interface Props {
  player: Player;
  onCurrency: (type: keyof Currency, amount: number) => void;
  onItemQty: (itemId: string, delta: number) => void;
  onRemoveCondition: (conditionId: string) => void;
  onAddItem: () => void;
  onDelete: () => void;
}

const PlayerCard: React.FC<Props> = ({ player, onCurrency, onItemQty, onRemoveCondition, onAddItem, onDelete }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-black/40 border border-gold-dark/20 rounded-xl overflow-hidden">
      <div className="pl-3 pr-1 py-1 border-b border-gold-dark/10 flex justify-between items-center bg-gold-dark/5">
        <span className="font-header text-sm uppercase text-gold-antique truncate">{player.name}</span>
        <div className="flex items-center">
          <button type="button" onClick={onAddItem} aria-label={`Ajouter un objet à ${player.name}`} className="w-11 h-11 flex items-center justify-center text-gold-dark hover:text-gold-antique">
            <PlusCircle className="w-5 h-5" />
          </button>
          {/* Deux appuis pour supprimer : évite de perdre un joueur par erreur */}
          <button
            type="button"
            onClick={() => {
              if (confirmDelete) onDelete();
              else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 3000);
              }
            }}
            aria-label={confirmDelete ? 'Confirmer la suppression' : `Supprimer ${player.name}`}
            className={cx('h-11 flex items-center justify-center gap-1 px-3 text-xs', confirmDelete ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-red-400')}
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete && 'Sûr ?'}
          </button>
        </div>
      </div>

      {player.conditions?.length > 0 && (
        <ul className="p-2 space-y-1">
          {player.conditions.map((c) => (
            <li
              key={c.id}
              className={cx(
                'pl-3 rounded-lg border text-xs flex justify-between items-center',
                c.isPenalty ? 'bg-blood-red/10 text-red-300 border-blood-red/40' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              )}
            >
              <span className="py-2 min-w-0">
                <span className="font-bold uppercase flex items-center gap-1.5">
                  {c.isPenalty ? <Skull className="w-3 h-3 shrink-0" /> : <Wand2 className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{c.name}</span>
                </span>
                {c.description && <span className="block opacity-80 mt-0.5">{c.description}</span>}
              </span>
              <button type="button" onClick={() => onRemoveCondition(c.id)} aria-label={`Retirer ${c.name}`} className="w-10 h-10 flex items-center justify-center shrink-0">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="p-2 grid grid-cols-3 gap-1.5">
        {COINS.map((coin) => (
          <div key={coin.key} className="bg-black/40 rounded-lg border border-white/5 flex flex-col items-center">
            <span className={cx('text-base font-bold pt-1', coin.color)}>
              {player.currency[coin.key] ?? 0} <span className="text-[10px] opacity-70">{coin.label}</span>
            </span>
            <div className="flex w-full border-t border-white/5">
              <button type="button" onClick={() => onCurrency(coin.key, -1)} aria-label={`Retirer 1 ${coin.label}`} className="flex-1 h-9 flex items-center justify-center text-gray-400 hover:text-red-400">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => onCurrency(coin.key, 1)} aria-label={`Ajouter 1 ${coin.label}`} className="flex-1 h-9 flex items-center justify-center text-gray-400 hover:text-green-400">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ul className="px-2 pb-2 space-y-1">
        {player.inventory?.map((item) => (
          <li
            key={item.id}
            className={cx('rounded-lg border', item.isPenalty ? 'bg-blood-red/5 border-blood-red/40' : 'border-emerald-500/40 bg-emerald-500/5')}
          >
            <div className="flex items-center gap-2 pl-2">
              <button
                type="button"
                className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                aria-expanded={expanded === item.id}
              >
                <span className="w-7 h-7 rounded bg-black/60 shrink-0 border border-white/10 overflow-hidden flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Box className={cx('w-3.5 h-3.5', item.isPenalty ? 'text-red-400' : 'text-emerald-400')} />
                  )}
                </span>
                <span className={cx('text-xs font-bold uppercase truncate', item.isPenalty ? 'text-red-300' : 'text-emerald-300')}>
                  {item.isPenalty && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {item.name} {item.quantity > 1 && `×${item.quantity}`}
                </span>
              </button>
              <button type="button" onClick={() => onItemQty(item.id, -1)} aria-label={`Retirer un ${item.name}`} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-400 shrink-0">
                <Minus className="w-4 h-4" />
              </button>
            </div>
            {expanded === item.id && (
              <p className="px-3 pb-2 text-xs text-parchment/80 italic border-t border-white/5 pt-2">{item.description || 'Aucune description.'}</p>
            )}
          </li>
        ))}
        {(!player.inventory || player.inventory.length === 0) && <li className="text-xs text-gray-600 italic text-center py-2">Sac vide</li>}
      </ul>
    </div>
  );
};

export default PlayerCard;
