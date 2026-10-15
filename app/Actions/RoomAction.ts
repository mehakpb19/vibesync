"use server";

import { ref, set, get } from "firebase/database";

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
        if (!userExits) {
          setRoomValue(
            {
              videoId: "second",
              isPlaying: false,
              timestamp: 0,
              lastUpdated: Date.now(),
              users: Users,
            },
            roomRef,
          );
        }
        if (userExits) {
          newid = "DONTGO";
        }
      } else {
        setRoomValue(
          {
            videoId: "second",
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

// export async function UpdatePlayingAction(
//   roomId:string, newuser:string
// ): Promise<void> {
//   const roomRef = ref(db, `rooms/${roomId}`);
// });
//   onValue(roomRef, (snapshot) => {
//     const data = snapshot.val();

//     if (data) {
//       console.log("Real-time update received:", data);
//       setData(data);
//     } else {
//       console.log("No data found at this path.");
//     }
//   });
// }
