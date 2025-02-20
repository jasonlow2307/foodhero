import { useState, useEffect } from "react";
import { collection, onSnapshot, QuerySnapshot } from "firebase/firestore";
import { db } from "./firebase";

const useFirestoreCollection = (collectionName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot: QuerySnapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(items);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
};

export default useFirestoreCollection;
