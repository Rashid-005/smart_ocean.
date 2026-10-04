import {
  DemoMapProvider,
  DemoRoutingProvider,
  MockAIProvider,
  MockOceanProvider,
  MockPredictionProvider,
  MockWeatherProvider,
  PythonMLProvider,
} from "./mock-providers";

// Central wiring for Phase 2. Swap mocks for real providers here in later phases
// without touching API routes or UI.
export const mapService = new DemoMapProvider();
export const routingService = new DemoRoutingProvider();
export const weatherService = new MockWeatherProvider();
export const oceanService = new MockOceanProvider();
export const aiService = new MockAIProvider();

const mockPredictionService = new MockPredictionProvider();
const pythonPredictionService = new PythonMLProvider();

export function getPredictionService() {
  // Phase 6 will set ML_SERVICE_URL to use the live Python service.
  if (pythonPredictionService.isConfigured) return pythonPredictionService;
  return mockPredictionService;
}

export { MockPredictionProvider };
