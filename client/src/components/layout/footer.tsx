import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">TeachUs</h3>
            <p className="text-slate-300 mb-4">
              Learn anything, anywhere with expert instructors and personalized learning experiences.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Students</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/courses">
                  <span className="hover:text-white transition-colors cursor-pointer">Browse Courses</span>
                </Link>
              </li>
              <li>
                <Link href="/instructors">
                  <span className="hover:text-white transition-colors cursor-pointer">Find Instructors</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/student">
                  <span className="hover:text-white transition-colors cursor-pointer">Student Dashboard</span>
                </Link>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Learning Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Instructors</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Become an Instructor</a></li>
              <li>
                <Link href="/dashboard/instructor">
                  <span className="hover:text-white transition-colors cursor-pointer">Instructor Dashboard</span>
                </Link>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Teaching Resources</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-300">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2024 TeachUs. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
