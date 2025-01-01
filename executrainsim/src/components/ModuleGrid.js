import React from 'react';  
  
const ModuleCard = ({ title, description, index, onClick }) => {  
  const getGradient = (index) => {  
    const gradients = [  
      'from-blue-500 to-purple-600',  
      'from-emerald-500 to-teal-600',  
      'from-orange-500 to-amber-600',  
      'from-pink-500 to-rose-600',  
      'from-indigo-500 to-blue-600',  
      'from-teal-500 to-cyan-600',  
      'from-red-500 to-orange-600',  
      'from-purple-500 to-indigo-600',  
      'from-green-500 to-emerald-600',  
      'from-amber-500 to-yellow-600'  
    ];  
    return gradients[index % gradients.length];  
  };  
  
  return (  
    <div className="p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 transition-all duration-300">  
      <div  
        onClick={onClick}  
        className={`relative h-64 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-gradient-to-br ${getGradient(index)}`}  
      >  
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),rgba(255,255,255,0))]" />  
        <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent">  
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>  
          <p className="text-white/90 text-sm line-clamp-3">{description}</p>  
        </div>  
        <div className="absolute inset-0 bg-black/0 transition-all duration-300 hover:bg-black/10" />  
      </div>  
    </div>  
  );  
};  
  
const ModuleGrid = ({ modules, onModuleClick }) => {  
  return (  
    <div className="max-w-7xl mx-auto px-4 py-8">  
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-12 uppercase tracking-wide">  
        Simulation Library  
      </h1>  
      <div className="flex flex-wrap -mx-4">  
        {modules.map((module, index) => (  
          <ModuleCard  
            key={index}  
            title={module.title}  
            description={module.description}  
            index={index}  
            onClick={() => onModuleClick(module)}  
          />  
        ))}  
      </div>  
    </div>  
  );  
};  
  
export default ModuleGrid;  