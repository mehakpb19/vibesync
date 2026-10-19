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
  type="button"
    className="relative z-10 py-1 px-1 group border-none bg-transparent p-0 outline-none cursor-pointer font-mono font-light"
>
  <span
    className="relative flex items-center justify-between py-2 px-4 text-1xl text-white rounded-lg transform -translate-y-1 bg-gradient-to-r from-[#f27121] via-[#e94057] to-[#8a2387] gap-3 transition duration-[600ms] ease-[cubic-bezier(0.3,0.7,0.4,1)] group-hover:-translate-y-1.5 group-hover:duration-[250ms] group-active:-translate-y-0.5 brightness-100 group-hover:brightness-110"
  >
    <span className="select-none">Exit Room!!</span>

    
  </span>
</button>
  );
}