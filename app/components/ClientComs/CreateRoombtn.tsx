"use client";
import { CreateRoomAction } from "@/app/Actions/RoomAction";
import { useRouter } from "next/navigation";

export default function CreateRoombtn({join, roomId , text,user,setError}:{join:boolean, roomId:string, text:string,user:string,setError:(value: string)=>void}) {
  const router = useRouter();
  return (
    <button
    
  type="button"
  onClick={async () => { 
    if (join==false && !user ) {
      setError("Enter User plz")
      return
    }
    if (join==true && !roomId){
      setError("Enter RoomId plz")
      return
    }

    if (join==true && !user){
      setError("Enter User plz")
      return
      
    }

  const directRoomId = join 
    ? await CreateRoomAction(roomId,user) 
    : await CreateRoomAction(uniqueIdGenerator(),user); 

    if (directRoomId == 'DONTGO') {
      setError("User alredy exit in the room")
      return
    }
  router.push(`/${directRoomId}`);
  localStorage.setItem('roomId',directRoomId);
  localStorage.setItem('user',user);

}}

  className="relative z-10 group border-none bg-transparent p-0 outline-none cursor-pointer font-mono font-light uppercase text-base"
>
  {/* Shadow Layer */}
  <span
    className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-25 rounded-lg transform translate-y-0.5 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] group-hover:translate-y-1 group-hover:duration-[250ms] group-active:translate-y-px pointer-events-none"
  ></span>

  {/* Bottom Edge Layer */}
  <span
    className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-l from-[hsl(217,33%,16%)] via-[hsl(217,33%,32%)] to-[hsl(217,33%,16%)] pointer-events-none"
  ></span>

  {/* Top Interactive Layer */}
  <span
    className="relative flex items-center justify-between py-3 px-6 text-lg text-white rounded-lg transform -translate-y-1 bg-gradient-to-r from-[#f27121] via-[#e94057] to-[#8a2387] gap-3 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] group-hover:-translate-y-1.5 group-hover:duration-[250ms] group-active:-translate-y-0.5 brightness-100 group-hover:brightness-110"
  >
    <span className="select-none">{text}</span>

    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5 ml-2 -mr-1 transition duration-[250ms] group-hover:translate-x-1"
    >
      <path
        clipRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        fillRule="evenodd"
      ></path>
    </svg>
  </span>
</button>
  );
}
const uniqueIdGenerator = (() => {


  let counter = 0;
  
  return () => {
    // 1. Get the last few digits of the timestamp to keep it short
    // (This loops roughly every 27 minutes, ensuring a small number)
    const shortTime = Date.now() % 1679616; // 1679616 is 26^4

    
    // 2. Increment a small counter (0-25) to handle identical millisecond hits
    counter = (counter + 1) % 26; 
    
    // 3. Convert both to Base36 (numbers + letters)
    const timePart = shortTime.toString(36);
    const counterPart = counter.toString(36);
    
    // 4. Combine them. Result will always be 5-6 characters long.
    console.log(`${timePart}${counterPart}`); // e.g., "z5b9a"
    return `${timePart}${counterPart}`;
  };
})();

