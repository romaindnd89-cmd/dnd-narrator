
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SessionState } from '../types';

let supabase: SupabaseClient | null = null;
let currentUrl = '';

export const initSupabase = (url: string, key: string) => {
    if (!url || !key) return null;
    
    // Évite de recréer le client si l'URL n'a pas changé (corrige le warning Multiple instances)
    if (supabase && currentUrl === url) {
        return supabase;
    }

    currentUrl = url;
    supabase = createClient(url, key, {
        auth: { persistSession: false } // Optionnel: réduit les écritures en localstorage
    });
    return supabase;
};

export const saveSessionToCloud = async (session: SessionState) => {
    if (!supabase) return;
    
    const { error } = await supabase
        .from('sessions')
        .upsert({ 
            id: session.id, 
            data: session,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    
    if (error) {
        console.warn("Erreur de synchro Cloud : La table 'sessions' n'existe peut-être pas encore.", error);
    }
};

export const subscribeToSession = (sessionId: string, onUpdate: (data: SessionState) => void) => {
    if (!supabase) return null;

    const channel = supabase
        .channel(`session-${sessionId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
            (payload) => {
                if (payload.new && (payload.new as any).data) {
                    onUpdate((payload.new as any).data);
                }
            }
        )
        .subscribe();

    return () => {
        supabase?.removeChannel(channel);
    };
};

export const getSessionFromCloud = async (sessionId: string): Promise<SessionState | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('data')
            .eq('id', sessionId)
            .single();
        
        if (error) return null;
        return data?.data as SessionState;
    } catch (e) {
        return null;
    }
};
