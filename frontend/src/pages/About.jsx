import React, { useState, useEffect, useRef } from 'react';
import { Play, Quote, Palette, Users, Award, Heart, Camera, Video, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [visibleVideos, setVisibleVideos] = useState(new Set());
  const videoRefs = useRef({});
  const observerRef = useRef(null);

  // Handle video hover interactions
  const handleVideoHover = (videoId, isHovering) => {
    if (isHovering) {
      setActiveVideo(videoId);
    } else {
      setActiveVideo(null);
    }
  };

  const galleryImages = [
    {
      src: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Affshana at Work',
      description: 'Creating beautiful resin pieces'
    },
    {
      src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Workshop Session',
      description: 'Teaching resin art techniques'
    },
    {
      src: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Finished Masterpiece',
      description: 'One of Affshana\'s stunning creations'
    },
    {
      src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Student Workshop',
      description: 'Inspiring creativity in others'
    },
    {
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Behind the Scenes',
      description: 'The creative process'
    },
    {
      src: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?crop=entropy&cs=srgb&fm=jpg&w=500&h=400&fit=crop',
      title: 'Art Exhibition',
      description: 'Showcasing her work'
    }
  ];

  const videos = [
    {
      id: 1,
      title: 'Resin Art Workshop - Episode 1',
      description: 'Learn the basics of resin art with Affshana',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?crop=entropy&cs=srgb&fm=jpg&w=500&h=300&fit=crop',
      duration: '15:30'
    },
    {
      id: 2,
      title: 'Creating Custom Nameplates',
      description: 'Step-by-step guide to personalized resin art',
      thumbnail: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?crop=entropy&cs=srgb&fm=jpg&w=500&h=300&fit=crop',
      duration: '22:45'
    },
    {
      id: 3,
      title: 'Advanced Techniques',
      description: 'Master advanced resin pouring methods',
      thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?crop=entropy&cs=srgb&fm=jpg&w=500&h=300&fit=crop',
      duration: '28:15'
    }
  ];

  const quotes = [
    {
      text: "This isn't just art—it's a part of me. A piece of my dream, poured in layers.",
      author: "Affshana"
    },
    {
      text: "I've always believed that creativity should be accessible to everyone, not just the talented few.",
      author: "Affshana"
    },
    {
      text: "Every workshop is an opportunity to inspire someone to discover their own artistic voice.",
      author: "Affshana"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Hero Section */}
  <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 py-16 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[600px]">

          {/* Left Side - Heading */}
          <div className="lg:col-span-4 flex items-center justify-center lg:justify-start h-full">
            <div className="text-center lg:text-left">
              <h1 className="text-6xl lg:text-7xl xl:text-8xl font-light text-gray-300 leading-none tracking-tight">
                Affshana
              </h1>
              <div className="mt-5 max-w-xs mx-auto lg:mx-0">
                <div className="h-1 w-16 bg-blue-500 mx-auto lg:mx-0 mb-3 rounded-full"></div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">
                  Founder & Creative Director
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Video Section */}
          <div className="lg:col-span-8 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl h-[900px]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-400 to-blue-600">
                {/* Video Background */}
                <video
                  className="w-full h-full object-cover opacity-"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/public/aboutuslanding.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Video Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>

                {/* Video Title Overlay */}
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-bold mb-1">**MOST PROMISING ARTIST**</h3>
                  <p className="text-sm text-blue-100">Artstop Affshana</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>


      {/* New Section */}
<section className="py-16 bg-white min-h-screen">
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
      
      {/* Left Side - Header and Text */}
      <div className="flex flex-col justify-center h-full">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            Our Story
          </span>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            The Story Behind <span className="text-blue-600">ArtStop</span>
          </h1>
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed mb-8">
          <p className="text-lg font-medium text-gray-800 italic border-l-4 border-blue-500 pl-4 py-1">
            "Craft • Create • Inspire – That's ArtStop."
          </p>

          <p className="text-base leading-relaxed">
            Meet Affshana, founder of ArtStop – a creative space where resin art meets innovation. With over a decade of experience, she has turned her passion for art into a brand that designs custom resin creations ranging from elegant home décor and Islamic gifts to meaningful keepsakes.
          </p>

          <p className="text-base leading-relaxed">
            Each piece reflects her unique approach of blending beauty with storytelling, making every artwork personal and timeless.
          </p>

          <p className="text-base leading-relaxed">
            Alongside creating, Affshana conducts resin art workshops that encourage students to explore their creativity in new ways. She inspires them to bring fresh ideas and transform them into innovative resin artworks, keeping ArtStop a hub of creativity, learning, and inspiration.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center group transition-colors">
            Read Full Story
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Right Side - Progress Bars/Portrait Strips */}
      <div className="flex items-center justify-center h-full">
        <div className="relative flex space-x-1 items-center h-[500px] w-full max-w-4xl">
          {/* Progress Bar 1 - Smallest */}
          <div className="relative w-20 bg-gradient-to-b from-gray-900 via-gray-700 to-gray-900 rounded-none overflow-hidden shadow-2xl" style={{height: '50%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 1"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          {/* Progress Bar 2 */}
          <div className="relative w-20 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-600 rounded-none overflow-hidden shadow-2xl" style={{height: '65%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 2"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          {/* Progress Bar 3 */}
          <div className="relative w-20 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-600 rounded-none overflow-hidden shadow-2xl" style={{height: '75%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 3"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          {/* Progress Bar 4 */}
          <div className="relative w-20 bg-gradient-to-b from-purple-500 via-purple-400 to-purple-600 rounded-none overflow-hidden shadow-2xl" style={{height: '85%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 4"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          {/* Progress Bar 5 */}
          <div className="relative w-20 bg-gradient-to-b from-red-500 via-red-400 to-red-600 rounded-none overflow-hidden shadow-2xl" style={{height: '95%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 5"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          {/* Progress Bar 6 - Largest */}
          <div className="relative w-20 bg-gradient-to-b from-amber-500 via-amber-400 to-amber-600 rounded-none overflow-hidden shadow-2xl" style={{height: '100%'}}>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=600&fit=crop&crop=face"
              alt="Portrait 6"
              className="w-full h-full object-cover object-center opacity-90"
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>



      {/* Workshop Gallery */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-1">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Learn with Affshana</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join her workshops and discover the art of resin crafting through step-by-step video tutorials.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* Left Side - Tall Hero Image */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden roundedtransform hover:scale-[1.02] transition-transform duration-300">
                <img
                  src="loginimg.png"
                  alt="Affshana Teaching Workshop"
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Master Class</h3>
                  <p className="text-sm text-gray-200">Advanced Resin Techniques</p>
                </div>
              </div>
            </div>

            {/* Right Side - Uniform Video Grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-[600px] auto-rows-fr">
                {/* Video 1 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video1', true)}
                  onMouseLeave={() => handleVideoHover('video1', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=get_frnwjj&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Artstop Resin School - Episode 1"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      15:30
                    </div>
                  </div>
                </Card>

                {/* Video 2 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video2', true)}
                  onMouseLeave={() => handleVideoHover('video2', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=Art_Stop_Resin_School_Episode_2_The_mistake_that_cost_%EF%B8%8F_%EF%B8%8F_%EF%B8%8FSAVE_IT_%EF%B8%8F_%EF%B8%8F_%EF%B8%8F_What_I_did_j9u921&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Art Stop Resin School - Episode 2"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      8:45
                    </div>
                  </div>
                </Card>

                {/* Video 3 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video3', true)}
                  onMouseLeave={() => handleVideoHover('video3', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=Artstop_Resin_School_-_Episode_3_How_much_should_you_REALLY_charge_for_resin_art_Want_me_to_vvhnt7&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Artstop Resin School - Episode 3"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      12:20
                    </div>
                  </div>
                </Card>

                {/* Video 4 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video4', true)}
                  onMouseLeave={() => handleVideoHover('video4', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=This_isn_t_just_art_it_s_a_part_of_me._A_piece_of_my_dream_poured_in_layers._I_ve_always_belie_prymrg&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="This isn't just art—it's a part of me"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      22:15
                    </div>
                  </div>
                </Card>

                {/* Video 5 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video5', true)}
                  onMouseLeave={() => handleVideoHover('video5', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=SAVE_For_my_texture_paste_I_used_equal_parts_of_Asian_Paints_acrylic_wall_putty_and_Camel_A_pnrk0x&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Texture Paste Tutorial"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      18:30
                    </div>
                  </div>
                </Card>

                {/* Video 6 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video6', true)}
                  onMouseLeave={() => handleVideoHover('video6', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=AQMySvg5P-U68B8FjE6x8fpd1GyE4TZLW5dokdZmLggvC7zR-BWO2gr9Cu6Sw9AFMaBDb_4-ShgYCYTGqD3Xsvhq5_Ekmnk1_z5pgzv&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Resin Art Workshop Tutorial"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      9:45
                    </div>
                  </div>
                </Card>

                {/* Video 7 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video7', true)}
                  onMouseLeave={() => handleVideoHover('video7', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=Exciting_news_My_next_Resin_Art_Workshop_is_happening_in_Chennai_on_Mount_Road_%EF%B8%8F_Age-_1_ei6h9j&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Chennai Workshop Announcement"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      14:20
                    </div>
                  </div>
                </Card>

                {/* Video 8 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video8', true)}
                  onMouseLeave={() => handleVideoHover('video8', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=get_pesv5x&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="Resin Art Tutorial"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      16:45
                    </div>
                  </div>
                </Card>

                {/* Video 9 */}
                <Card
                  className="group bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer rounded-xl"
                  onMouseEnter={() => handleVideoHover('video9', true)}
                  onMouseLeave={() => handleVideoHover('video9', false)}
                >
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <iframe
                      src="https://player.cloudinary.com/embed/?cloud_name=dxjmjrjfx&public_id=Welcome_to_ArtStop_Resin_School_Episode_7_In_this_video_I_ll_show_you_the_entire_step-by-st_bal28i&profile=cld-default&autoplay=1&controls=false&muted=true&loop=true"
                      className="w-full h-full border-0 rounded-xl"
                      allow="autoplay; fullscreen; encrypted-media; web-share"
                      allowFullScreen
                      title="ArtStop Resin School - Episode 7"
                    ></iframe>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 py-0.5 rounded text-xs">
                      25:00
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quotes Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Quote className="h-16 w-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Words of Wisdom</h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Inspiring thoughts from Affshana that guide her creative journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quotes.map((quote, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-xl">
                <CardContent className="p-8 text-center">
                  <Quote className="h-8 w-8 mx-auto mb-4 text-purple-200" />
                  <p className="text-lg italic mb-6 leading-relaxed">"{quote.text}"</p>
                  <p className="text-purple-200 font-medium">— {quote.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

   
      
      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Create with Affshana?
          </h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Whether you want to learn resin art, commission a custom piece, or simply get inspired by her work, ArtStop is your creative destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/customize">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-medium rounded-full shadow-xl transform hover:scale-105 transition-all">
                Start Your Custom Project
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/collections">
              <Button variant="outline" className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-4 text-lg font-medium rounded-full">
                Explore Collections
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
