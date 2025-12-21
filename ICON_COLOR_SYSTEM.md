# Wishbee.ai Icon Color System

This document defines the consistent color scheme for all icons across the Wishbee.ai platform.

## Icon Color Mapping

### Primary Icons

**Gift Icons** 🎁
- Color: Gold gradient `from-[#DAA520] to-[#F4C430]`
- Background: Same gradient with white icon
- Usage: Gift collections, presents, gift-related actions
- Badge: `bg-gradient-to-br from-[#DAA520] to-[#F4C430]`

**Dollar/Money Icons** 💰
- Color: Emerald/Green gradient `from-emerald-500 to-green-600`
- Background: `bg-gradient-to-br from-emerald-500 to-green-600`
- Usage: Contributions, payments, financial data
- Badge: `bg-gradient-to-br from-emerald-500 to-green-600`

**Users/Groups Icons** 👥
- Color: Orange/Amber gradient `from-orange-500 to-amber-500`
- Background: `bg-gradient-to-br from-orange-500 to-amber-500`
- Usage: Groups, members, people, community
- Badge: `bg-gradient-to-br from-orange-500 to-amber-500`

**Analytics/Chart Icons** 📊
- Color: Yellow/Amber gradient `from-yellow-500 to-amber-500`
- Background: `bg-gradient-to-br from-yellow-500 to-amber-500`
- Usage: Statistics, charts, trends, data visualization
- Badge: `bg-gradient-to-br from-yellow-500 to-amber-500`

**AI Icons** ✨
- Color: Amber-Orange-Rose gradient `from-amber-500 via-orange-500 to-rose-500`
- Background: `bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500`
- Usage: AI features, smart suggestions, brain icons, sparkles
- Badge: `bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500`

### Secondary Icons

**Target/Goals** 🎯
- Color: `text-amber-600`
- Usage: Targets, goals, objectives

**Award/Achievement** 🏆
- Color: `text-[#DAA520]`
- Usage: Achievements, badges, success

**Calendar** 📅
- Color: `text-[#DAA520]`
- Usage: Dates, events, scheduling

**Heart/Favorites** ❤️
- Color: `text-rose-500`
- Usage: Favorites, likes, wishlists

**Trending/Growth** 📈
- Color: `text-green-600`
- Usage: Growth indicators, success metrics

**Clock/Time** ⏰
- Color: `text-amber-600`
- Usage: Countdowns, deadlines, time-sensitive items

## Implementation Guidelines

1. **Consistency**: Always use the same color for the same icon type across all pages
2. **Backgrounds**: For prominent icons, use gradient backgrounds with white icons
3. **Small Icons**: For inline icons, use text colors
4. **Hover States**: Use darker shades for hover (e.g., `hover:from-amber-600`)
5. **Borders**: Match borders to the icon color with `/30` or `/20` opacity

## Examples

### Gift Icon (Large)
\`\`\`tsx
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#DAA520] to-[#F4C430] flex items-center justify-center">
  <Gift className="w-6 h-6 text-white" />
</div>
\`\`\`

### Dollar Icon (Large)
\`\`\`tsx
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
  <DollarSign className="w-6 h-6 text-white" />
</div>
\`\`\`

### Users Icon (Large)
\`\`\`tsx
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
  <Users className="w-6 h-6 text-white" />
</div>
\`\`\`

### AI Button
\`\`\`tsx
<button className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-4 py-2 rounded-lg">
  <Brain className="w-5 h-5" />
  AI Feature
</button>
