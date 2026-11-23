// One of FX4's photos: the WebP copies for browsers that take them (nearly all), the JPGs for the
// rest. `picture{display:contents}` in index.css keeps the <img> laid out as if it stood alone.
import type { CSSProperties } from 'react';
import { srcSet, type Photo } from '../data/photos';

export function Pic({ photo, sizes, className, priority = false }: { photo: Photo; sizes: string; className?: string; priority?: boolean }) {
  const style: CSSProperties | undefined = photo.pos ? { objectPosition: photo.pos } : undefined;
  return (
    <picture>
      <source type="image/webp" srcSet={srcSet(photo, 'webp')} sizes={sizes} />
      <img
        className={className}
        src={photo.src}
        srcSet={srcSet(photo)}
        sizes={sizes}
        alt={photo.alt}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={style}
      />
    </picture>
  );
}
