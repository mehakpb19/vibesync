import youtubesearchapi from "youtube-search-api";
import { YouTubeSearchResponse } from "@/app/Actions/types/yotube";
import {
  ref,
  set,
  get,
  runTransaction,
  update,
  onValue,
} from "firebase/database";
import db from "./FirebaseLib";
import { useEffect, useState } from "react";

export async function Postmsg(msg: string, roomId: string, user: string) {
  const roomRef = ref(db, `rooms/${roomId}/chat`);
  const newref = ref(db, `rooms/${roomId}/chat/${Date.now()}`);
  try {
    const snapshot = await get(roomRef);
    set(newref, { msg: msg, sender: user });
  } catch (error) {
    console.error("Failed to add user to room:", error);
    throw error;
  }
}

export function Getmsg(roomId: string) {
  const [dataObject, setDataObject] = useState<Record<string, any> | null>(
    null,
  );
  useEffect(() => {
    if (!roomId) {
      setDataObject(null);
      return;
    }

    const dbRef = ref(db, `rooms/${roomId}/chat`);

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setDataObject(
            typeof val === "object" && val !== null ? { ...val } : val,
          );
        } else {
          setDataObject(null);
        }
      },
      (error) => {
        console.error("Error fetching realtime data:", error);
      },
    );

    return () => unsubscribe();
  }, [roomId]);

  return { dataObject };
}
