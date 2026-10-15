import Rompage from "./Rompage";
import Exitbtn from './../components/ClientComs/Exitbtn';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = await params;
  
  return (
    <div className="flex flex-col justify-center items-center  bg-linear-to-br from-[#314881] to-[#0d1a27] h-screen w-full">
      <Exitbtn />
      <Rompage roomid={roomid} />
    </div>
  );
}
