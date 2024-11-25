import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8eef1] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#43b0f1] to-[#057dcd]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            {/* Logo Image */}
            <img src="path/to/your/logo.png" alt="Logo" className="mx-auto h-16 w-auto" />
            
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Transform Your Videos Into
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400">
                Searchable Text
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Powered by advanced AI technology to provide accurate transcriptions
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-[#1e3d58] rounded-full font-medium hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Free →
              </Link>
              <a
                href="#demo"
                className="px-8 py-4 bg-[#1e3d58]/20 text-white rounded-full font-medium border border-white/20 hover:bg-[#1e3d58]/30 transition-all backdrop-blur-sm"
              >
                Watch Demo
              </a>
            </div>
          </motion.div>
        </div>
      </div>
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 bg-white rounded-lg shadow">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: '🎯',
    title: 'High Accuracy',
    description: 'Get precise transcriptions powered by advanced AI technology.'
  },
  {
    icon: '⚡',
    title: 'Fast Processing',
    description: 'Quick turnaround times for all your video transcription needs.'
  },
  {
    icon: '🌍',
    title: 'Multiple Languages',
    description: 'Support for various languages and accents worldwide.'
  }
];

const steps = [
  {
    title: 'Upload Video',
    description: 'Simply drag and drop your video file or browse to upload.'
  },
  {
    title: 'AI Processing',
    description: 'Our advanced AI processes and transcribes your video.'
  },
  {
    title: 'Get Results',
    description: 'Download your accurate transcription in multiple formats.'
  }
];

const pricingPlans = [
  {
    name: 'Basic',
    price: '0',
    features: [
      '5 hours/month',
      'Basic transcription',
      'Standard support'
    ]
  },
  {
    name: 'Pro',
    price: '29',
    featured: true,
    features: [
      '50 hours/month',
      'Advanced transcription',
      'Priority support',
      'Custom vocabulary'
    ]
  },
  {
    name: 'Enterprise',
    price: '99',
    features: [
      'Unlimited hours',
      'Advanced transcription',
      'Priority support',
      'Custom vocabulary'
    ]
  }
];

export default Home;