# QA Checklist - UX/UI Improvements

## Design System Verification

### Color Scheme
- [ ] Light mode colors display correctly
- [ ] Dark mode activates with system preference
- [ ] Dark mode colors have sufficient contrast
- [ ] Gold accent color (#c9a227) visible on both themes
- [ ] Text colors readable on both light and dark backgrounds
- [ ] Borders visible on both themes

### Typography
- [ ] Font sizes readable on all screen sizes
- [ ] Font weights create clear hierarchy
- [ ] Line heights provide good readability
- [ ] Mono font (IBM Plex) displays correctly for numbers/code
- [ ] Display font (Plus Jakarta Sans) looks professional

---

## Component Testing

### Input Field Component
- [ ] Label displays correctly
- [ ] Placeholder text visible
- [ ] Error state shows red border + error icon
- [ ] Success state shows green border + success icon
- [ ] Helper text displays below field
- [ ] Required asterisk (*) shows when required=true
- [ ] Icon (leading) displays correctly
- [ ] Icon (trailing) displays correctly
- [ ] Focus ring appears on focus
- [ ] Focus styling works in dark mode
- [ ] aria-invalid set when error present
- [ ] aria-describedby links to error/helper text
- [ ] All sizes (sm, md, lg) work correctly

### Button Component
- [ ] All variants display correctly (primary, secondary, danger, etc.)
- [ ] All sizes work (sm, md, lg, xl)
- [ ] Hover states work
- [ ] Active/pressed states work
- [ ] Disabled state is visually distinct
- [ ] Disabled prevents click
- [ ] Loading state shows spinner
- [ ] Loading state shows "Loading..." text
- [ ] fullWidth stretches to 100%
- [ ] Touch targets >= 44x44px on mobile
- [ ] Dark mode styling correct for all variants

### EmptyState Component
- [ ] Title displays correctly
- [ ] Description text wraps properly
- [ ] Icon renders (uses Lucide React)
- [ ] Action button is clickable
- [ ] Variants work (default, success, warning, danger)
- [ ] Background colors correct for each variant
- [ ] Responsive on mobile

### BottomSheet Component
- [ ] Slides up from bottom on open
- [ ] Close button works
- [ ] Pressing Escape closes sheet
- [ ] Clicking backdrop closes sheet
- [ ] Title displays at top
- [ ] Content scrolls if too tall
- [ ] Actions buttons at bottom
- [ ] No scroll body when open
- [ ] Works on mobile viewport

### ProductCard Component
- [ ] Product image displays
- [ ] Product name shows with line clamp
- [ ] Price displays correctly (formatted currency)
- [ ] Stock count shows
- [ ] "HABIS" overlay appears when out of stock
- [ ] Stock badge shows when 1-5 items left
- [ ] Quick action button functional
- [ ] Click selects product
- [ ] Disabled state prevents interaction
- [ ] Grid layout responsive (2 cols mobile)
- [ ] Touch target large enough for mobile

### NotificationItem Component
- [ ] Success notification appears green
- [ ] Error notification appears red
- [ ] Warning notification appears yellow
- [ ] Info notification appears gray
- [ ] Toast auto-dismisses after 4.2s
- [ ] Manual dismiss button works
- [ ] Toast slides in from top-right
- [ ] Toast slides out on dismiss
- [ ] Multiple toasts stack vertically
- [ ] Dark mode colors correct
- [ ] aria-live="polite" announces changes

### FormField Component
- [ ] Wraps Input component correctly
- [ ] onChange callback works
- [ ] onBlur callback works
- [ ] Shows error when present
- [ ] Shows success when present
- [ ] Required indicator works
- [ ] Icons display correctly

---

## Mobile Responsiveness

### Touch Targets
- [ ] Buttons >= 44x44px on mobile
- [ ] Icons >= 44x44px on mobile
- [ ] Links have adequate padding
- [ ] Close buttons large enough to tap

### Layouts
- [ ] Product grid shows 2 columns on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms fit on mobile screen without horizontal scroll
- [ ] Bottom sheets use full width
- [ ] Modals fit on mobile screen
- [ ] Sidebar works on mobile with toggle

### Navigation
- [ ] Mobile nav tabs appear on small screens
- [ ] Desktop sidebar hides on mobile
- [ ] Hamburger menu functional
- [ ] Navigation swipe doesn't interfere with content

---

## Dark Mode Testing

### Manual Dark Mode Toggle
- [ ] Theme toggle button works
- [ ] Preference persists on reload
- [ ] localStorage stores preference

### System Preference
- [ ] Respects `prefers-color-scheme: dark`
- [ ] Works without localStorage
- [ ] Changes when system preference changes

### All Components in Dark Mode
- [ ] Input fields readable
- [ ] Buttons visible
- [ ] Notifications visible
- [ ] Cards have sufficient contrast
- [ ] Text readable
- [ ] Borders visible
- [ ] Icons visible
- [ ] Images display correctly
- [ ] Tables readable
- [ ] Modals/sheets readable

---

## Form Validation Testing

### Validator Functions
- [ ] `required()` works correctly
- [ ] `email()` validates email format
- [ ] `minLength()` checks minimum length
- [ ] `maxLength()` checks maximum length
- [ ] `phone()` validates phone numbers
- [ ] `number()` validates numeric input
- [ ] `positive()` checks positive numbers
- [ ] `match()` compares two values

### useFormValidation Hook
- [ ] Initial values set correctly
- [ ] onChange updates values
- [ ] onBlur marks field as touched
- [ ] Errors cleared when user types
- [ ] Validation runs on blur
- [ ] Form prevents submit if errors
- [ ] All fields validated on submit
- [ ] Touched state tracks user interaction
- [ ] resetForm clears all state

### Error Display
- [ ] Error messages appear below field
- [ ] Error icon shows
- [ ] Error color (red) applies to border
- [ ] Success messages show in green
- [ ] Helper text displays when no error

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through form fields
- [ ] Shift+Tab navigates backwards
- [ ] Enter submits forms
- [ ] Space activates buttons
- [ ] Escape closes modals/sheets
- [ ] Focus ring visible on all elements

### Screen Reader (NVDA/JAWS)
- [ ] Form labels read correctly
- [ ] Error messages announced
- [ ] Notifications announced with aria-live
- [ ] Button purposes clear
- [ ] Icons have aria-labels
- [ ] Modal role announced
- [ ] Required fields marked

### Focus Management
- [ ] Focus visible on keyboard nav
- [ ] Focus outline sufficient contrast
- [ ] Focus doesn't hide important content
- [ ] Focus trap works in modals
- [ ] Focus restored after modal closes

### Color Contrast
- [ ] Text >= 4.5:1 contrast with background
- [ ] UI components >= 3:1 contrast
- [ ] Works with browser zoom to 200%

---

## Cross-Browser Testing

### Chrome/Edge
- [ ] All components render correctly
- [ ] Animations smooth
- [ ] Dark mode works
- [ ] Form validation works

### Firefox
- [ ] All components render correctly
- [ ] Focus ring visible
- [ ] Form validation works

### Safari
- [ ] Components render correctly
- [ ] Touch events work on iOS
- [ ] Dark mode respects system
- [ ] Modals work correctly

### Mobile Safari
- [ ] Touch targets adequate
- [ ] Keyboard doesn't hide content
- [ ] Bottom sheets scroll correctly
- [ ] Forms accessible with keyboard

---

## Performance Testing

### Page Load
- [ ] Page loads < 3s
- [ ] Components render without jank
- [ ] Animations smooth (60fps)
- [ ] No console errors

### Interactions
- [ ] Form submit responsive
- [ ] Button clicks register immediately
- [ ] Modals open/close smoothly
- [ ] Lists scroll smoothly

### Dark Mode Switch
- [ ] Theme changes < 100ms
- [ ] No flash of wrong theme
- [ ] Smooth transition

---

## Content Testing

### Text Content
- [ ] All text in Indonesian
- [ ] Grammar and spelling correct
- [ ] Labels descriptive
- [ ] Error messages helpful
- [ ] Abbreviations explained

### Numbers/Currency
- [ ] Prices formatted as "Rp X.XXX.XXX"
- [ ] Numbers use thousand separators
- [ ] Decimals handled correctly

### Dates/Times
- [ ] Dates formatted correctly (dd/mm/yyyy)
- [ ] Times formatted correctly (24-hour)
- [ ] Timezones correct

---

## Integration Testing

### Form Submission
- [ ] Form submits successfully
- [ ] Success notification appears
- [ ] Error handling shows error notification
- [ ] Loading state shows during submission
- [ ] Form disabled during submission

### Navigation
- [ ] Links navigate correctly
- [ ] Browser back button works
- [ ] Deep links work
- [ ] Query parameters preserved

### Data Display
- [ ] Empty states show when no data
- [ ] Data loads and displays
- [ ] Pagination works
- [ ] Sorting works
- [ ] Filtering works

---

## Browser DevTools Testing

### Responsive Design Mode
- [ ] Test at 320px width (mobile)
- [ ] Test at 768px width (tablet)
- [ ] Test at 1280px width (desktop)
- [ ] Test at 1920px width (large desktop)
- [ ] Test with device pixel ratio 2x

### Accessibility Inspector
- [ ] No color contrast warnings
- [ ] Proper heading hierarchy
- [ ] Images have alt text
- [ ] Form fields have labels
- [ ] No unlabeled buttons

### Performance
- [ ] Check for layout shifts (CLS)
- [ ] Check rendering performance
- [ ] Check JavaScript execution time

---

## Final Sign-Off

- [ ] All components tested and working
- [ ] Mobile experience optimized
- [ ] Dark mode fully functional
- [ ] Accessibility meets WCAG AA
- [ ] No console errors/warnings
- [ ] No broken links
- [ ] All features responsive
- [ ] Cross-browser compatibility confirmed
- [ ] Performance acceptable
- [ ] Ready for production

---

## Known Issues / Edge Cases

| Issue | Status | Notes |
|-------|--------|-------|
| Dark mode transition flash | TODO | Add localStorage persistence |
| Mobile keyboard overlap | FIXED | BottomSheet handles this |
| Form validation async | FUTURE | Add async validation support |

---

Test Date: _________________  
Tested By: _________________  
Status: ☐ PASS ☐ FAIL  
Comments: ___________________________

