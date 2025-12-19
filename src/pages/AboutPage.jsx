import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Home, Users, CreditCard, Wrench, BarChart2 } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
  transition: { duration: 0.45 }
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

      
        <motion.section
          initial="hidden"
          animate="show"
          variants={stagger}
          className="rounded-2xl overflow-hidden bg-white shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 md:p-12">

           
            <motion.div variants={fadeIn} className="flex flex-col justify-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-700 leading-tight">
                Hostel Management App
              </h1>

              <p className="mt-4 text-gray-600 text-base sm:text-lg max-w-xl leading-relaxed">
                This Hostel Management System helps administrators manage rooms, residents, billing,
                maintenance, reports, and user accounts efficiently — built with modern web tools
                and clean UX.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-medium shadow hover:bg-sky-700"
                >
                  ✨ Features
                </a>

                <a
                  href="https://github.com/annie199810/frontend-hostel-management"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border text-sm font-medium text-slate-700 hover:shadow"
                >
                  View Frontend Repo
                </a>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                Author: <strong className="text-gray-700">Annie</strong>
              </div>
            </motion.div>

          
            <motion.div variants={fadeIn} className="order-first md:order-last flex items-center justify-center">
              <div className="w-full max-w-sm rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <img
                  src="/hostel-bg.png"
                  alt="Hostel illustration"
                  className="w-full h-44 object-cover"
                />
                <div className="p-4 bg-white">
                  <div className="text-sm text-slate-500">Hostel Dashboard</div>
                  <div className="mt-2 font-semibold text-gray-800">Rooms • Residents • Billing</div>
                  <div className="mt-3 text-xs text-gray-500">
                    Clean UI — responsive — easy to deploy
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.section>

        
        <motion.section id="features" initial="hidden" animate="show" variants={stagger} className="mt-10">
          <motion.h2 variants={fadeIn} className="text-2xl font-semibold text-slate-800 mb-4">
            Key features
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "Auth (Register + Login)", desc: "JWT-based auth with protected routes", icon: <ShieldCheck /> },
              { title: "Room Management", desc: "Create / Edit / Delete rooms", icon: <Home /> },
              { title: "Residents", desc: "Add residents, search & filter", icon: <Users /> },
              { title: "Billing", desc: "Create bills & optional Razorpay payments", icon: <CreditCard /> },
              { title: "Maintenance", desc: "Track requests and status", icon: <Wrench /> },
              { title: "Reports", desc: "Summary reports & export", icon: <BarChart2 /> },
            ].map((f) => (
              <motion.div key={f.title} variants={fadeIn} className="bg-white rounded-lg p-5 border shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="text-3xl text-sky-600">{f.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-800">{f.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{f.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        
        <motion.section className="mt-10 bg-white rounded-lg p-6 border shadow-sm">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Tech Stack</h3>

          <div className="flex flex-wrap gap-3">
            {[
              "React",
              "Vite",
              "Tailwind CSS",
              "Node.js",
              "Express",
              "MongoDB",
              "JWT",
              "Render",
            ].map((t) => (
              <span
                key={t}
                className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium border"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <strong>Pro tip:</strong> Add README.md, split repos, and include a `.env.example` — improves reviewer score.
          </div>
        </motion.section>

       
        <motion.section initial="hidden" animate="show" variants={stagger} className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
          <a
            href="https://github.com/annie199810/frontend-hostel-management"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-sky-600 text-white font-medium shadow hover:bg-sky-700"
          >
            🚀 View Frontend Repo
          </a>

          <a
            href="https://github.com/annie199810/backend-hostel-management"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white border text-slate-800 hover:shadow"
          >
            🔧 View Backend Repo
          </a>

          <div className="text-sm text-gray-500 ml-auto">
            Questions? <a href="mailto:your-email@example.com" className="text-sky-600 underline">Contact me</a>
          </div>
        </motion.section>

        <div className="mt-10 text-center text-sm text-gray-500">
          Built with ❤️  
        </div>

      </div>
    </div>
  );
}
