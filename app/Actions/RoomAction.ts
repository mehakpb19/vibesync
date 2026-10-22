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
  await get(roomRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const Users = snapshot.val().Users;
        Users.push(user);
        const userExits = snapshot.val().users.includes(user);
        if (userExits) {
          newid = "DONTGO";
        }
      } else {
        setRoomValue(
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
    })
    .catch((error) => {
      console.error(error);
    });
  return newid;
}

export async function adduser(roomId: string, user: string) {
  const roomRef = ref(db, `rooms/${roomId}`);

  try {
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const users = data.Users || [];

      // 1. Check for existence before modifying the array
      if (!users.includes(user)) {
        users.push(user);

        // 2. Use update() to target only the specific field, avoiding overwriting other data
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

        // Filter out the user to be removed
        currentData.Users = users.filter((e: string) => e !== user);
      }
      return currentData;
    });
  } catch (error) {
    console.error("Failed to remove user securely:", error);
    throw error;
  }
}
export async function updateIspalying(roomId: string, isPaused: boolean) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      await update(roomRef, { isPlaying: isPaused });
    }
  } catch (error) {
    console.error("Failed to add user to room:", error);
    throw error;
  }
}
export async function updateTimeStamp(roomId: string, curentTime: number) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      await update(roomRef, { timestamp: curentTime });
    }
  } catch (error) {
    console.error("Failed to add user to room:", error);
    throw error;
  }
}

export async function UpdatePlay(roomId: string, ytId: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  try {
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      await update(roomRef, { videoId: ytId, isPlaying: true });
    }
  } catch (error) {
    console.error("Failed to add user to room:", error);
    throw error;
  }
}
