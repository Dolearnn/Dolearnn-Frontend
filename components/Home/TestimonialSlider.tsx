"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    text: "The pairing team understood Zara better than any platform I've tried. Her Maths teacher is patient, consistent, and she actually looks forward to sessions. After three months, her grades jumped a full letter.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Amara Okafor",
    role: "Parent · London",
  },
  {
    id: 2,
    text: "I didn't have to search through 100 profiles. I filled a form, they matched me with an SAT tutor the next day, and I went from 1180 to 1420 in ten weeks.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Kayin Okafor",
    role: "Student · College Year 1",
  },
  {
    id: 3,
    text: "Session feedback after every class means I always know what my daughter is working on. The monthly report is a game-changer — I can see progress, not just hope for it.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Ngozi Adeyemi",
    role: "Parent · Toronto",
  },
];

export default function TestimonialSlider() {
  const [[index, direction], setIndex] = useState([0, 0]);

  const paginate = (newDirection: number) => {
    setIndex(([prev]) => {
      const nextIndex =
        prev + newDirection < 0
          ? testimonials.length - 1
          : (prev + newDirection) % testimonials.length;
      return [nextIndex, newDirection];
    });
  };

  const current = testimonials[index];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      rotate: direction > 0 ? -8 : 8,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: 3,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -200 : 200,
      opacity: 0,
      rotate: direction > 0 ? 8 : -8,
    }),
  };

  return (
    <div className="relative flex items-center justify-center py-16">
      <button
        onClick={() => paginate(-1)}
        aria-label="Previous testimonial"
        className="hidden md:flex absolute left-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center text-brand hover:bg-accent2-50 transition z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-md">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4 }}
            className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100"
          >
            <p className="text-sm text-gray-700 leading-relaxed">
              &ldquo;{current.text}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.avatar}
                alt={current.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {current.name}
                </p>
                <p className="text-xs text-gray-500">{current.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={() => paginate(1)}
        aria-label="Next testimonial"
        className="hidden md:flex absolute right-0 w-10 h-10 rounded-full bg-white shadow items-center justify-center text-brand hover:bg-accent2-50 transition z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 md:hidden">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex([i, i > index ? 1 : -1])}
            aria-label={`Go to testimonial ${i + 1}`}
            className={`w-2 h-2 rounded-full transition ${
              i === index ? "bg-brand w-6" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
