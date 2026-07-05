import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this.on = jest.fn();
      this.addControl = jest.fn();
      this.addSource = jest.fn();
      this.addLayer = jest.fn();
      this.remove = jest.fn();
      this.getSource = jest.fn();
    }
  }
  class MockMarker {
    constructor() {
      this.setLngLat = jest.fn().mockReturnThis();
      this.setPopup = jest.fn().mockReturnThis();
      this.addTo = jest.fn().mockReturnThis();
      this.remove = jest.fn();
    }
  }
  class MockPopup {
    constructor() {
      this.setHTML = jest.fn().mockReturnThis();
    }
  }
  return {
    Map: MockMap,
    NavigationControl: jest.fn(),
    Marker: MockMarker,
    Popup: MockPopup
  };
});

jest.mock('@turf/turf', () => ({
  polygon: jest.fn(() => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [] }
  })),
  area: jest.fn(() => 0),
}));

test('renders VaraMap title', () => {
  render(<App />);
  const titleElement = screen.getByText(/VaraMap Studio/i);
  expect(titleElement).toBeInTheDocument();
});
