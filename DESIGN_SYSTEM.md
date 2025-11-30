# BlueShark Design System

> Enterprise-grade design language inspired by Databricks UI

---

## Color Palette

### Backgrounds
| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Page background | `#f7f7f7` | `bg-[#f7f7f7]` |
| Sidebar background | `#f7f7f7` | `bg-[#f7f7f7]` |
| Header background | `#f7f7f7` | `bg-[#f7f7f7]` |
| Content container | `#ffffff` | `bg-[#ffffff]` or `bg-white` |
| Search bar | `#ffffff` | `bg-white` |
| Active sidebar item | Light blue | `bg-blue-50` |
| Hover sidebar item | Light blue | `hover:bg-blue-50` |

### Text Colors
| Usage | Color | Tailwind Class |
|-------|-------|----------------|
| Primary text | Dark gray | `text-gray-900` |
| Secondary text | Medium gray | `text-gray-600` |
| Muted text | Light gray | `text-gray-500` |
| Active nav item | Blue | `text-blue-600` |
| Placeholder text | Medium gray | `placeholder-gray-500` |

### Border Colors
| Usage | Tailwind Class |
|-------|----------------|
| Default borders | `border-gray-200` |
| Search bar border | `border-gray-300` |
| Focus border | `focus-within:border-blue-400` |

---

## Typography

### Font Sizes
| Element | Size | Tailwind Class |
|---------|------|----------------|
| Page title | 2xl | `text-2xl font-semibold` |
| Section title | base | `text-base font-semibold` |
| Body text | sm | `text-sm` |
| Small/caption | xs | `text-xs` |
| Nav item | sm | `text-sm` |

### Font Weights
| Usage | Tailwind Class |
|-------|----------------|
| Headings | `font-semibold` |
| Active nav | `font-medium` |
| Normal nav | `font-normal` |
| Body text | `font-normal` or `font-medium` |

---

## Spacing

### Padding
| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Page content | 24px | `p-6` |
| Header horizontal | 24px | `px-6` |
| Header vertical | 12px | `py-3` |
| Sidebar items | 12px / 8px | `px-3 py-2` |
| Cards | 20px | `p-5` |
| Search bar inner | 16px / 8px | `px-4 py-2` |

### Gaps
| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Sidebar to content | 8px | `pl-2` |
| Nav item icon to text | 10px | `gap-2.5` |
| Header elements | 16px | `gap-4` |
| Grid cards | 16px | `gap-4` |

### Margins
| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Section spacing | 24px | `mb-6` |
| Title to subtitle | 4px | `mb-1` |

---

## Border Radius

| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Content container (left) | xl | `rounded-l-xl` |
| Search bar | xl | `rounded-xl` |
| Sidebar items | md | `rounded-md` |
| Cards | lg | `rounded-lg` |
| Buttons | lg/xl | `rounded-lg` or `rounded-xl` |
| Avatar | full | `rounded-full` |
| Logo icon | md | `rounded-md` |

---

## Component Patterns

### Sidebar
```tsx
// Container
<div className="w-60 bg-[#f7f7f7] flex flex-col h-full">

// Logo section
<div className="px-5 py-4 border-b border-gray-100 h-[60px] flex items-center">
  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
    <span className="text-white font-semibold text-base">B</span>
  </div>
  <span className="text-lg font-semibold text-gray-900">BlueShark</span>
</div>

// Nav item
<button className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors group ${
  active
    ? "bg-blue-50 text-blue-600"
    : "text-gray-600 hover:bg-blue-50 hover:text-gray-900"
}`}>
  <span className="flex items-center gap-2.5">
    <Icon className="w-[18px] h-[18px]" />
    <span className={`text-sm ${active ? "font-medium" : "font-normal"}`}>{label}</span>
  </span>
</button>
```

### Header
```tsx
<header className="bg-[#f7f7f7] px-6 py-3 relative h-[60px] flex items-center gap-4 w-full">
  {/* Spacer for centering */}
  <div className="flex-1"></div>

  {/* Search Bar - centered */}
  <div className="relative w-[500px]">
    <div className="flex items-center bg-white rounded-xl px-4 py-2 border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <Search className="w-4 h-4 text-gray-500 mr-3" />
      <input
        type="text"
        placeholder="Search data, batches, workers, and more..."
        className="bg-transparent w-full text-sm outline-none text-gray-700 placeholder-gray-500"
      />
      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">CTRL + K</span>
    </div>
  </div>

  {/* Spacer for centering */}
  <div className="flex-1"></div>

  {/* Right section */}
  <div className="flex items-center gap-4">...</div>
</header>
```

### Content Container (Right Content)
```tsx
<div className="flex flex-col flex-1 h-full bg-[#f7f7f7] pl-2">
  <Header />
  <main className="flex-1 overflow-hidden">
    <div className="bg-[#ffffff] rounded-l-xl h-full border border-gray-200 overflow-auto">
      <ContentRouter />
    </div>
  </main>
</div>
```

### Stat Card
```tsx
<div className="bg-white rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-colors">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
    <div className="text-gray-400">
      {icon}
    </div>
  </div>
</div>
```

### Quick Action Card
```tsx
<button className={`bg-gradient-to-br ${gradient} rounded-lg p-4 text-left border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm`}>
  <div className={`mb-2 ${iconColor}`}>
    {icon}
  </div>
  <h4 className="font-medium text-sm text-gray-900 mb-0.5">{title}</h4>
  <p className="text-xs text-gray-500">{description}</p>
</button>

// Gradient options:
// from-emerald-50 to-teal-100 (green)
// from-blue-50 to-indigo-100 (blue)
// from-violet-50 to-purple-100 (purple)
// from-amber-50 to-orange-100 (orange)
```

### User Avatar
```tsx
<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
  <User className="w-4 h-4 text-white" />
</div>
```

---

## Shadows & Effects

| Usage | Tailwind Class |
|-------|----------------|
| Cards (default) | No shadow, use border |
| Cards (hover) | `hover:shadow-sm` |
| Dropdowns | `shadow-lg` |
| Focus ring | `focus-within:ring-2 focus-within:ring-blue-100` |

---

## Icon Sizes

| Context | Size | Tailwind Class |
|---------|------|----------------|
| Nav items | 18px | `w-[18px] h-[18px]` |
| Search icon | 16px | `w-4 h-4` |
| Stat card icons | 24px | `w-6 h-6` |
| Header icons | 20px | `w-5 h-5` |
| Small icons | 16px | `w-4 h-4` |

---

## Layout Dimensions

| Element | Value |
|---------|-------|
| Sidebar width | 240px (`w-60`) |
| Header height | 60px (`h-[60px]`) |
| Logo section height | 60px (`h-[60px]`) |
| Search bar width | 500px (`w-[500px]`) |

---

## Transitions

| Usage | Tailwind Class |
|-------|----------------|
| Default | `transition-colors` |
| All properties | `transition-all` |
| Duration | Default (150ms) |

---

## Key Principles

1. **Minimal shadows** - Use borders instead of shadows for cards
2. **Subtle hover states** - Use light backgrounds (blue-50) for hover
3. **Consistent spacing** - Use the established padding/gap values
4. **Clean borders** - Use gray-200 for most borders, gray-300 for inputs
5. **Centered search** - Search bar should be centered in header
6. **Rounded containers** - Content area has rounded left corners only
7. **White content areas** - Main content on white, chrome on #f7f7f7

---

*Last updated: November 30, 2025*
