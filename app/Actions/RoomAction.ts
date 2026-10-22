"use server";

import { ref, set, get, runTransaction, update } from "firebase/database";
import db from "./FirebaseLib";

async function setRoomValue(roomData: object, roomref: any): Promise<void> {
  await set(roomref, roomData);
}

export async function CreateRoomAction(
  roomId: string,
  user: string,
): Promise<string> {
  let newid = roomId;
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      const existingUsers: string[] = val.Users || val.users || [];
      if (existingUsers.includes(user)) {
        newid = "DONTGO";
      }
    } else {
      await setRoomValue(
        {
          videoId: "ANkxRGvl1VY",
          isPlaying: true,
          timestamp: 0,
          lastUpdated: Date.now(),
          Users: [user],
        },
        roomRef,
      );
    }
  } catch (error) {
    console.error(error);
  }
  return newid;
}

export async function adduser(roomId: string, user: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const users = data.Users || [];
      if (!users.includes(user)) {
        users.push(user);
        await update(roomRef, { Users: users });
      }
    }
  } catch (error) {
    console.error("Failed to add user to room:", error);
    throw error;
  }
}

export async function removeUser(roomId: string, user: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await runTransaction(roomRef, (currentData) => {
      if (currentData) {
        const users = currentData.Users || [];
        currentData.Users = users.filter((e: string) => e !== user);
      }
      return currentData;
    });
  } catch (error) {
    console.error("Failed to remove user securely:", error);
    throw error;
  }
}

// Single atomic update for Play/Pause + Timestamp together
export async function syncPlayerState(
  roomId: string,
  isPlaying: boolean,
  currentTime?: number,
) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const payload: Record<string, any> = {
      isPlaying,
      lastUpdated: Date.now(),
    };
    if (typeof currentTime === "number") {
      payload.timestamp = currentTime;
    }
    await update(roomRef, payload);
  } catch (error) {
    console.error("Failed to sync player state:", error);
  }
}

export async function updateIspalying(roomId: string, isPlaying: boolean) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await update(roomRef, { isPlaying, lastUpdated: Date.now() });
  } catch (error) {
    console.error("Failed to update isPlaying:", error);
  }
}

export async function updateTimeStamp(roomId: string, currentTime: number) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await update(roomRef, { timestamp: currentTime, lastUpdated: Date.now() });
  } catch (error) {
    console.error("Failed to update timestamp:", error);
  }
}

export async function UpdatePlay(roomId: string, ytId: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    await update(roomRef, {
      videoId: ytId,
      isPlaying: true,
      timestamp: 0,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error("Failed to update video:", error);
    throw error;
  }
}