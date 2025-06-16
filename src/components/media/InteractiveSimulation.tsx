'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  CheckCircle,
  Award,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

interface InteractiveSimulationProps {
  simulation: {
    id: string;
    title: string;
    description: string;
    type: 'concrete-slump' | 'beam-loading' | 'water-flow' | 'soil-compaction';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    points: number;
    parameters: {
      name: string;
      min: number;
      max: number;
      default: number;
      unit: string;
      description: string;
    }[];
    learningObjectives: string[];
  };
  onComplete: (simulationId: string, interactions: number, timeSpent: number, points: number) => void;
  isCompleted?: boolean;
}

export function InteractiveSimulation({ 
  simulation, 
  onComplete, 
  isCompleted = false 
}: InteractiveSimulationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);
  const [interactions, setInteractions] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Initialize parameters with default values
    const initialParams: Record<string, number> = {};
    simulation.parameters.forEach(param => {
      initialParams[param.name] = param.default;
    });
    setParameters(initialParams);
  }, [simulation.parameters]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasStarted) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStarted]);

  const handleParameterChange = (paramName: string, value: number[]) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value[0]
    }));
    setInteractions(prev => prev + 1);
    if (!hasStarted) {
      setHasStarted(true);
    }
  };

  const runSimulation = () => {
    setIsRunning(true);
    setInteractions(prev => prev + 1);
    
    // Simulate processing time
    setTimeout(() => {
      const simulationResults = calculateResults();
      setResults(simulationResults);
      setIsRunning(false);
      
      // Check if simulation goals are met for completion
      if (simulationResults.success && !isCompleted) {
        onComplete(simulation.id, interactions, timeSpent, simulation.points);
      }
    }, 2000);
  };

  const resetSimulation = () => {
    const initialParams: Record<string, number> = {};
    simulation.parameters.forEach(param => {
      initialParams[param.name] = param.default;
    });
    setParameters(initialParams);
    setResults(null);
    setInteractions(prev => prev + 1);
  };

  const calculateResults = () => {
    // Mock calculation based on simulation type
    switch (simulation.type) {
      case 'concrete-slump':
        return calculateConcreteSlump();
      case 'beam-loading':
        return calculateBeamLoading();
      case 'water-flow':
        return calculateWaterFlow();
      case 'soil-compaction':
        return calculateSoilCompaction();
      default:
        return { value: 0, unit: '', status: 'neutral', message: 'Unknown simulation type' };
    }
  };

  const calculateConcreteSlump = () => {
    const waterCement = parameters['Water-Cement Ratio'] || 0.5;
    const aggregateSize = parameters['Aggregate Size'] || 20;
    const temperature = parameters['Temperature'] || 20;
    
    // Simplified slump calculation
    let slump = (waterCement - 0.3) * 200 + (30 - aggregateSize) * 2 + (temperature - 20) * 0.5;
    slump = Math.max(0, Math.min(200, slump));
    
    let status = 'neutral';
    let message = 'Normal workability';
    let success = false;
    
    if (slump < 25) {
      status = 'error';
      message = 'Very low workability - difficult to place';
    } else if (slump > 150) {
      status = 'warning';
      message = 'Very high workability - may segregate';
    } else if (slump >= 75 && slump <= 100) {
      status = 'success';
      message = 'Optimal workability for normal construction';
      success = true;
    }
    
    return { value: Math.round(slump), unit: 'mm', status, message, success };
  };

  const calculateBeamLoading = () => {
    const load = parameters['Applied Load'] || 10;
    const beamLength = parameters['Beam Length'] || 3;
    const momentOfInertia = parameters['Moment of Inertia'] || 100;
    
    // Simplified deflection calculation (center of simply supported beam)
    const deflection = (5 * load * Math.pow(beamLength * 1000, 4)) / (384 * 200000 * momentOfInertia * 1000000);
    const allowableDeflection = (beamLength * 1000) / 250; // L/250 limit
    
    let status = 'neutral';
    let message = 'Within acceptable limits';
    let success = false;
    
    if (deflection > allowableDeflection) {
      status = 'error';
      message = 'Deflection exceeds allowable limit (L/250)';
    } else if (deflection < allowableDeflection * 0.8) {
      status = 'success';
      message = 'Excellent - well within deflection limits';
      success = true;
    }
    
    return { value: deflection.toFixed(2), unit: 'mm', status, message, success };
  };

  const calculateWaterFlow = () => {
    const diameter = parameters['Pipe Diameter'] || 300;
    const slope = parameters['Slope'] || 0.001;
    const roughness = parameters['Roughness Coefficient'] || 0.013;
    
    // Manning's equation for flow rate
    const area = Math.PI * Math.pow(diameter / 2000, 2); // Convert mm to m
    const hydraulicRadius = diameter / 4000; // For circular pipe
    const velocity = (1 / roughness) * Math.pow(hydraulicRadius, 2/3) * Math.pow(slope, 0.5);
    const flowRate = area * velocity * 1000; // Convert to L/s
    
    let status = 'success';
    let message = 'Flow rate calculated successfully';
    let success = true;
    
    if (flowRate < 1) {
      status = 'warning';
      message = 'Very low flow rate - check parameters';
    } else if (flowRate > 1000) {
      status = 'warning';
      message = 'Very high flow rate - verify inputs';
    }
    
    return { value: flowRate.toFixed(1), unit: 'L/s', status, message, success };
  };

  const calculateSoilCompaction = () => {
    const moisture = parameters['Moisture Content'] || 15;
    const compactionEffort = parameters['Compaction Effort'] || 100;
    const soilType = parameters['Soil Type'] || 2; // 1=clay, 2=silt, 3=sand
    
    // Simplified compaction curve
    const optimumMoisture = soilType === 1 ? 18 : soilType === 2 ? 12 : 8;
    const maxDensity = soilType === 1 ? 1.8 : soilType === 2 ? 1.9 : 2.0;
    
    const moistureFactor = 1 - Math.pow((moisture - optimumMoisture) / optimumMoisture, 2);
    const density = maxDensity * moistureFactor * (compactionEffort / 100);
    
    let status = 'neutral';
    let message = 'Compaction achieved';
    let success = false;
    
    if (density > maxDensity * 0.95) {
      status = 'success';
      message = 'Excellent compaction achieved (>95% max density)';
      success = true;
    } else if (density < maxDensity * 0.85) {
      status = 'error';
      message = 'Poor compaction - adjust moisture or effort';
    }
    
    return { value: density.toFixed(3), unit: 'g/cm³', status, message, success };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'from-green-500 to-emerald-600';
      case 'Intermediate': return 'from-yellow-500 to-orange-600';
      case 'Advanced': return 'from-red-500 to-pink-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getDifficultyColor(simulation.difficulty)}`}>
            {simulation.difficulty}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Completed</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span className="font-medium">{simulation.points} XP</span>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{simulation.title}</h3>
            <p className="text-gray-600 mb-4">{simulation.description}</p>
          </div>
          
          <Button
            onClick={() => setShowInfo(!showInfo)}
            variant="outline"
            size="icon"
            className="ml-4"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Learning Objectives */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200"
          >
            <h4 className="font-semibold text-blue-900 mb-2">Learning Objectives:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              {simulation.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  {objective}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      {/* Simulation Interface */}
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Parameters Panel */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Parameters
            </h4>
            
            {simulation.parameters.map((param, index) => (
              <div key={param.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    {param.name}
                  </label>
                  <span className="text-sm text-gray-600">
                    {parameters[param.name]?.toFixed(param.name.includes('Ratio') ? 3 : 1)} {param.unit}
                  </span>
                </div>
                
                <Slider
                  value={[parameters[param.name] || param.default]}
                  onValueChange={(value) => handleParameterChange(param.name, value)}
                  min={param.min}
                  max={param.max}
                  step={(param.max - param.min) / 100}
                  className="w-full"
                />
                
                <p className="text-xs text-gray-500">{param.description}</p>
              </div>
            ))}

            {/* Control Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={runSimulation}
                disabled={isRunning}
                className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-700 hover:via-purple-700 hover:to-cyan-700 text-white"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetSimulation}
                variant="outline"
                className="border-gray-300 hover:border-gray-400"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Results
            </h4>

            {results ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Main Result */}
                <Card className={`p-6 border-2 ${getStatusColor(results.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.status)}
                      <span className="font-semibold">Result</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {results.value} {results.unit}
                    </div>
                  </div>
                  <p className="text-sm">{results.message}</p>
                </Card>

                {/* Success Animation */}
                {results.success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                  >
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-semibold">Simulation Goal Achieved!</p>
                    <p className="text-green-700 text-sm">+{simulation.points} XP earned</p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Adjust parameters and run simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-indigo-600">{interactions}</div>
            <div className="text-sm text-gray-600">Interactions</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{formatTime(timeSpent)}</div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {isCompleted ? simulation.points : 0}
            </div>
            <div className="text-sm text-gray-600">XP Earned</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 