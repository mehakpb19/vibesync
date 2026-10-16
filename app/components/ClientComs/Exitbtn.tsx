"use client";
import { useRouter } from "next/navigation";

export default function Exitbtn() {
  const router = useRouter();

  const handleExit = () => {
    localStorage.removeItem("roomid");
    localStorage.clear();
    router.replace("/login");
  };

  return (
    <button
      onClick={handleExit}
      className="bg-[#0d1a27] absolute top-3 right-3 text-white px-4 py-2 rounded-lg mb-4 hover:bg-[#314881] transition-colors duration-300"
    >
      Exit
    </button>
  );
}