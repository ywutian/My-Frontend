import React from 'react';
import { motion } from 'framer-motion';
export default function LiveNotes({ content }) {
  return (
    <div className="h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full overflow-y-auto p-4"
      >
        <div className="space-y-4">
          {content && content.split('\n').map((line, index) => (
            <div 
              key={index}
              className="p-4 rounded-lg border border-gray-200 bg-gray-50"
            >
              {line}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
} 