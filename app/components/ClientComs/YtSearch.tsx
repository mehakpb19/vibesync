"use client";

import searchYouTube, {
  NextpagesearchYouTube,
} from "@/app/Actions/SearchAction";
import { useEffect, useState, UIEvent } from "react";
import { UpdatePlay } from "@/app/Actions/RoomAction";
import { IoSearchOutline } from "react-icons/io5";
import useDebounce from "@/app/hooks/UseDebouncing";

export default function YtSearch({ roomId }: { roomId: string }) {




  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>([]);
  const [res, setRes] = useState<any>({});
  const [isloading, setIsloading] = useState(false);
  const debouncedSearchTerm = useDebounce(input, 500);



  const handleScroll = async (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop === target.clientHeight;

    if (isAtBottom) {
      setIsloading(true);
      const newres = await NextpagesearchYouTube(res);
      setRes(newres);
      setResult((prevItems:any):any => [...prevItems, ...(newres?.items || [])]);
      setIsloading(false);
    }
  };

  useEffect(() => {
    const fnc = async () => {
      setIsloading(true);
      const res = await searchYouTube(input);
      setRes(res);
      setResult(res.items);
      setIsloading(false);
    };
    if (debouncedSearchTerm) fnc();
  }, [debouncedSearchTerm]);
  return (
    <div className="flex flex-col h-full">
      <div className="flex px-2 pt-2">
        <div className="relative w-full">
          <input
            className="border w-full h-10  text-lg border-gray-400 rounded-lg outline-0  pl-10"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type to search..."
          />
          <span className="absolute  left-2 top-2.5">
            <IoSearchOutline size={20} />
          </span>
        </div>
      </div>
      <div
        className="h-90 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-0 items-center flex flex-col"
        onScroll={handleScroll}
      >
        {result.map((e:any, i:any) => (
          <button
            onClick={() => {
              UpdatePlay(roomId, e.id);
            }}
            className="active:scale-99 hover:-translate-y-0.5 hover:scale-102 w-full rounded-2xl  transition-transform duration-100 flex h-20 bg-[#191d29de] my-2 "
            key={i}
          >
            <div className="h-full w-50">
              <img
                loading="lazy"
                src={e.thumbnail.thumbnails[0].url}
                className="p-1 rounded-2xl h-full w-full"
                alt=""
              />
            </div>
            <div className="flex text-start flex-col justify-center h-full w-full min-w-0">
              <div className="truncate">{e.title}</div>
              <div className="truncate">{e.shortBylineText.runs[0].text}</div>
            </div>
          </button>
        ))}
        <div>
          {isloading && "is loading"}
        </div>
      </div>
    </div>
  );
}
