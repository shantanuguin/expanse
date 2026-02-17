import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCollection<T>(collectionName: string, userId?: string | null) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (userId === undefined) return;

        if (!userId) {
            setTimeout(() => {
                setData([]);
                setLoading(false);
            }, 0);
            return;
        }

        const ref = collection(db, collectionName);
        const q = query(ref, where("userId", "==", userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: T[] = [];
            snapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(results);
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, userId]);

    return { data, loading, error };
}
