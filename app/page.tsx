"use client";

import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  Download,
  ArrowRight,
  ClipboardList,
  BookOpen,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description:
        "Fetch data from external sources using intelligent keyword matching",
      color: "primary",
    },
    {
      icon: Sparkles,
      title: "AI Analysis",
      description: "LLM-powered insights with trend detection and summaries",
      color: "secondary",
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Download reports as HTML or PDF with one click",
      color: "accent",
    },
  ];

  const steps = [
    {
      step: "1",
      title: "Select Pipeline",
      description:
        "Choose from patent analysis, medical literature, or staffing reports",
    },
    {
      step: "2",
      title: "Enter Keywords",
      description:
        "Provide search terms, date ranges, and filters for your analysis",
    },
    {
      step: "3",
      title: "Get Your Report",
      description:
        "AI generates comprehensive analysis with insights and visualizations",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-6xl text-center"
        >
          {/* Hero Section */}
          <div className="mb-16">
            <motion.div
              variants={item}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Analytics</span>
            </motion.div>

            <motion.h1
              variants={item}
              className="mb-6 text-5xl font-bold sm:text-6xl lg:text-7xl leading-tight"
            >
              {/* Subtle gradient only on key phrase */}
              <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Generate Intelligent
              </span>
              <br />
              <span className="text-foreground">Reports</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            >
              Transform your data into comprehensive analysis reports using
              advanced language models. Simply provide keywords and filters.
            </motion.p>

            {/* CTA Buttons - Gradient only on primary */}
            <motion.div
              variants={item}
              className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/generate" className="group">
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Report</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-colors"
              >
                <Link href="/jobs">
                  <ClipboardList className="h-5 w-5" />
                  <span>My Jobs</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto hover:bg-accent/10 hover:text-accent hover:border-accent/50 transition-colors"
              >
                <Link href="/reports">
                  <BookOpen className="h-5 w-5" />
                  <span>View Reports</span>
                </Link>
              </Button>
            </motion.div>

            {/* Features Grid - Clean Cards with subtle gradient icons */}
            <motion.div
              variants={container}
              className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isPrimary = index === 0;
                const isSecondary = index === 1;
                const isAccent = index === 2;

                return (
                  <motion.div
                    key={index}
                    variants={item}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.2, ease: "easeOut" },
                    }}
                    className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="relative">
                      <div
                        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${
                          isPrimary
                            ? "bg-gradient-to-br from-primary to-primary/80"
                            : isSecondary
                            ? "bg-gradient-to-br from-secondary to-secondary/80"
                            : "bg-gradient-to-br from-accent to-accent/80"
                        } shadow-sm`}
                      >
                        <Icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* How It Works Section */}
            <motion.div
              variants={item}
              className="rounded-2xl border bg-card/50 backdrop-blur-sm p-10 md:p-12 shadow-sm"
            >
              <h3 className="mb-3 text-3xl font-bold text-foreground">
                How It Works
              </h3>
              <p className="mb-10 text-muted-foreground">
                Get started in three simple steps
              </p>

              <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
                {steps.map((step) => (
                  <motion.div
                    key={step.step}
                    whileHover={{
                      y: -4,
                      transition: { duration: 0.2, ease: "easeOut" },
                    }}
                    className="relative"
                  >
                    {/* Subtle gradient on step numbers */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-primary-foreground shadow-sm">
                      {step.step}
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-foreground">
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
