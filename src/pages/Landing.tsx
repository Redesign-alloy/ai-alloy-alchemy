import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Atom, Zap, DollarSign, Leaf, ArrowRight, Shield, BarChart3 } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Atom className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">AI Alloy Redesigner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl opacity-50" />
        
        {/* 3D Molecular Visualization */}
        <div className="absolute right-0 top-32 w-1/2 h-full pointer-events-none hidden lg:block">
          <div className="relative w-full h-full">
            {/* Orbital Rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-accent/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" style={{ transform: 'translate(-50%, -50%) rotateX(60deg)' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" style={{ transform: 'translate(-50%, -50%) rotateY(45deg)' }} />
            
            {/* Central Atom */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full animate-glow shadow-lg shadow-primary/50" />
            
            {/* Electron Particles */}
            <div className="absolute top-1/3 left-1/3 w-4 h-4 bg-accent rounded-full animate-float shadow-lg shadow-accent/50" style={{ animationDelay: '0s' }} />
            <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-primary rounded-full animate-float shadow-lg shadow-primary/50" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-1/3 left-1/2 w-5 h-5 bg-accent/80 rounded-full animate-float shadow-lg shadow-accent/50" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-primary/80 rounded-full animate-float shadow-lg shadow-primary/50" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
              <Shield className="w-4 h-4" />
              Enterprise-Grade Metallurgical AI
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Redesign Alloys with{" "}
              <span className="text-gradient">AI Precision</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Advanced metallurgical engineering powered by artificial intelligence. 
              Optimize compositions for performance, cost, and sustainability in minutes, not months.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="text-lg px-8 gap-2 group">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">500+ Alloy Optimizations</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">ISO 27001 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Transform Your Metallurgical Workflow
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI platform analyzes compositions and predicts optimal modifications 
              for your specific requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mechanical Optimization */}
            <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Mechanical Optimization
                </h3>
                <p className="text-muted-foreground mb-4">
                  Enhance tensile strength, yield strength, and hardness through AI-driven 
                  composition adjustments tailored to your specifications.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Up to 40% strength improvements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Fatigue resistance optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    Heat treatment recommendations
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Cost Engineering */}
            <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <DollarSign className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Cost Engineering
                </h3>
                <p className="text-muted-foreground mb-4">
                  Balance performance requirements with material costs. Our AI finds the 
                  optimal trade-off for your budget constraints.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Real-time element pricing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Cost-performance optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    Alternative element suggestions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Sustainability & ESG */}
            <Card className="group hover:shadow-elegant transition-all duration-300 border-border/50 bg-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-success/20 transition-colors">
                  <Leaf className="w-7 h-7 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Sustainability & ESG
                </h3>
                <p className="text-muted-foreground mb-4">
                  Meet environmental standards while maintaining performance. Track carbon 
                  footprint and sustainability scores.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" />
                    Carbon footprint analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" />
                    Recyclability scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-success rounded-full" />
                    ESG compliance reports
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-steel-dark to-steel-medium rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Optimize Your Alloys?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Join leading metallurgical engineers using AI to revolutionize their design process.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="text-lg px-8 bg-white text-steel-dark hover:bg-white/90">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Atom className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">AI Alloy Redesigner</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Alloy Redesigner. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
