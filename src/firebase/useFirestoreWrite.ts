import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

const useFirestoreWrite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const writeData = async (collectionName: string, data: any, docId = null) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (docId) {
        // If docId is provided, update or set the document
        await setDoc(doc(db, collectionName, docId), data);
      } else {
        // If no docId, create a new document
        await addDoc(collection(db, collectionName), data);
      }
      console.log("SUCESS");
      setSuccess(true);
    } catch (err) {
      console.log("ERR", err);
      setError((err as any).message);
    } finally {
      setLoading(false);
    }
  };

  return { writeData, loading, error, success };
};

export default useFirestoreWrite;
