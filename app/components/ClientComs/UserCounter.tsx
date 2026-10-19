"use client";
export default function UserCounter({usercount}:{usercount:number}) {
  return (
    <div className="bg-amber-600 text-black font-semibold h-4 pl-4 pr-1 rounded-2xl flex  items-center relative text-[10px]">
      <span className="h-2 w-2 left-1 rounded-full absolute bg-green-500"></span>
      {usercount} Acitve
    </div>
  );
}
