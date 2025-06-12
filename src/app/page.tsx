import UserQuestionForm from '@/components/UserQuestionForm';
import UserHeader from '@/components/UserHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <UserHeader />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <UserQuestionForm />
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground/80">
        © {new Date().getFullYear()} AstroConnect. All rights reserved.
      </footer>
    </div>
  );
}
