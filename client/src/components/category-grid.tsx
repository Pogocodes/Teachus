import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { useLocation } from "wouter";

export default function CategoryGrid() {
  const [, setLocation] = useLocation();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleCategoryClick = (categoryId: number) => {
    setLocation(`/courses?category=${categoryId}`);
  };

  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const gradientColors = [
              "from-primary to-blue-600",
              "from-secondary to-green-600",
              "from-accent to-yellow-600",
              "from-purple-500 to-purple-700",
              "from-pink-500 to-pink-700",
              "from-indigo-500 to-indigo-700",
            ];
            
            return (
              <div 
                key={category.id}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <i className={`${category.icon} text-white text-2xl`}></i>
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{category.name}</h3>
                <p className="text-sm text-slate-600">{category.courseCount || 0} courses</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}