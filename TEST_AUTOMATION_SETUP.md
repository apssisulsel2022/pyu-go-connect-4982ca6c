# Shuttle System - Test Automation Setup

**Comprehensive Guide to Running Automated Tests**

---

## QUICK START

### Run All Tests
```bash
npm run test
```

### Run Specific Test File
```bash
npm run test src/utils/PriceCalculator.test.ts
```

### Run in Watch Mode (Development)
```bash
npm run test:watch
```

### Run with Coverage Report
```bash
npm run test -- --coverage
```

### Run and Generate HTML Report
```bash
npm run test -- --reporter=html
```

---

## 1. UNIT TESTS

### PriceCalculator Tests
**File:** `src/utils/PriceCalculator.test.ts`

#### Setup
```typescript
import { describe, it, expect } from 'vitest';
import { PriceCalculator } from './PriceCalculator';

describe('PriceCalculator', () => {
  // Tests go here
});
```

#### Test Categories

##### 1.1 Base Amount Calculation
```typescript
describe('calculateBaseAmount', () => {
  it('should calculate base amount with multiplier', () => {
    const result = PriceCalculator.calculateBaseAmount(100000, 1.2);
    expect(result).toBe(120000);
  });

  it('should handle zero multiplier', () => {
    const result = PriceCalculator.calculateBaseAmount(100000, 0);
    expect(result).toBe(0);
  });

  it('should handle decimal multiplier', () => {
    const result = PriceCalculator.calculateBaseAmount(100000, 1.05);
    expect(result).toBe(105000);
  });
});
```

##### 1.2 Distance Charge Calculation
```typescript
describe('calculateDistanceCharge', () => {
  it('should calculate distance charge', () => {
    const result = PriceCalculator.calculateDistanceCharge(50, 2000);
    expect(result).toBe(100000);
  });

  it('should handle decimal distance', () => {
    const result = PriceCalculator.calculateDistanceCharge(50.5, 2000);
    expect(result).toBeCloseTo(101000, 0);
  });

  it('should return 0 for zero distance', () => {
    const result = PriceCalculator.calculateDistanceCharge(0, 2000);
    expect(result).toBe(0);
  });
});
```

##### 1.3 Rayon Surcharge Calculation
```typescript
describe('calculateRayonSurcharge', () => {
  it('should multiply surcharge by seat count', () => {
    const result = PriceCalculator.calculateRayonSurcharge(5000, 3);
    expect(result).toBe(15000);
  });

  it('should handle single seat', () => {
    const result = PriceCalculator.calculateRayonSurcharge(5000, 1);
    expect(result).toBe(5000);
  });

  it('should return 0 for zero surcharge', () => {
    const result = PriceCalculator.calculateRayonSurcharge(0, 3);
    expect(result).toBe(0);
  });
});
```

##### 1.4 Peak Hours Multiplier
```typescript
describe('applyPeakHoursMultiplier', () => {
  it('should apply peak hours multiplier', () => {
    const result = PriceCalculator.applyPeakHoursMultiplier(100000, 1.2);
    expect(result).toBe(120000);
  });

  it('should not modify with 1.0x multiplier', () => {
    const result = PriceCalculator.applyPeakHoursMultiplier(100000, 1.0);
    expect(result).toBe(100000);
  });

  it('should handle decimal multiplier', () => {
    const result = PriceCalculator.applyPeakHoursMultiplier(100000, 1.15);
    expect(result).toBe(115000);
  });
});
```

##### 1.5 Total Calculation
```typescript
describe('calculateTotal', () => {
  it('should calculate total with all components', () => {
    const result = PriceCalculator.calculateTotal({
      routeFare: 150000,
      distanceKm: 50,
      seatCount: 2,
      baseFareMultiplier: 1.0,
      distanceCostPerKm: 2000,
      peakHoursMultiplier: 1.0,
      rayonBaseSurcharge: 5000
    });
    
    expect(result).toEqual({
      baseAmount: 150000,
      servicePremium: 0,
      distanceAmount: 100000,
      rayonSurcharge: 10000,
      subtotal: 260000,
      peakHoursMultiplier: 1.0,
      totalAmount: 260000,
      breakdown: [
        { label: 'Base Fare', amount: 150000 },
        { label: 'Distance Charge', amount: 100000 },
        { label: 'Rayon Surcharge', amount: 10000 }
      ]
    });
  });

  it('should include service premium when multiplier > 1.0', () => {
    const result = PriceCalculator.calculateTotal({
      routeFare: 150000,
      distanceKm: 50,
      seatCount: 2,
      baseFareMultiplier: 1.2,
      distanceCostPerKm: 3000,
      peakHoursMultiplier: 1.0,
      rayonBaseSurcharge: 5000
    });
    
    expect(result.baseAmount).toBe(180000);
    expect(result.servicePremium).toBe(30000); // 150000 × 0.2
    expect(result.distanceAmount).toBe(150000);
    expect(result.rayonSurcharge).toBe(10000);
  });
});
```

##### 1.6 Price Verification
```typescript
describe('verifyPrice', () => {
  it('should accept exact price', () => {
    expect(PriceCalculator.verifyPrice(100000, 100000)).toBe(true);
  });

  it('should accept price within +1 Rp tolerance', () => {
    expect(PriceCalculator.verifyPrice(100000, 100001)).toBe(true);
  });

  it('should accept price within -1 Rp tolerance', () => {
    expect(PriceCalculator.verifyPrice(100000, 99999)).toBe(true);
  });

  it('should reject price beyond tolerance', () => {
    expect(PriceCalculator.verifyPrice(100000, 100002)).toBe(false);
    expect(PriceCalculator.verifyPrice(100000, 99998)).toBe(false);
  });

  it('should allow custom tolerance', () => {
    expect(PriceCalculator.verifyPrice(100000, 100010, 10)).toBe(true);
    expect(PriceCalculator.verifyPrice(100000, 100011, 10)).toBe(false);
  });
});
```

##### 1.7 Price Formatting
```typescript
describe('formatPrice', () => {
  it('should format price with Rp prefix', () => {
    expect(PriceCalculator.formatPrice(100000)).toBe('Rp 100.000');
  });

  it('should add thousand separators', () => {
    expect(PriceCalculator.formatPrice(1000000)).toBe('Rp 1.000.000');
  });

  it('should handle zero', () => {
    expect(PriceCalculator.formatPrice(0)).toBe('Rp 0');
  });

  it('should handle large numbers', () => {
    expect(PriceCalculator.formatPrice(123456789)).toBe('Rp 123.456.789');
  });
});
```

##### 1.8 Breakdown Display
```typescript
describe('getPriceBreakdown', () => {
  it('should return breakdown array', () => {
    const breakdown = PriceCalculator.getPriceBreakdown({
      baseAmount: 150000,
      servicePremium: 30000,
      distanceAmount: 100000,
      rayonSurcharge: 10000,
      totalAmount: 290000
    });
    
    expect(breakdown).toHaveLength(4);
    expect(breakdown[0]).toEqual({ label: 'Base Fare', amount: 150000 });
    expect(breakdown[1]).toEqual({ label: 'Service Premium', amount: 30000 });
  });

  it('should exclude zero amounts', () => {
    const breakdown = PriceCalculator.getPriceBreakdown({
      baseAmount: 150000,
      servicePremium: 0,
      distanceAmount: 100000,
      rayonSurcharge: 10000,
      totalAmount: 260000
    });
    
    expect(breakdown).toHaveLength(3);
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run single file with verbose output
npm run test src/utils/PriceCalculator.test.ts -- --reporter=verbose

# Run with coverage
npm run test -- --coverage

# Generate HTML coverage report
npm run test -- --coverage --reporter=coverage
```

### Expected Unit Test Results
```
PriceCalculator
  ✓ calculateBaseAmount (3 tests)
  ✓ calculateDistanceCharge (3 tests)
  ✓ calculateRayonSurcharge (3 tests)
  ✓ applyPeakHoursMultiplier (3 tests)
  ✓ calculateTotal (2 tests)
  ✓ verifyPrice (5 tests)
  ✓ formatPrice (4 tests)
  ✓ getPriceBreakdown (2 tests)

✓ 25 tests passed (in 234ms)
```

---

## 2. INTEGRATION TESTS

### ShuttleService Integration Tests
**File:** `src/services/ShuttleService.integration.test.ts` (to create)

#### Setup with Test Fixtures
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ShuttleService } from './ShuttleService';
import { supabase } from '@/integrations/supabase/client';

describe('ShuttleService Integration', () => {
  let testScheduleId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test data
    // Seeds schedules, services, pricing
  });

  afterAll(async () => {
    // Clean up test data
  });

  beforeEach(async () => {
    // Reset state before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  // Tests here
});
```

#### Test: Get Available Services
```typescript
it('should get exactly 3 available services for a schedule', async () => {
  const services = await ShuttleService.getAvailableServices(testScheduleId);
  
  expect(services).toHaveLength(3);
  expect(services[0].serviceName).toBe('Regular');
  expect(services[1].serviceName).toBe('Semi Exec');
  expect(services[2].serviceName).toBe('Executive');
  
  // Validate each service has required fields
  services.forEach(service => {
    expect(service.id).toBeDefined();
    expect(service.vehicleType).toBeDefined();
    expect(service.capacity).toBeGreaterThan(0);
    expect(service.displayPrice).toBeGreaterThan(0);
  });
});
```

#### Test: Calculate Price
```typescript
it('should calculate price correctly for service', async () => {
  const price = await ShuttleService.calculatePrice(
    testRouteId,
    testServiceTypeId,
    testRayonId,
    2
  );
  
  expect(price.baseAmount).toBeGreaterThan(0);
  expect(price.distanceAmount).toBeGreaterThan(0);
  expect(price.rayonSurcharge).toBeGreaterThan(0);
  expect(price.totalAmount).toBe(
    price.baseAmount + 
    price.servicePremium + 
    price.distanceAmount + 
    price.rayonSurcharge
  );
});
```

#### Test: Create Booking
```typescript
it('should create booking with valid data', async () => {
  const booking = await ShuttleService.createBooking(
    testUserId,
    {
      scheduleId: testScheduleId,
      serviceTypeId: testServiceTypeId,
      vehicleType: 'MiniCar',
      rayonId: testRayonId,
      seatNumbers: [1, 2],
      passengerInfo: [
        { name: 'Test 1', phone: '081234567890' },
        { name: 'Test 2', phone: '081234567891' }
      ],
      paymentMethod: 'CASH',
      expectedTotalPrice: expectedPrice
    }
  );
  
  expect(booking.bookingId).toBeDefined();
  expect(booking.referenceNumber).toMatch(/^BDG-\d{4}-\d{2}-\d{2}-\d+$/);
  expect(booking.totalAmount).toBe(expectedPrice);
  expect(booking.bookingStatus).toBe('CONFIRMED');
});
```

#### Test: Cancel Booking
```typescript
it('should cancel booking and restore seats', async () => {
  // Create booking first
  const booking = await ShuttleService.createBooking(...);
  
  // Cancel it
  await ShuttleService.cancelBooking(booking.bookingId, 'Testing');
  
  // Verify cancelled
  const status = await supabase
    .from('shuttle_bookings')
    .select('booking_status')
    .eq('booking_id', booking.bookingId)
    .single();
  
  expect(status.data.booking_status).toBe('CANCELLED');
  
  // Verify seats released
  const availableSeats = await getAvailableSeatsForSchedule(testScheduleId);
  expect(availableSeats).toContain(1);
  expect(availableSeats).toContain(2);
});
```

### Running Integration Tests
```bash
# Run integration tests
npm run test -- .integration.test.ts

# Run specific integration test file
npm run test src/services/ShuttleService.integration.test.ts

# Run with detailed output
npm run test src/services/ShuttleService.integration.test.ts -- --reporter=verbose
```

---

## 3. COMPONENT TESTS

### ServiceVehicleSelector Component Tests
**File:** `src/components/shuttle/ServiceVehicleSelector.test.tsx` (to create)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceVehicleSelector } from './ServiceVehicleSelector';
import { ShuttleService } from '@/services/ShuttleService';

vi.mock('@/services/ShuttleService');

describe('ServiceVehicleSelector', () => {
  const mockScheduleId = 'test-schedule-123';
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render service options', async () => {
    // Mock the API response
    vi.spyOn(ShuttleService, 'getAvailableServices').mockResolvedValue([
      {
        id: '1',
        serviceName: 'Regular',
        vehicleType: 'MiniCar',
        capacity: 4,
        availableSeats: 4,
        displayPrice: 255000,
        isFeatured: true,
        facilities: ['AC', 'WiFi']
      },
      // ... more options
    ]);

    render(
      <ServiceVehicleSelector
        scheduleId={mockScheduleId}
        onSelect={mockOnSelect}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Regular')).toBeInTheDocument();
      expect(screen.getByText('MiniCar')).toBeInTheDocument();
    });
  });

  it('should call onSelect when service clicked', async () => {
    render(
      <ServiceVehicleSelector
        scheduleId={mockScheduleId}
        onSelect={mockOnSelect}
        isLoading={false}
      />
    );

    const regularOption = screen.getByText('Regular');
    fireEvent.click(regularOption);

    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceName: 'Regular'
      })
    );
  });

  it('should show loading state', () => {
    render(
      <ServiceVehicleSelector
        scheduleId={mockScheduleId}
        onSelect={mockOnSelect}
        isLoading={true}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display prices in Rp format', async () => {
    render(
      <ServiceVehicleSelector
        scheduleId={mockScheduleId}
        onSelect={mockOnSelect}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Rp \d+\.\d+/)).toBeInTheDocument();
    });
  });
});
```

### Running Component Tests
```bash
# Run all component tests
npm run test -- .test.tsx

# Run specific component test
npm run test src/components/shuttle/ServiceVehicleSelector.test.tsx

# Run with coverage
npm run test src/components/shuttle/ServiceVehicleSelector.test.tsx -- --coverage
```

---

## 4. VISUAL REGRESSION TESTING

### Setup with Playwright
**File:** `e2e/visual.spec.ts` (to create)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Shuttle Booking', () => {
  test('service selector should look correct', async ({ page }) => {
    await page.goto('/shuttle');
    
    // Select route and schedule first
    await page.click('text=Bandung → Jakarta');
    await page.click('text=14:00');
    
    // Take screenshot of service selector
    const serviceSelector = page.locator('[data-testid="service-selector"]');
    await expect(serviceSelector).toHaveScreenshot('service-selector.png');
  });

  test('price breakdown should look correct', async ({ page }) => {
    await page.goto('/shuttle');
    
    // Navigate to service selection
    await page.click('text=Bandung → Jakarta');
    await page.click('text=14:00');
    
    // Take screenshot
    const breakdown = page.locator('[data-testid="price-breakdown"]');
    await expect(breakdown).toHaveScreenshot('price-breakdown.png');
  });

  test('admin panel layout should be responsive', async ({ page }) => {
    await page.goto('/admin/shuttles');
    
    // Take screenshot at desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('admin-desktop.png');
    
    // Take screenshot at mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page).toHaveScreenshot('admin-mobile.png');
  });
});
```

---

## 5. PERFORMANCE TESTING

### Load Time Testing
**File:** `perf/load-times.test.ts` (to create)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance - Load Times', () => {
  test('route list should load in < 1 second', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/shuttle');
    await page.waitForSelector('[data-testid="route-list"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000);
  });

  test('service selector should render in < 500ms', async ({ page }) => {
    await page.goto('/shuttle');
    await page.click('text=Bandung → Jakarta');
    
    const startTime = Date.now();
    await page.click('text=14:00'); // Trigger service selector
    await page.waitForSelector('[data-testid="service-selector"]');
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(500);
  });

  test('price calculation should update in < 100ms', async ({ page }) => {
    await page.goto('/shuttle');
    // ... navigate to service selector
    
    const startTime = Date.now();
    await page.click('text=Semi Exec'); // Change service
    await page.waitForFunction(() => {
      const price = document.querySelector('[data-testid="total-price"]');
      return price?.textContent?.includes('335'); // New price
    });
    
    const updateTime = Date.now() - startTime;
    expect(updateTime).toBeLessThan(100);
  });
});
```

---

## 6. TEST CONFIGURATION

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'coverage',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### src/test/setup.ts
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## 7. RUNNING FULL TEST SUITE

### All Tests Command
```bash
npm run test
```

### Tests with Coverage
```bash
npm run test -- --coverage
```

### HTML Coverage Report
```bash
npm run test -- --coverage
# Open coverage/index.html in browser
```

### CI/CD Integration
```bash
# For GitHub Actions (.github/workflows/test.yml)
npm run test -- --reporter=json --outputFile=test-results.json
npm run test -- --coverage --coverageReporters=json --coverageReporters=text

# For deployment protection
# - Require all tests passing
# - Require > 80% coverage
# - Require no TypeScript errors
```

---

## 8. TROUBLESHOOTING

### Common Issues

**Issue: Tests hang/timeout**
```bash
# Increase timeout for specific test
it('should load data', async () => {
  // ...
}, { timeout: 10000 }); // 10 seconds
```

**Issue: Mock not working**
```bash
# Clear mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});

// Or globally in config
clearMocks: true,
```

**Issue: Component not rendering**
```bash
# Ensure proper wrapper with providers
render(
  <Provider>
    <ComponentToTest />
  </Provider>
);
```

**Issue: Database test data not available**
```bash
# Seed test database before running integration tests
beforeAll(async () => {
  await seedTestDatabase();
});
```

---

## 9. TEST COVERAGE GOALS

| Category | Current | Target | Status |
|----------|---------|--------|--------|
| Statements | 0% | 80% | ⏳ Starting |
| Branches | 0% | 75% | ⏳ Starting |
| Functions | 0% | 85% | ⏳ Starting |
| Lines | 0% | 80% | ⏳ Starting |

---

## 10. CONTINUOUS TESTING

### Pre-Commit Testing
```bash
# In package.json scripts
"precommit": "npm run test -- --changed"
```

### Pre-Push Testing
```bash
# Run full suite before pushing
npm run test
```

### Post-Merge Testing
```bash
# Automatically run on GitHub PRs
# See .github/workflows/test.yml
```

---

*Last Updated: April 14, 2026*  
*Test Automation Version: 1.0*
