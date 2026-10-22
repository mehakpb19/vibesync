import Rompage from "./Rompage";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = await params;

  return (
    <div className="flex flex-col justify-center items-center  bg-linear-to-br to-[#223157] from-[#223157] h-screen max-h-full  w-full">
      <Rompage roomid={roomid} />
    </div>
  );
}
