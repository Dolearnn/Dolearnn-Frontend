import Image from "next/image";
import graduateImg from "../../assests/home/hero-profile-img.png"
import profileSmallImg from "../../assests/home/small-profile-img.jpg"
import userImg from "../../assests/home/avatar.jpg"
import circleImg from "../../assests/home/circle.png"
export default function Hero() {

    return (
        <section className="bg-[#EEFAF5] rounded-2xl overflow-hidden bg-">
            <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 items-center gap-10">

                {/* LEFT CONTENT */}
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                        Practice <span className="text-blue-600">Smarter</span>, Improve{" "}
                        <br />
                        Faster, and{" "}
                        <span className="text-green-500">Master Your Exams</span>
                    </h1>

                    <p className="mt-5 text-gray-600 max-w-md">
                        Practice real exam questions, get instant results, and improve your score.
                    </p>

                    <button className="mt-6 px-6 py-3 bg-blue-700 text-white rounded-full font-medium hover:bg-blue-800 transition">
                        Start Free Test
                    </button>
                </div>

                {/* RIGHT CONTENT */}
                <div className="relative flex justify-center">

                    {/* background circle */}
                    {/* <div className="absolute w-80 h-80 bg-red-100 rounded-full right-10 top-4"></div> */}
                    <div
                        className="absolute w-[370px] h-[370px] rounded-full left-[70px] top-36
  bg-[url('/circle.png')] bg-cover bg-center"
                    ></div>


                    {/* graduate image */}
                    <Image
                        src={graduateImg} // replace with your image path
                        alt="graduate"
                        className="relative z-10 w-full h-[520px] object-cover"
                    />

                    {/* profile circle */}
                    <Image
                        src={profileSmallImg}   // small profile image
                        alt="profile"
                        className="absolute top-40 left-32 w-20 h-20 rounded-full border-4 border-white shadow-lg"
                    />

                    {/* testimonial card */}
                    <div className="bg-white  z-50 absolute bottom-20 -left-28 shadow-xl rounded-lg px-4 py-3 gap-3">
                        <div className=" z-50  flex items-center">

                            <div className="flex -space-x-2">
                                <Image src={userImg} className="w-10 h-10 rounded-full border-2 object-cover border-white" alt="avatar" />
                                <Image src={userImg} className="w-10 h-10 rounded-full border-2 object-cover border-white" alt="avatar" />
                                <Image src={userImg} className="w-10 h-10  rounded-full border-2 object-cover border-white" alt="avatar" />
                                {/* <img src="/user2.jpg" className="w-7 h-7 rounded-full border-2 border-white" /> */}
                                {/* <img src="/user3.jpg" className="w-7 h-7 rounded-full border-2 border-white" /> */}
                            </div>

                            <div className="text-sm">
                                <div className="text-yellow-400 text-xl">★★★★</div>

                            </div>
                        </div>
                        <p className="text-[#33383B] text-sm mt-2">
                            Over 3000+ learners <br /> engaged globally today
                        </p>

                    </div>
                </div>
            </div>
        </section>
    );
}
