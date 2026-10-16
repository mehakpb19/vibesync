"use server";

import { ref, set, get, onValue } from "firebase/database";
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
        const Users = snapshot.val().users;
        Users.push(user);
        const userExits = snapshot.val().users.includes(user);
        if (userExits) {
          newid = "DONTGO";
        }
      } else {
        setRoomValue(
          {
            videoId: "cIyq_yd7uz4",
            isPlaying: false,
            timestamp: 0,
            lastUpdated: Date.now(),
            users: [user],
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
  await get(roomRef).then((snapshot) => {
    if (snapshot.exists()) {
      const Users = snapshot.val().users || [];
      const userExits = Users.includes(user);
      Users.push(user);
      if (!userExits) {
        setRoomValue(
          {
            videoId: "cIyq_yd7uz4",
            isPlaying: false,
            timestamp: 0,
            lastUpdated: Date.now(),
            users: Users,
          },
          roomRef,
        );
      }
    }
  });
}


export async function removeUser(roomId: string, user: string) {
  const roomRef = ref(db, `rooms/${roomId}`);
  await get(roomRef).then((snapshot) => {
    if (snapshot.exists()) {
      const Users = snapshot.val().users;
      const userExits = Users.find(e=>e==user);
      const updateduserlist = Users.filter(e => e!==user);
        setRoomValue(
          {
            videoId: "cIyq_yd7uz4",
            isPlaying: false,
            timestamp: 0,
            lastUpdated: Date.now(),
            users: updateduserlist,
          },
          roomRef,
        );
    }
  });
}
