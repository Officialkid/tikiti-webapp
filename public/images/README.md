# Landing Page Images

This folder should contain the hero section background images:

## Required Images:
- `hero-1.jpg` - Dark event crowd image (showcasing safety/capacity tracking)
- `hero-2.jpg` - Virtual streaming/online event image
- `hero-3.jpg` - Group of friends at an event (squad mode)

## Specifications:
- **Dimensions:** 1920x1080px minimum
- **Format:** JPG or WebP
- **File size:** Max 300KB each (optimize for web)
- **Style:** Dark/moody with vibrant colors, event atmosphere

## Image Sources:
You can use:
- Free stock photos from [Unsplash](https://unsplash.com/s/photos/concert)
- [Pexels](https://www.pexels.com/search/party/)
- Your own event photography

## Fallback:
Currently using placeholder gradient backgrounds. The hero slider will work without images but will show colored gradients instead.

## Next.js Image Optimization:
In production, replace the `<div>` with `backgroundImage` in `HeroSection.tsx` with:
```tsx
import Image from 'next/image';

<Image
  src={slides[currentSlide].image}
  alt={slides[currentSlide].title}
  fill
  className="object-cover"
  priority
/>
```
