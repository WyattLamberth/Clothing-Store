import newShoes from '../images/new_shoes.jpg';
import newHoodies from '../images/new_hoodies.jpg';

const TrendingSection = () => (
  <section className="container mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-center mb-8">Trending</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="relative">
        <img src={newShoes} alt="Upcoming Styles" className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold">Unlock Your Motion</h3>
          <p className="mb-2"> New Shoes Styles </p>
        </div>
      </div>
      <div className="relative">
        <img src={newHoodies} alt="Upcoming Style" className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold">For a Subtle Flex</h3>
          <p className="mb-2">Upcoming Hoodies Style</p>
        </div>
      </div>
    </div>
  </section>
);

export default TrendingSection;