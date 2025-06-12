"use client";
import { Sparkles } from 'lucide-react'; 

const AppLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center space-x-2 text-primary ${className}`}>
      <Sparkles className="h-8 w-8 text-accent" />
      <span className="font-headline text-2xl font-bold">AstroConnect</span>
    </div>
  );
};

export default AppLogo;
