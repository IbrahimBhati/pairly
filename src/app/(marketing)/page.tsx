import React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Repeat,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  BookOpen,
  Code,
  Palette,
  Languages,
  Music,
  Activity,
  Utensils,
  Brush,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { CATEGORIES_PREVIEW } from "@/lib/constants"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Sticky Header */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
          {/* Ambient Lavender & Purple Glow Blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[650px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#A78BFA]/25 to-[#4B3F72]/20 blur-[130px] dark:from-[#A78BFA]/15 dark:to-[#4B3F72]/30"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/3 -right-20 -z-10 h-96 w-96 rounded-full bg-[#A7F3D0]/20 blur-[120px] dark:bg-[#A7F3D0]/10"
          />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Headline & CTAs */}
              <div className="flex flex-col items-start text-left lg:col-span-7">
                {/* Pill Announcement */}
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/10">
                  <span className="flex h-2 w-2 rounded-full bg-[#A78BFA] animate-pulse" />
                  <span>University Major Project &bull; P2P Skill Exchange</span>
                  <ChevronRight className="h-3 w-3" />
                </div>

                {/* Main Headline */}
                <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.12]">
                  Share Skills. <br />
                  Help Others. <br />
                  <span className="gradient-brand-text">Grow Together.</span>
                </h1>

                {/* Subtitle */}
                <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
                  Pairly is a peer-to-peer skill exchange platform connecting students, teachers, professionals, and community members. Offer what you know, receive what you want to learn, and let our bilateral match engine calculate your compatibility.
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-12 px-6 rounded-xl bg-[#4B3F72] text-white hover:bg-[#3d335d] dark:bg-[#A78BFA] dark:text-[#0F0B1A] dark:hover:bg-[#906ef8] font-semibold text-sm shadow-md shadow-[#4B3F72]/20 gap-2 transition-all"
                    >
                      <span>Find Your Skill Match</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href="#how-it-works">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-6 rounded-xl border-border bg-card/60 hover:bg-accent font-medium text-sm text-foreground transition-all"
                    >
                      How It Works
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-10 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0]" />
                    <span>100% Free Peer Exchange</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0]" />
                    <span>Mutual Bilateral Matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-[#A7F3D0]" />
                    <span>Safe & Verified Profiles</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Mock Smart Match Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto w-full max-w-md">
                  {/* Subtle decorative backdrop glow */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#4B3F72] to-[#A78BFA] opacity-30 blur-xl dark:opacity-40" />

                  {/* Main Mock Match Card */}
                  <Card className="relative rounded-2xl border border-border bg-card/95 p-6 shadow-xl backdrop-blur-md transition-all hover:shadow-2xl">
                    {/* Header bar of the card */}
                    <div className="flex items-center justify-between border-b border-border/80 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Smart Bilateral Match
                          </p>
                          <p className="text-[11px] text-muted-foreground">High reciprocity potential</p>
                        </div>
                      </div>
                      <Badge className="bg-[#A7F3D0] text-[#064E3B] hover:bg-[#86efac] font-bold text-xs px-2.5 py-1 shadow-xs border-0">
                        92% Match
                      </Badge>
                    </div>

                    {/* Bilateral Exchange Visualizer */}
                    <div className="mt-5 space-y-4">
                      {/* You (Person A) */}
                      <div className="rounded-xl border border-border/70 bg-accent/40 p-3.5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              You
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">You (Alex M.)</p>
                              <p className="text-[10px] text-muted-foreground">CS Student &bull; 3rd Year</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium text-muted-foreground">Profile #1</span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-card p-2 border border-border/60">
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">
                              You Offer
                            </span>
                            <span className="font-semibold text-foreground">Web Design</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">Figma, UI/UX</span>
                          </div>
                          <div className="rounded-lg bg-card p-2 border border-border/60">
                            <span className="text-[10px] font-semibold text-purple-600 dark:text-[#A78BFA] block uppercase">
                              You Want
                            </span>
                            <span className="font-semibold text-foreground">Spanish</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">Conversation</span>
                          </div>
                        </div>
                      </div>

                      {/* Reciprocal Flow Connector */}
                      <div className="flex items-center justify-center gap-3 py-1">
                        <div className="h-px flex-1 bg-border" />
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A78BFA]/20 text-primary shadow-xs">
                          <Repeat className="h-3.5 w-3.5 text-primary rotate-90" />
                        </div>
                        <span className="text-[11px] font-semibold text-muted-foreground">Mutual Pair</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      {/* Match (Person B) */}
                      <div className="rounded-xl border border-border/70 bg-accent/40 p-3.5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A78BFA] text-[#0F0B1A] text-xs font-bold">
                              SR
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">Sofia R.</p>
                              <p className="text-[10px] text-muted-foreground">Native Speaker &bull; Madrid</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-emerald-600 border-emerald-300">
                            Verified
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-card p-2 border border-border/60">
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">
                              Sofia Offers
                            </span>
                            <span className="font-semibold text-foreground">Spanish</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">Native speaker</span>
                          </div>
                          <div className="rounded-lg bg-card p-2 border border-border/60">
                            <span className="text-[10px] font-semibold text-purple-600 dark:text-[#A78BFA] block uppercase">
                              Sofia Wants
                            </span>
                            <span className="font-semibold text-foreground">Web Design</span>
                            <span className="block text-[10px] text-muted-foreground mt-0.5">Portfolio site</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA on Match Card */}
                    <div className="mt-5 pt-3 border-t border-border">
                      <Link href="/signup">
                        <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs gap-2">
                          <span>Request Peer Exchange</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 bg-card/40 border-y border-border/60 transition-colors">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <Badge className="bg-primary/10 text-primary border-primary/20">The Flow</Badge>
              <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                How Pairly Works
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Three simple steps to unlock high-impact collaborative learning with trusted peers.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="card-soft relative flex flex-col justify-between p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-3xl font-extrabold text-primary/40">01</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4B3F72]/10 text-primary dark:bg-[#A78BFA]/20 dark:text-[#A78BFA]">
                      <BookOpen className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold text-foreground">
                    Create Your Profile
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Set up your account in seconds. Select your user track (Student, Teacher, Professional, or Community) and build your skill matrix by selecting what you offer and what you seek.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 text-xs font-medium text-primary">
                  10 categories &bull; 100+ skills
                </div>
              </div>

              {/* Step 2 */}
              <div className="card-soft relative flex flex-col justify-between p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-3xl font-extrabold text-secondary/60">02</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A78BFA]/20 text-secondary dark:bg-[#A78BFA]/30 dark:text-[#A78BFA]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold text-foreground">
                    Get Matched
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Our smart algorithm analyzes reciprocal offerings. When Person A offers X and wants Y, while Person B offers Y and wants X, Pairly generates a high compatibility match score.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 text-xs font-medium text-emerald-600 dark:text-[#A7F3D0]">
                  Smart Bilateral Algorithm
                </div>
              </div>

              {/* Step 3 */}
              <div className="card-soft relative flex flex-col justify-between p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-3xl font-extrabold text-emerald-600/50">03</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A7F3D0]/30 text-[#064E3B] dark:bg-[#A7F3D0]/20 dark:text-[#A7F3D0]">
                      <Repeat className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold text-foreground">
                    Exchange and Grow
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    Message your match, set goals, and schedule interactive sessions. Exchange peer feedback, verify newly acquired competencies, and expand your network.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 text-xs font-medium text-muted-foreground">
                  Zero monetary cost &bull; 100% learning
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AUDIENCES / COMMUNITY TRACKS */}
        <section id="community" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <Badge className="bg-[#A78BFA]/20 text-primary dark:text-[#A78BFA] border-0 font-semibold">
                Peer Tracks
              </Badge>
              <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Tailored for Every Learner
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                Pairly breaks down barriers by creating specialized exchange spaces for every stage of your growth.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Audience 1: Students */}
              <Card className="card-soft p-6 flex flex-col justify-between hover:border-primary/40">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                    Student-to-Student
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Trade calculus help for Python coding, share exam study frameworks, or collaborate on term projects with university peers.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Calculus</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Python</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Chemistry</span>
                  </div>
                </div>
              </Card>

              {/* Audience 2: Teachers */}
              <Card className="card-soft p-6 flex flex-col justify-between hover:border-primary/40">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                    Teacher-to-Teacher
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Educators collaborate on modern pedagogy, educational tech tools, syllabus architecture, and cross-discipline teaching methods.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Curriculum</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">EdTech</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Pedagogy</span>
                  </div>
                </div>
              </Card>

              {/* Audience 3: Professionals */}
              <Card className="card-soft p-6 flex flex-col justify-between hover:border-primary/40">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                    Professional-to-Professional
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Exchange real-world industry know-how: trade UI design critiques for backend engineering, mock interviews, or resume strategies.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Figma</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Cloud/DevOps</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Interviews</span>
                  </div>
                </div>
              </Card>

              {/* Audience 4: Community Help */}
              <Card className="card-soft p-6 flex flex-col justify-between hover:border-primary/40">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-foreground">
                    Community Help
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Trade conversational language skills for guitar basics, cooking techniques, sewing, or neighborhood digital literacy support.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Languages</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Acoustic Guitar</span>
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-medium text-foreground">Baking</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* SKILLS CATALOG PREVIEW */}
        <section id="features" className="py-20 bg-card/30 border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <Badge className="bg-primary/10 text-primary border-primary/20">Seeded Catalog</Badge>
                <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground">
                  Explore 10 Diverse Skill Domains
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  From software engineering to culinary arts, Pairly's seeded database gives every peer an instant catalog of skills to trade.
                </p>
              </div>
              <Link href="/signup">
                <Button variant="outline" className="gap-2">
                  <span>Browse Full Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {CATEGORIES_PREVIEW.map((cat) => (
                <div
                  key={cat.slug}
                  className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {cat.slug === "programming" && <Code className="h-5 w-5" />}
                    {cat.slug === "design" && <Palette className="h-5 w-5" />}
                    {cat.slug === "languages" && <Languages className="h-5 w-5" />}
                    {cat.slug === "music" && <Music className="h-5 w-5" />}
                    {cat.slug === "academics-and-tutoring" && <GraduationCap className="h-5 w-5" />}
                    {cat.slug === "business-and-career" && <Briefcase className="h-5 w-5" />}
                    {cat.slug === "fitness-and-wellness" && <Activity className="h-5 w-5" />}
                    {cat.slug === "cooking" && <Utensils className="h-5 w-5" />}
                    {cat.slug === "arts-and-crafts" && <Brush className="h-5 w-5" />}
                    {cat.slug === "community-help" && <HeartHandshake className="h-5 w-5" />}
                  </div>
                  <h4 className="mt-3 font-semibold text-sm text-foreground">{cat.name}</h4>
                  <span className="text-[11px] text-muted-foreground">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA BAND */}
        <section className="relative overflow-hidden py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="gradient-brand relative rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden">
              {/* Decorative background radial pattern */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-white/10 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-0 -mb-12 -ml-12 h-80 w-80 rounded-full bg-[#A7F3D0]/20 blur-2xl"
              />

              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-[#A7F3D0]" />
                  Join the Peer Learning Movement
                </span>
                <h2 className="mt-4 font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Ready to share what you know and learn what you need?
                </h2>
                <p className="mt-4 text-sm sm:text-base text-purple-100 max-w-xl leading-relaxed">
                  Join hundreds of students, teachers, and professionals already leveling up their skills through bilateral exchange on Pairly.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-12 px-7 rounded-xl bg-white text-[#4B3F72] hover:bg-slate-100 font-bold text-sm shadow-lg gap-2"
                    >
                      <span>Create Free Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-6 rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20 font-medium text-sm backdrop-blur-xs"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
