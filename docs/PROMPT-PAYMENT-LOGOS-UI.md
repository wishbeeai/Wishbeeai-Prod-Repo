# Cursor Prompt: Payment Logos Flex UI

Use this prompt when creating the payment logos flex container component.

---

## Prompt

Create a flex container that displays the following payment logos as small, uniform cards, matching the attached reference image:

**Payment options to include (in order, left to right):**
1. **Credit Card (Visa/Mastercard)** – Display both Visa and Mastercard logos side by side or combined
2. **PayPal**
3. **Google Pay**
4. **Apple Pay**
5. **Venmo**
6. **Cash App**

**Design requirements (from reference image):**

- **Layout:** Horizontal flex row with even spacing (`flex flex-wrap gap-3 sm:gap-4` or similar)
- **Container:** Light grey background (`bg-gray-100`), rounded corners (`rounded-xl`), padding
- **Individual cards:** Small, uniform height; white rectangular backgrounds; card-like appearance
- **Logo cards:** Most logos on white backgrounds; height uniform across all cards
- **Venmo:** Solid blue rectangular background (`#008CFF`) with white logo
- **Apple Pay:** White card with thin black border/stroke around it
- **Sizing:** Compact cards (e.g. `w-16 h-11` or `w-20 h-14`) so they align in a single horizontal row on desktop
- **Logos:** Use high-quality icons (e.g. Simple Icons CDN: `https://cdn.simpleicons.org/{slug}`) – visa, paypal, mastercard, googlepay, applepay, venmo, squarecash
- **No labels:** Logo-only cards (no text labels underneath), matching the clean reference style

**Reference:** The attached image shows a "We accept" style payment bar: horizontal row of payment logos in uniform white cards on a light grey background, with Venmo in blue and Apple Pay with a black border.

---

## Implementation Notes

- Use `PaymentLogosFlex` component name
- Credit Card can show both Visa and Mastercard logos in one card or as adjacent cards
- Ensure logos are centered and scaled consistently
- Component should be responsive (wrap on smaller screens)
