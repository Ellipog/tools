1.  CORE_AESTHETIC_DNA
    Philosophy: Industrial Brutalism meets High-Contrast Minimalism.

Color Space: \* Base_BG: #000000 (Pure Black) or #050505 (Deep Charcoal).

Accent_Primary: #FFFFFF (Pure White).

UI_Alpha: white/5 (Surfaces), white/10 (Borders), white/40 (Labels/Non-Active).

Typography: \* Labels/UI: Sans-serif, uppercase, tracking-[0.3em], text-[10px] to text-[12px].

Data Outputs: serif, italic, leading-relaxed (e.g., citation results).

Hierarchy: Headers must be numbered (e.g., 01. SOURCE, 02. CONFIG).

2.  LAYOUT_ARCHITECTURE (12-COLUMN_GRID)
    Every tool page follows a standard two-sector layout:

Sidebar (Input Sector): lg:col-span-4. Contains all controls, inputs, and configuration nodes.

Main (Output Sector): lg:col-span-8. A large bg-[#080808] container with a subtle border-white/5. This is the "Artboard" or "Result Buffer."

3.  COMPONENT_SPECIFICATIONS
    A. Navigation (Navbar)
    Sticky or Fixed top.

Props: title (EN), jp (Japanese translation), category.

Style: Thin bottom border border-white/10.

B. Section Headers
Must contain a number, an English title (lowercase or uppercase), and the <ScrambleText /> component for Japanese characters.

Tailwind: flex justify-between items-end border-b border-white/10 pb-2 mb-4.

C. Interactive Inputs
Standard Input: Transparent background, bottom-border only (border-b border-white/10).

Primary Action Button: Pure White background, Black text (bg-white text-black), uppercase, font-bold. No rounded corners.

Toggle/Checkbox: Custom square borders. Active state: bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)].

Range Sliders: accent-white bg-white/10 h-px appearance-none.

D. Modals & Popups
Position: Fixed, usually bottom-6 right-6.

Visuals: bg-[#0A0A0A], border-white/10, scale-in animation (framer-motion).

Metadata Decor: Tiny version numbers or "protocol strings" in corners (text-[8px] opacity-10).

4.  MOTION_SYSTEM (Framer_Motion)
    Page Transitions: Initial: { opacity: 0, y: 20 }. Animate: { opacity: 1, y: 0 }.

Sidebar Slide: Initial: { opacity: 0, x: -20 }.

State Changes: Use <AnimatePresence mode="wait"> for swapping content in the Output Sector.

Scramble Effect: Every static label should ideally use the ScrambleText component on mount or hover to simulate "data decoding."

5.  DATA_LOGIC & ENCODING
    Encoding: Always assume UTF-8.

Localization: Support Norwegian characters (Æ, Ø, Å) in inputs and scrapers.

Empty States: Never use "Anonymous." If data is missing, move the next available field to the primary position or use null_data_idle.

6.  TAILWIND_UTILITY_SHORTCUTS
    tracking-widest = 0.3em to 0.5em.

border-white/10 = Standard Divider.

selection:bg-white selection:text-black = Global Highlight style.

custom-scrollbar = Thin, minimal, dark scrollbars.
