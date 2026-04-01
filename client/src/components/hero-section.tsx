import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary to-blue-800 text-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Learn Anything,<br />
              <span className="text-blue-200">Anywhere</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Connect with expert instructors for online and offline classes. Master new skills at your own pace with personalized learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-blue-50 text-lg px-8 py-4"
              >
                Start Learning Today
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              >
                Become an Instructor
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Students learning together" 
              className="rounded-xl shadow-2xl w-full h-auto object-cover" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}