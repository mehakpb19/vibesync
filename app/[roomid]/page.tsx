import YouTubePlayer from '@/app/components/YoutubePlayer';


export default async function RoomPage({params}: {params: Promise<{ roomid: string}>}) {
const { roomid } = await params;
  return (
    <div className="flex flex-col justify-center items-center  bg-linear-to-br from-[#192646] to-[#29323b] h-screen w-full">
      <div>
        <YouTubePlayer videoId={"LxBdXQ7Mqck"}/>
        contor
        </div>
    </div>
  )
}
