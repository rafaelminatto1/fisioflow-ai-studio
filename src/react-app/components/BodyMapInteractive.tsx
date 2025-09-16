import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface BodyMapInteractiveProps {
  selectedParts: string[]
  onSelectionChange: (parts: string[]) => void
  className?: string
  disabled?: boolean
}

const bodyParts: Record<string, { name: string; x: number; y: number; width: number; height: number }> = {
  // Head and Neck
  head: { name: 'Cabeça', x: 50, y: 8, width: 8, height: 10 },
  neck: { name: 'Pescoço', x: 50, y: 18, width: 4, height: 6 },
  
  // Upper Body
  leftShoulder: { name: 'Ombro Esquerdo', x: 35, y: 24, width: 8, height: 6 },
  rightShoulder: { name: 'Ombro Direito', x: 57, y: 24, width: 8, height: 6 },
  leftArm: { name: 'Braço Esquerdo', x: 28, y: 30, width: 6, height: 15 },
  rightArm: { name: 'Braço Direito', x: 66, y: 30, width: 6, height: 15 },
  leftForearm: { name: 'Antebraço Esquerdo', x: 25, y: 45, width: 5, height: 12 },
  rightForearm: { name: 'Antebraço Direito', x: 70, y: 45, width: 5, height: 12 },
  leftHand: { name: 'Mão Esquerda', x: 22, y: 57, width: 4, height: 6 },
  rightHand: { name: 'Mão Direita', x: 74, y: 57, width: 4, height: 6 },
  
  // Torso
  chest: { name: 'Tórax', x: 42, y: 24, width: 16, height: 12 },
  upperBack: { name: 'Costas Superior', x: 42, y: 24, width: 16, height: 12 },
  abdomen: { name: 'Abdômen', x: 44, y: 36, width: 12, height: 10 },
  lowerBack: { name: 'Lombar', x: 44, y: 36, width: 12, height: 10 },
  
  // Lower Body
  pelvis: { name: 'Pelve', x: 45, y: 46, width: 10, height: 8 },
  leftHip: { name: 'Quadril Esquerdo', x: 40, y: 54, width: 6, height: 8 },
  rightHip: { name: 'Quadril Direito', x: 54, y: 54, width: 6, height: 8 },
  leftThigh: { name: 'Coxa Esquerda', x: 38, y: 62, width: 8, height: 18 },
  rightThigh: { name: 'Coxa Direita', x: 54, y: 62, width: 8, height: 18 },
  leftKnee: { name: 'Joelho Esquerdo', x: 40, y: 80, width: 6, height: 6 },
  rightKnee: { name: 'Joelho Direito', x: 54, y: 80, width: 6, height: 6 },
  leftCalf: { name: 'Panturrilha Esquerda', x: 39, y: 86, width: 7, height: 15 },
  rightCalf: { name: 'Panturrilha Direita', x: 54, y: 86, width: 7, height: 15 },
  leftFoot: { name: 'Pé Esquerdo', x: 38, y: 101, width: 8, height: 6 },
  rightFoot: { name: 'Pé Direito', x: 54, y: 101, width: 8, height: 6 },
}

export function BodyMapInteractive({ 
  selectedParts, 
  onSelectionChange, 
  className = '', 
  disabled = false 
}: BodyMapInteractiveProps) {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null)

  const handlePartClick = useCallback((partKey: string) => {
    if (disabled) return
    
    const isSelected = selectedParts.includes(partKey)
    const newSelection = isSelected
      ? selectedParts.filter(p => p !== partKey)
      : [...selectedParts, partKey]
    
    onSelectionChange(newSelection)
  }, [selectedParts, onSelectionChange, disabled])

  const getPartColor = (partKey: string) => {
    if (selectedParts.includes(partKey)) {
      return '#3b82f6' // Blue for selected
    }
    if (hoveredPart === partKey) {
      return '#60a5fa' // Light blue for hovered
    }
    return '#e2e8f0' // Light gray for default
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100 110"
        className="w-full h-full"
        style={{ maxHeight: '500px' }}
      >
        {/* Body outline */}
        <path
          d="M50 8 C46 8 42 10 42 14 L42 24 C38 24 34 26 34 30 L32 32 L28 32 L28 46 L25 46 L25 58 L30 58 L30 48 L35 48 L38 62 L38 82 L40 82 L40 88 L39 88 L39 102 L46 102 L46 88 L44 88 L44 82 L46 82 L46 62 L50 54 L54 62 L54 82 L56 82 L56 88 L54 88 L54 102 L61 102 L61 88 L60 88 L60 82 L62 82 L62 62 L65 48 L70 48 L70 58 L75 58 L75 46 L72 46 L72 32 L68 32 L66 30 C66 26 62 24 58 24 L58 14 C58 10 54 8 50 8 Z"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* Interactive body parts */}
        {Object.entries(bodyParts).map(([key, part]) => (
          <motion.ellipse
            key={key}
            cx={part.x}
            cy={part.y}
            rx={part.width / 2}
            ry={part.height / 2}
            fill={getPartColor(key)}
            stroke={selectedParts.includes(key) ? '#1d4ed8' : '#94a3b8'}
            strokeWidth={selectedParts.includes(key) ? '0.8' : '0.3'}
            className={`cursor-pointer transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            onClick={() => handlePartClick(key)}
            onMouseEnter={() => !disabled && setHoveredPart(key)}
            onMouseLeave={() => setHoveredPart(null)}
            whileHover={disabled ? {} : { scale: 1.1 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
          />
        ))}

        {/* Tooltip for hovered part */}
        {hoveredPart && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <rect
              x={bodyParts[hoveredPart].x - 8}
              y={bodyParts[hoveredPart].y - 12}
              width={bodyParts[hoveredPart].name.length * 0.8 + 4}
              height="4"
              fill="rgba(0, 0, 0, 0.8)"
              rx="1"
            />
            <text
              x={bodyParts[hoveredPart].x}
              y={bodyParts[hoveredPart].y - 9}
              textAnchor="middle"
              fill="white"
              fontSize="2"
              fontWeight="500"
            >
              {bodyParts[hoveredPart].name}
            </text>
          </motion.g>
        )}
      </svg>

      {/* Selected parts list */}
      {selectedParts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
        >
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Regiões Selecionadas:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedParts.map(partKey => (
              <motion.span
                key={partKey}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                {bodyParts[partKey as keyof typeof bodyParts].name}
                {!disabled && (
                  <button
                    onClick={() => handlePartClick(partKey)}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                )}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <p className="text-xs text-slate-500 mt-2 text-center">
        {disabled ? 'Visualização apenas' : 'Clique nas regiões do corpo para selecioná-las'}
      </p>
    </div>
  )
}
