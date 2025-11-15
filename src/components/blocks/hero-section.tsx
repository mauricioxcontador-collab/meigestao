import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HeroSectionProps {
  badge?: {
    text: string;
    action?: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions?: Array<{
    text: string;
    href: string;
    variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive" | "glow";
    icon?: React.ReactNode;
  }>;
  image?: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroSectionProps) {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center space-y-8">
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="px-4 py-2">
                {badge.text}
                {badge.action && (
                  <>
                    <span className="mx-2">·</span>
                    <Link
                      to={badge.action.href}
                      className="text-primary hover:underline"
                    >
                      {badge.action.text}
                    </Link>
                  </>
                )}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight max-w-4xl"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl"
          >
            {description}
          </motion.p>

          {actions && actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center pt-4"
            >
              {actions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Button
                    size="lg"
                    variant={action.variant === "glow" ? "default" : action.variant}
                    className={cn(
                      "text-lg px-8",
                      action.variant === "glow" && "gradient-primary shadow-glow"
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.text}
                  </Button>
                </Link>
              ))}
            </motion.div>
          )}

          {image && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="w-full max-w-5xl mt-12"
            >
              <img
                src={image.light}
                alt={image.alt}
                className="w-full h-auto rounded-xl shadow-2xl border border-border dark:hidden"
              />
              <img
                src={image.dark}
                alt={image.alt}
                className="w-full h-auto rounded-xl shadow-2xl border border-border hidden dark:block"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
