# Quick Reference - Number Input Implementation

## Key Files Modified
- `src/routes/+page.svelte` - Main implementation

## Key Functions Added

### Font Size Adjustment
```typescript
function adjustInputFontSize(inputElement: HTMLInputElement, value: string | number) {
  const length = value.toString().length;
  let fontSize: string;
  
  if (length <= 3) fontSize = 'calc(476px * 0.12 + 32px)'; // ~89px
  else if (length === 4) fontSize = 'calc(476px * 0.10 + 28px)'; // ~76px  
  else fontSize = 'calc(476px * 0.09 + 24px)'; // ~67px
  
  inputElement.style.fontSize = fontSize;
}
```

## Key CSS Classes

### Container
```css
.win-number-container {
  min-width: calc(476px * 0.35);
  max-width: calc(476px * 0.55); 
  width: auto;
  padding: 0 8px;
  overflow: hidden;
}
```

### Input Field
```css
.win-number-input {
  appearance: textfield;
  -moz-appearance: textfield;
  background: transparent;
  border: none;
  caret-color: #00e5ff;
  cursor: text;
}
```

## Event Handlers
- `on:input` - Real-time font adjustment
- `on:focus` - Position cursor at end
- `on:click` - Position cursor at end

## Responsive Attributes
- `data-length={Math.abs($win).toString().length + ($win < 0 ? 1 : 0)}`

## Testing Scenarios
1. Short numbers: 1, 23, 456
2. Long numbers: 1234, -9999
3. Real-time typing
4. Focus/blur behavior
