# UI Components

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Chakra UI v3 component wrappers for consistent styling and accessibility
- **I/O**: Props → Styled Chakra components with preset configurations

## 2. Core Logic

### Available Components

| Component | File | Wraps |
|-----------|------|-------|
| `Button` | `button.tsx` | Chakra Button with variants |
| `Checkbox` | `checkbox.tsx` | Chakra Checkbox |
| `Dialog` | `dialog.tsx` | Chakra Modal/AlertDialog |
| `Drawer` | `drawer.tsx` | Chakra Drawer |
| `Field` | `field.tsx` | Form field with label/error |
| `InputGroup` | `input-group.tsx` | Input with addons |
| `NumberInput` | `number-input.tsx` | Numeric input with stepper |
| `Select` | `select.tsx` | Chakra Select |
| `Slider` | `slider.tsx` | Range slider |
| `Switch` | `switch.tsx` | Toggle switch |
| `Tag` | `tag.tsx` | Chakra Tag |
| `Toaster` | `toaster.tsx` | Toast notifications |
| `Tooltip` | `tooltip.tsx` | Chakra Tooltip |

### Pattern

Each wrapper typically:
1. Re-exports Chakra component parts
2. Adds default props/styles
3. Provides TypeScript types

```typescript
// Example: tooltip.tsx pattern
import { Tooltip as ChakraTooltip } from '@chakra-ui/react';

export const Tooltip = (props) => (
  <ChakraTooltip {...defaultProps} {...props} />
);
```

### Constraints

- Based on Chakra UI v3 (not v2)
- Dark theme optimized
- Consistent with app's design system

## 3. Usage

```tsx
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Toaster, toaster } from '@/components/ui/toaster';

// Button
<Button colorScheme="blue" onClick={handleClick}>
  Click me
</Button>

// Tooltip
<Tooltip label="Helpful tip">
  <span>Hover me</span>
</Tooltip>

// Switch
<Switch checked={isEnabled} onChange={setIsEnabled} />

// Toast notification
toaster.success({ title: 'Success!', description: 'Action completed' });
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/components/ui/
├── button.tsx
├── checkbox.tsx
├── dialog.tsx
├── drawer.tsx
├── field.tsx
├── input-group.tsx
├── number-input.tsx
├── select.tsx
├── slider.tsx
├── switch.tsx
├── tag.tsx
├── toaster.tsx
└── tooltip.tsx
```

### B. Chakra UI v3 Migration Notes

Chakra UI v3 has different APIs from v2:
- `useDisclosure` → Component-based state
- `Modal` → `Dialog`
- Toast API changes

### C. Related Documents

- Chakra UI Docs: https://chakra-ui.com/docs

