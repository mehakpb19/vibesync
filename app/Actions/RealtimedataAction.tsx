'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import db from "@/app/Actions/FirebaseLib";

export default  function GetRealtimeData(roomId: string) {
  const [dataObject, setDataObject] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const dbRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const val = snapshot.val();
      setDataObject(val || {});
      setLoading(false);
    }, (error) => {
      console.error('Error fetching realtime data:', error);
      setLoading(false);
    });

    return () => {
      off(dbRef);
    };
  }, []);

  if (loading) return <p>Loading real-time data...</p>;

  return dataObject
}
